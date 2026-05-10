const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { JSDOM } = require("jsdom");

function createDom() {
  return new JSDOM(
    `<!doctype html>
<html>
  <body>
    <main class="window-shell" data-mode="expanded" data-tone="light">
      <button id="theme-icon-toggle"></button>
      <button id="open-cram-mode"></button>
      <button id="shrink-window"></button>
      <button id="stop-session"></button>
      <button id="close-window"></button>
      <button id="compact-close-window"></button>
      <button id="restore-window"></button>
      <button id="compact-star-button"></button>
      <p id="session-class-label"></p>
      <h1 id="session-name-label"></h1>
      <section id="home-session-view">
        <div id="chat-thread"></div>
        <form id="chat-form">
          <div class="chat-attach-shell">
            <button id="chat-attach-trigger" type="button"></button>
            <div id="chat-attach-menu" hidden>
              <button id="attach-screenshot-button" type="button"></button>
              <button id="attach-clipboard-button" type="button"></button>
            </div>
          </div>
          <textarea id="chat-input"></textarea>
        </form>
      </section>
      <section id="cram-intake-view" hidden>
        <form id="cram-form">
          <input id="cram-exam-name" name="examName" />
          <select id="cram-time-left" name="timeLeft">
            <option value="">Select time</option>
            <option value="Tonight">Tonight</option>
          </select>
          <textarea id="cram-material" name="material"></textarea>
          <textarea id="cram-notes" name="notes"></textarea>
          <p id="cram-intake-empty-state" hidden></p>
          <button id="cram-cancel" type="button"></button>
          <button id="cram-submit" type="submit"></button>
        </form>
      </section>
      <section id="cram-results-view" hidden>
        <h2 id="cram-results-title"></h2>
        <p id="cram-results-loading" hidden></p>
        <p id="cram-results-empty-state" hidden></p>
        <button id="cram-start-over" type="button"></button>
        <div id="cram-results-sections"></div>
      </section>
      <button id="resize-handle"></button>
    </main>
  </body>
</html>`,
    { url: "http://localhost/" },
  );
}

function installAnimationFrameStub(dom) {
  dom.window.requestAnimationFrame = (callback) => {
    return dom.window.setTimeout(() => callback(Date.now()), 0);
  };
  dom.window.cancelAnimationFrame = (handle) => {
    dom.window.clearTimeout(handle);
  };
}

async function waitFor(assertion, timeoutMs = 1500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  assertion();
}

