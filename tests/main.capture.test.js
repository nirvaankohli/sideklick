const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadCaptureModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "desktop", "src", "main", "capture.ts")
  );
}

function createThumbnail({
  width,
  height,
  jpegValue = "jpeg-bytes",
  resizedThumbnail = null,
  empty = false,
} = {}) {
  return {
    isEmpty() {
      return empty;
    },
    getSize() {
      return { width, height };
    },
    resize() {
      return resizedThumbnail || createThumbnail({ width, height, jpegValue });
    },
    toJPEG(quality) {
      assert.equal(typeof quality, "number");
      return Buffer.from(jpegValue);
    },
  };
}

test("capturePrimaryDisplayScreenshot selects the matching display source and returns a jpeg data URL", async () => {
  const { capturePrimaryDisplayScreenshot } = await loadCaptureModule();
  const matchingThumbnail = createThumbnail({
    width: 1000,
    height: 500,
    jpegValue: "matching-jpeg",
  });
  const fallbackThumbnail = createThumbnail({
    width: 1000,
    height: 500,
    jpegValue: "fallback-jpeg",
  });

  const screen = {
    getPrimaryDisplay() {
      return {
        id: 22,
        size: { width: 1000, height: 500 },
      };
    },
  };
  const desktopCapturer = {
    async getSources(options) {
      assert.deepEqual(options, {
        types: ["screen"],
        thumbnailSize: {
          width: 1000,
          height: 500,
        },
      });

      return [
        { display_id: "11", thumbnail: fallbackThumbnail },
        { display_id: "22", thumbnail: matchingThumbnail },
      ];
    },
  };

  const result = await capturePrimaryDisplayScreenshot({
    desktopCapturer,
    screen,
  });

  assert.equal(
    result,
    `data:image/jpeg;base64,${Buffer.from("matching-jpeg").toString("base64")}`,
  );
});

test("capturePrimaryDisplayScreenshot resizes oversized thumbnails before encoding", async () => {
  const { capturePrimaryDisplayScreenshot } = await loadCaptureModule();
  let resizeCalled = false;
  const resizedThumbnail = createThumbnail({
    width: 1280,
    height: 720,
    jpegValue: "resized-jpeg",
  });
  const oversizedThumbnail = {
    isEmpty() {
      return false;
    },
    getSize() {
      return { width: 3000, height: 2000 };
    },
    resize(options) {
      resizeCalled = true;
      assert.deepEqual(options, {
        width: 1280,
        height: 720,
        quality: "good",
      });
      return resizedThumbnail;
    },
  };

  const result = await capturePrimaryDisplayScreenshot({
    desktopCapturer: {
      async getSources() {
        return [{ display_id: "5", thumbnail: oversizedThumbnail }];
      },
    },
    screen: {
      getPrimaryDisplay() {
        return {
          id: 5,
          size: { width: 1920, height: 1080 },
        };
      },
    },
  });

  assert.equal(resizeCalled, true);
  assert.equal(
    result,
    `data:image/jpeg;base64,${Buffer.from("resized-jpeg").toString("base64")}`,
  );
});

test("capturePrimaryDisplayScreenshot throws when no usable thumbnail exists", async () => {
  const { capturePrimaryDisplayScreenshot } = await loadCaptureModule();
  await assert.rejects(
    capturePrimaryDisplayScreenshot({
      desktopCapturer: {
        async getSources() {
          return [
            {
              display_id: "1",
              thumbnail: createThumbnail({
                width: 100,
                height: 100,
                empty: true,
              }),
            },
          ];
        },
      },
      screen: {
        getPrimaryDisplay() {
          return {
            id: 1,
            size: { width: 800, height: 600 },
          };
        },
      },
    }),
    /Could not capture a screen screenshot/,
  );
});

test("shouldCaptureAutomaticScreenshot auto-captures any action when policy is automatic and no screenshot is attached yet", () => {
  return loadCaptureModule().then(({ shouldCaptureAutomaticScreenshot }) => {
    const automaticPolicy = {
      screenshotPolicy: "automatic",
      syncConsent: "unknown",
    };
    const manualPolicy = {
      screenshotPolicy: "manual",
      syncConsent: "unknown",
    };

    assert.equal(
      shouldCaptureAutomaticScreenshot(
        { actionType: "explain" },
        automaticPolicy,
      ),
      true,
    );
    assert.equal(
      shouldCaptureAutomaticScreenshot(
        { actionType: " chat " },
        automaticPolicy,
      ),
      true,
    );
    assert.equal(
      shouldCaptureAutomaticScreenshot(
        {
          actionType: "explain",
          screenshotDataUrl: "data:image/png;base64,abc",
        },
        automaticPolicy,
      ),
      false,
    );
    assert.equal(
      shouldCaptureAutomaticScreenshot({ actionType: "" }, automaticPolicy),
      false,
    );
    assert.equal(
      shouldCaptureAutomaticScreenshot({ actionType: "explain" }, manualPolicy),
      false,
    );
  });
});

test("enforceScreenshotPolicy blocks manual uploads unless the screenshot policy allows them", () => {
  return loadCaptureModule().then(
    ({
      canAttachManualScreenshot,
      enforceScreenshotPolicy,
      getScreenshotPolicyErrorMessage,
    }) => {
      const disabledPolicy = {
        screenshotPolicy: "disabled",
        syncConsent: "unknown",
      };
      const manualPolicy = {
        screenshotPolicy: "manual",
        syncConsent: "unknown",
      };

      assert.equal(canAttachManualScreenshot(disabledPolicy), false);
      assert.equal(canAttachManualScreenshot(manualPolicy), true);
      assert.equal(
        enforceScreenshotPolicy(
          { screenshotDataUrl: "data:image/png;base64,abc" },
          manualPolicy,
        ),
        "data:image/png;base64,abc",
      );
      assert.throws(
        () =>
          enforceScreenshotPolicy(
            { screenshotDataUrl: "data:image/png;base64,abc" },
            disabledPolicy,
          ),
        new RegExp(
          getScreenshotPolicyErrorMessage(disabledPolicy).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      );
    },
  );
});

test("redaction helpers replace embedded image payloads recursively", () => {
  return loadCaptureModule().then(
    ({ redactCapturePayload, redactImageDataUrl }) => {
      assert.equal(
        redactImageDataUrl("data:image/png;base64,abc"),
        "[redacted image payload]",
      );
      assert.equal(redactImageDataUrl("plain text"), "plain text");

      assert.deepEqual(
        redactCapturePayload({
          topLevel: "data:image/jpeg;base64,123",
          nested: ["keep me", { screenshot: "data:image/png;base64,xyz" }],
        }),
        {
          topLevel: "[redacted image payload]",
          nested: ["keep me", { screenshot: "[redacted image payload]" }],
        },
      );
    },
  );
});
