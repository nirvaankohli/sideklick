const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

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
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  assertion();
}

function createHomeDom() {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "src", "home.html"),
    "utf8",
  );
  return new JSDOM(html, { url: "http://localhost/" });
}

function createFakeUploadFile(name, content, type = "text/plain") {
  return {
    name,
    type,
    async arrayBuffer() {
      return Buffer.from(content, "utf8");
    },
  };
}

test("class configure flow opens the assessment page and still saves the class", async () => {
  const dom = createHomeDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
  global.Node = dom.window.Node;
  global.Element = dom.window.Element;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.File = dom.window.File;
  global.navigator = dom.window.navigator;
  global.FileReader = class FakeFileReader {};

  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });

  let persistedFolders = [];
  let saveClassProfileCalls = 0;

  window.overlayApi = {
    getClassFolders: async () => [],
    getPreferences: async () => ({
      themeSource: "light",
      classFolders: [],
      currentSession: null,
    }),
    getPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    getAuthSession: async () => ({
      user: {
        email: "student@example.com",
        displayName: "Student",
      },
    }),
    updateClassFolders: async (folders) => {
      persistedFolders = folders;
      return folders;
    },
    saveClassProfile: async (payload) => {
      saveClassProfileCalls += 1;
      return {
        classProfile: {
          id: 101,
          ...payload,
        },
      };
    },
    setThemeSource: async () => ({
      themeSource: "light",
      shouldUseDarkColors: false,
    }),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onClassFoldersChanged: () => {},
    onSessionChanged: () => {},
    updatePrivacySettings: async (patch) => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
      ...patch,
    }),
    setPrivacySettings: async (settings) => settings,
    resetPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    logoutAccount: async () => null,
    exportAccount: async () => ({}),
    deleteAccount: async () => ({}),
    extractStudyMaterial: async () => [],
    generateCramPlan: async () => ({}),
    generateQuiz: async () => ({ questions: [] }),
  };

  const homePath = path.join(__dirname, "..", "src", "home.js");
  delete require.cache[require.resolve(homePath)];
  require(homePath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector("#new-folder").click();
  document.querySelector(".folder-action-menu-item").click();

  document.querySelector("#class-course-input").value = "AP Biology";
  document.querySelector("#open-assessment-config-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-assessment-view").hidden, false);
    assert.equal(document.querySelector("#class-modal-backdrop").hidden, true);
  });

  assert.equal(document.querySelector("#assessment-empty-state").hidden, false);
  document.querySelector("#assessment-manager-create-button").click();
  document.querySelector("#assessment-profile-name").value = "Unit tests";
  document
    .querySelector("#assessment-profile-name")
    .dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  document.querySelector("#assessment-grading-notes").value =
    "Teacher wants steps shown.";
  document
    .querySelector("#assessment-grading-notes")
    .dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  document.querySelector("#assessment-save-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-assessment-view").hidden, true);
    assert.equal(document.querySelector("#class-modal-backdrop").hidden, false);
  });

  document.querySelector("#save-class-modal").click();

  await waitFor(() => {
    assert.equal(saveClassProfileCalls, 1);
    assert.equal(document.querySelector("#class-modal-backdrop").hidden, true);
    assert.deepEqual(
      persistedFolders.map((folder) => ({
        name: folder.name,
        assessmentProfiles: folder.assessmentProfiles.length,
        activeProfileName: folder.assessmentProfile?.name,
      })),
      [
        {
          name: "AP Biology",
          assessmentProfiles: 1,
          activeProfileName: "Unit tests",
        },
      ],
    );
  });

  dom.window.close();
});

