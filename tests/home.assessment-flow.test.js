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