test("incoming payload shows action plus pasted text card and sends the assist request directly", async () => {
  const dom = createDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.FileReader = class FakeFileReader {};

  let incomingPayloadHandler;
  let expandWindowCalls = 0;
  let assistCalls = 0;
  let submittedPayload = null;

  window.overlayApi = {
    getWindowBounds: async () => ({ width: 100, height: 100 }),
    resizeWindow: async () => ({}),
    setThemeSource: async () => ({ shouldUseDarkColors: false }),
    minimizeToDock: async () => ({}),
    stopSession: async () => ({}),
    closeWindow: async () => ({}),
    expandWindow: async () => {
      expandWindowCalls += 1;
      return {};
    },
    assist: async (payload) => {
      assistCalls += 1;
      submittedPayload = payload;
      return {
        interactionId: 42,
        answer: "It means the variable references the root shell element.",
        nextStep: "Compare it to the chat thread selector.",
      };
    },
    submitFeedback: async () => ({}),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: (callback) => {
      incomingPayloadHandler = callback;
    },
    getCurrentSession: async () => ({
      classId: 7,
      className: "AP Biology",
      sessionName: "Meiosis Review",
      sessionNotes: "Need help with vocab",
    }),
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  incomingPayloadHandler({
    action_type: "explain",
    selected_text: "const root = document.querySelector('.window-shell');",
    page_title: "Renderer notes",
    click_function: "restore-window",
  });

  await waitFor(() => {
    const assistantMessages = document.querySelectorAll(".chat-message.assistant .chat-message-copy");
    const finalAssistantMessage = assistantMessages[assistantMessages.length - 1]?.textContent;
    assert.equal(
      finalAssistantMessage,
      "It means the variable references the root shell element.",
    );
  });

  assert.equal(expandWindowCalls, 1);
  assert.equal(assistCalls, 1);
  assert.equal(submittedPayload.actionType, "explain");
  assert.equal(
    submittedPayload.selectedText,
    "const root = document.querySelector('.window-shell');",
  );

  const userMessages = document.querySelectorAll(
    ".chat-message.user:not(.incoming-payload) .chat-message-copy",
  );
  assert.equal(
    userMessages[userMessages.length - 1]?.textContent,
    "Explain this",
  );

  const pastedMessage = document.querySelector(".chat-message.incoming-payload .incoming-payload-text");
  assert.equal(
    pastedMessage?.textContent,
    "const root = document.querySelector('.window-shell');",
  );

  dom.window.close();
});

test("manual chat submit shows the typed message instead of the action label", async () => {
  const dom = createDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.FileReader = class FakeFileReader {};

  let assistCalls = 0;

  window.overlayApi = {
    getWindowBounds: async () => ({ width: 100, height: 100 }),
    resizeWindow: async () => ({}),
    setThemeSource: async () => ({ shouldUseDarkColors: false }),
    minimizeToDock: async () => ({}),
    stopSession: async () => ({}),
    closeWindow: async () => ({}),
    expandWindow: async () => ({}),
    assist: async () => {
      assistCalls += 1;
      return {
        interactionId: 9,
        answer: "Short answer.",
        nextStep: "Keep going.",
      };
    },
    submitFeedback: async () => ({}),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: () => {},
    getCurrentSession: async () => ({
      classId: 7,
      className: "AP Biology",
      sessionName: "Meiosis Review",
      sessionNotes: "Need help with vocab",
    }),
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  const chatInput = document.querySelector("#chat-input");
  const chatForm = document.querySelector("#chat-form");
  chatInput.value = "What is meiosis?";
  chatForm.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));

  await waitFor(() => {
    assert.equal(assistCalls, 1);
  });

  const userMessages = document.querySelectorAll(
    ".chat-message.user:not(.incoming-payload) .chat-message-copy",
  );
  assert.equal(userMessages[userMessages.length - 1]?.textContent, "What is meiosis?");

  dom.window.close();
});

test("cram mode intake submits and renders all mocked result sections", async () => {
  const dom = createDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.FileReader = class FakeFileReader {};

  window.overlayApi = {
    getWindowBounds: async () => ({ width: 100, height: 100 }),
    resizeWindow: async () => ({}),
    setThemeSource: async () => ({ shouldUseDarkColors: false }),
    minimizeToDock: async () => ({}),
    stopSession: async () => ({}),
    closeWindow: async () => ({}),
    expandWindow: async () => ({}),
    assist: async () => ({ interactionId: 1, answer: "ok", nextStep: "ok" }),
    submitFeedback: async () => ({}),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: () => {},
    captureScreenshotAttachment: async () => null,
    readClipboardAttachment: async () => null,
    getCurrentSession: async () => ({
      classId: 7,
      className: "AP Biology",
      sessionName: "Meiosis Review",
      sessionNotes: "Need help with vocab",
    }),
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector("#open-cram-mode").click();
  document.querySelector("#cram-exam-name").value = "Calculus Final";
  document.querySelector("#cram-time-left").value = "Tonight";
  document.querySelector("#cram-material").value =
    "Derivatives\nIntegrals\nOptimization";
  document.querySelector("#cram-notes").value = "I always miss sign mistakes";
  document
    .querySelector("#cram-form")
    .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));

  await waitFor(() => {
    const headings = [
      ...document.querySelectorAll("#cram-results-sections .cram-result-section h3"),
    ].map((node) => node.textContent);
    assert.deepEqual(headings, [
      "Study First",
      "Study Next",
      "Skip If Needed",
      "Likely Questions",
      "Quick Self-Test",
      "Tonight's Plan",
    ]);
  }, 2500);

  assert.equal(document.querySelector("#cram-results-view").hidden, false);
  assert.equal(document.querySelector("#home-session-view").hidden, true);
  assert.equal(
    document.querySelector("#cram-results-title").textContent,
    "Calculus Final • Tonight",
  );

  dom.window.close();
});