test("class material upload saves extracted content and shows saved uploads when reopened", async () => {
  const dom = createHomeDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
  global.Node = dom.window.Node;
  global.Element = dom.window.Element;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.File = dom.window.File;
  global.navigator = dom.window.navigator;
  global.FileReader = class FakeFileReader {};

  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });

  let persistedFolders = [];
  let extractStudyMaterialCalls = 0;

  window.overlayApi = {
    getClassFolders: async () => [],
    getPreferences: async () => ({
      themeSource: "light",
      classFolders: [],
      currentSession: null,
    }),
    getPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    getAuthSession: async () => ({
      user: {
        email: "student@example.com",
        displayName: "Student",
      },
    }),
    updateClassFolders: async (folders) => {
      persistedFolders = folders;
      return folders;
    },
    saveClassProfile: async (payload) => ({
      classProfile: {
        id: 101,
        ...payload,
      },
    }),
    setThemeSource: async () => ({
      themeSource: "light",
      shouldUseDarkColors: false,
    }),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onClassFoldersChanged: () => {},
    onSessionChanged: () => {},
    updatePrivacySettings: async (patch) => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
      ...patch,
    }),
    setPrivacySettings: async (settings) => settings,
    resetPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    logoutAccount: async () => null,
    exportAccount: async () => ({}),
    deleteAccount: async () => ({}),
    extractStudyMaterial: async () => {
      extractStudyMaterialCalls += 1;
      return [
        {
          name: "osmosis-notes.txt",
          content: "Osmosis moves water across a semipermeable membrane.",
          handler: "text",
          originalCharacters: 84,
          compressedCharacters: 55,
          estimatedTokenSavings: 7,
        },
      ];
    },
    generateCramPlan: async () => ({}),
    generateQuiz: async () => ({ questions: [] }),
  };

  const homePath = path.join(__dirname, "..", "src", "home.js");
  delete require.cache[require.resolve(homePath)];
  require(homePath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector("#new-folder").click();
  document.querySelector(".folder-action-menu-item").click();
  document.querySelector("#class-course-input").value = "AP Biology";
  document.querySelector("#save-class-modal").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-modal-backdrop").hidden, true);
    assert.equal(document.querySelectorAll(".folder-open-button").length, 1);
  });

  document.querySelector(".folder-open-button").click();
  document.querySelector("#new-folder").click();
  const classMaterialAction = Array.from(
    document.querySelectorAll(".folder-action-menu-item"),
  ).find((button) => button.textContent.includes("Class Material"));
  classMaterialAction.click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-material-backdrop").hidden, false);
  });

  const uploadInput = document.querySelector("#class-material-file");
  Object.defineProperty(uploadInput, "files", {
    configurable: true,
    value: [
      createFakeUploadFile(
        "osmosis-notes.txt",
        "Osmosis moves water across a semipermeable membrane.",
      ),
    ],
  });
  uploadInput.dispatchEvent(new dom.window.Event("change"));

  await waitFor(() => {
    assert.equal(extractStudyMaterialCalls, 1);
    assert.equal(
      document.querySelector("#class-material-file-status").textContent,
      "1 file loaded",
    );
  });

  document.querySelector("#save-class-material-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-material-backdrop").hidden, true);
    const materialItem = persistedFolders[0].children.find(
      (child) => child.type === "material",
    );
    assert.equal(Boolean(materialItem), true);
    assert.deepEqual(materialItem, {
      id: materialItem.id,
      type: "material",
      name: "Class Material",
      text: "",
      uploads: [
        {
          name: "osmosis-notes.txt",
          content: "Osmosis moves water across a semipermeable membrane.",
          handler: "text",
          originalCharacters: 84,
          compressedCharacters: 55,
          estimatedTokenSavings: 7,
          addedAt: materialItem.uploads[0].addedAt,
        },
      ],
      createdAt: materialItem.createdAt,
      updatedAt: materialItem.updatedAt,
    });
  });

  await waitFor(() => {
    assert.equal(
      Array.from(document.querySelectorAll(".folder-open-button")).some((button) =>
        button.textContent.includes("Class Material"),
      ),
      true,
    );
  });

  document.querySelector("#new-folder").click();
  const reopenClassMaterialAction = Array.from(
    document.querySelectorAll(".folder-action-menu-item"),
  ).find((button) => button.textContent.includes("Class Material"));
  reopenClassMaterialAction.click();

  await waitFor(() => {
    assert.equal(
      document.querySelector("#class-material-file-status").textContent,
      "1 file loaded",
    );
    assert.equal(
      document.querySelectorAll("#class-material-rollup .assessment-upload-rollup-chip")
        .length,
      1,
    );
  });

  dom.window.close();
});

test("assessment profile analysis can reference saved class material uploads", async () => {
  const dom = createHomeDom();
  installAnimationFrameStub(dom);

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
  global.Node = dom.window.Node;
  global.Element = dom.window.Element;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.File = dom.window.File;
  global.navigator = dom.window.navigator;
  global.FileReader = class FakeFileReader {};

  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });

  let analyzePayload = null;

  window.overlayApi = {
    getClassFolders: async () => [],
    getPreferences: async () => ({
      themeSource: "light",
      classFolders: [],
      currentSession: null,
    }),
    getPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    getAuthSession: async () => ({
      user: {
        email: "student@example.com",
        displayName: "Student",
      },
    }),
    updateClassFolders: async (folders) => folders,
    saveClassProfile: async (payload) => ({
      classProfile: {
        id: 101,
        ...payload,
      },
    }),
    analyzeAssessmentProfile: async (payload) => {
      analyzePayload = payload;
      return {
        profileId: null,
        profileName: payload.profileName || "Template",
        testFormat: "Free response",
        conciseSummary: "Uses shared class material.",
        genericDifferences: ["Grounded in uploaded class material."],
        exampleQuestions: [],
        gradingSignals: [],
        wordingPatterns: [],
        likelyQuestionMoves: [],
        quizAdjustments: [],
        cramAdjustments: [],
        sourceMaterialNames: payload.uploadedMaterials.map((material) => material.name),
      };
    },
    setThemeSource: async () => ({
      themeSource: "light",
      shouldUseDarkColors: false,
    }),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onClassFoldersChanged: () => {},
    onSessionChanged: () => {},
    updatePrivacySettings: async (patch) => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
      ...patch,
    }),
    setPrivacySettings: async (settings) => settings,
    resetPrivacySettings: async () => ({
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnly: false,
    }),
    logoutAccount: async () => null,
    exportAccount: async () => ({}),
    deleteAccount: async () => ({}),
    extractStudyMaterial: async () => [
      {
        name: "thermo-review.txt",
        content: "Explain heat flow, entropy, and equilibrium shifts.",
        handler: "text",
        originalCharacters: 70,
        compressedCharacters: 55,
        estimatedTokenSavings: 4,
      },
    ],
    generateCramPlan: async () => ({}),
    generateQuiz: async () => ({ questions: [] }),
  };

  const homePath = path.join(__dirname, "..", "src", "home.js");
  delete require.cache[require.resolve(homePath)];
  require(homePath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector("#new-folder").click();
  document.querySelector(".folder-action-menu-item").click();
  document.querySelector("#class-course-input").value = "AP Chemistry";
  document.querySelector("#save-class-modal").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-modal-backdrop").hidden, true);
  });

  document.querySelector(".folder-open-button").click();
  document.querySelector("#new-folder").click();
  const classMaterialAction = Array.from(
    document.querySelectorAll(".folder-action-menu-item"),
  ).find((button) => button.textContent.includes("Class Material"));
  classMaterialAction.click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-material-backdrop").hidden, false);
  });

  const uploadInput = document.querySelector("#class-material-file");
  Object.defineProperty(uploadInput, "files", {
    configurable: true,
    value: [
      createFakeUploadFile(
        "thermo-review.txt",
        "Explain heat flow, entropy, and equilibrium shifts.",
      ),
    ],
  });
  uploadInput.dispatchEvent(new dom.window.Event("change"));

  await waitFor(() => {
    assert.equal(
      document.querySelector("#class-material-file-status").textContent,
      "1 file loaded",
    );
  });

  document.querySelector("#save-class-material-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#class-material-backdrop").hidden, true);
  });

  document.querySelector("#edit-current-class-button").click();
  document.querySelector("#open-assessment-config-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-assessment-view").hidden, false);
  });

  document.querySelector("#assessment-manager-create-button").click();
  document.querySelector("#assessment-profile-name").value = "Thermo Style";
  document
    .querySelector("#assessment-profile-name")
    .dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  document.querySelector("#assessment-save-button").click();

  await waitFor(() => {
    assert.equal(Boolean(analyzePayload), true);
    assert.equal(
      analyzePayload.uploadedMaterials.some(
        (material) =>
          material.name === "thermo-review.txt" &&
          /entropy|equilibrium shifts/i.test(material.content),
      ),
      true,
    );
  });

  dom.window.close();
});
