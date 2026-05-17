const { test } = require("./helpers/test-runner");
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

function createStoredClassWithMaterial() {
  return [
    {
      id: "class-1",
      type: "class",
      name: "AP Chemistry",
      dbClassId: 101,
      children: [
        {
          id: "material-1",
          type: "material",
          name: "Class Material",
          text: "Teacher note: focus on equilibrium and entropy.",
          uploads: [
            {
              name: "thermo-review.txt",
              content: "Use Hess's law and justify every sign change.",
              handler: "text",
              addedAt: "2026-05-12T00:00:00.000Z",
            },
            {
              name: "lab-graph-notes.txt",
              content: "Interpret the graph before solving the calculation.",
              handler: "text",
              addedAt: "2026-05-12T00:01:00.000Z",
            },
          ],
          createdAt: "2026-05-12T00:00:00.000Z",
          updatedAt: "2026-05-12T00:01:00.000Z",
        },
      ],
    },
  ];
}

function clickMaterialCheckbox(containerSelector, labelText) {
  const option = Array.from(
    document.querySelectorAll(`${containerSelector} .material-reference-option`),
  ).find((label) => label.textContent.includes(labelText));
  option.querySelector('input[type="checkbox"]').click();
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
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
    generateCramPlanFromSessions: async () => ({}),
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
    generateCramPlanFromSessions: async () => ({}),
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
    generateCramPlanFromSessions: async () => ({}),
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

test("quiz, cram, and assessment UI can target specific saved class material", async () => {
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

  const storedFolders = createStoredClassWithMaterial();
  let quizPayload = null;
  let cramPayload = null;
  let assessmentPayload = null;

  window.overlayApi = {
    getClassFolders: async () => storedFolders,
    getPreferences: async () => ({
      themeSource: "light",
      classFolders: storedFolders,
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
      assessmentPayload = payload;
      return {
        profileId: null,
        profileName: payload.profileName || "Template",
        testFormat: "Free response",
        conciseSummary: "References only selected saved material.",
        genericDifferences: [],
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
    extractStudyMaterial: async () => [],
    generateCramPlan: async () => ({}),
    generateCramPlanFromSessions: async (payload) => {
      cramPayload = payload;
      return {
        title: "Unit 5 Guide",
        summary: "Focus on Hess's law before graph interpretation.",
        sourceSummary: "Uses selected class material only.",
        estimatedTotalMinutes: 40,
        recommendedFirstTask: "Review Hess's law first.",
        tasks: [
          {
            title: "Review Hess's law first.",
            topic: "Hess's law",
            body: "Rebuild the equation chain and justify every sign change out loud.",
            keyTakeaways: [
              "Track direction changes carefully.",
              "Match enthalpy signs before adding equations.",
            ],
            estimatedMinutes: 20,
            priority: "must-review",
            sourceLabels: ["thermo-review.txt"],
            status: "not-started",
            quizEnabled: true,
            quizPreview: {
              title: "Hess's law preview",
              description: "Open a short quiz on sign changes and equation reversal.",
              questionCount: 3,
            },
            quizId: null,
            lastScore: null,
          },
          {
            title: "Rehearse graph interpretation.",
            topic: "Graph interpretation",
            body: "Read the graph first, then explain what the sign or slope means before calculating.",
            keyTakeaways: [
              "Interpret the graph before solving.",
              "Tie each visual change back to the concept.",
            ],
            estimatedMinutes: 20,
            priority: "quick-win",
            sourceLabels: ["thermo-review.txt"],
            status: "not-started",
            quizEnabled: false,
            quizPreview: null,
            quizId: null,
            lastScore: null,
          },
          {
            title: "Run one final recall pass.",
            topic: "Mixed recall",
            body: "Spend the last few minutes testing yourself from memory without looking at notes.",
            keyTakeaways: [
              "Answer from memory first.",
              "Only check notes after committing to an answer.",
            ],
            estimatedMinutes: 10,
            priority: "if-time",
            sourceLabels: ["thermo-review.txt"],
            status: "not-started",
            quizEnabled: true,
            quizPreview: {
              title: "Final recall preview",
              description: "Launch a mixed check before you stop studying.",
              questionCount: 3,
            },
            quizId: null,
            lastScore: null,
          },
        ],
      };
    },
    generateQuiz: async (payload) => {
      quizPayload = payload;
      return {
        title: "Targeted Quiz",
        subtitle: "Uses selected class material only.",
        questions: [],
      };
    },
  };

  const homePath = path.join(__dirname, "..", "src", "home.js");
  delete require.cache[require.resolve(homePath)];
  require(homePath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector(".folder-open-button").click();

  document.querySelector("#new-folder").click();
  Array.from(document.querySelectorAll(".folder-action-menu-item"))
    .find((button) => button.textContent.includes("Quiz"))
    .click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-quiz-view").hidden, false);
    assert.equal(
      document.querySelectorAll("#quiz-class-material-picker input[type=\"checkbox\"]").length,
      3,
    );
  });

  clickMaterialCheckbox("#quiz-class-material-picker", "lab-graph-notes.txt");
  clickMaterialCheckbox("#quiz-class-material-picker", "Class Material Notes");
  document.querySelector('input[name="quiz-question-count"][value="8"]').click();
  document.querySelector("#generate-quiz-button").click();

  await waitFor(() => {
    assert.equal(Boolean(quizPayload), true);
    assert.equal(quizPayload.questionCount, 8);
    assert.match(quizPayload.uploadedMaterial, /thermo-review\.txt/i);
    assert.doesNotMatch(quizPayload.uploadedMaterial, /lab-graph-notes\.txt/i);
    assert.doesNotMatch(quizPayload.uploadedMaterial, /Teacher note: focus on equilibrium and entropy\./i);
  });

  document.querySelector("#close-quiz-modal").click();

  document.querySelector("#new-folder").click();
  Array.from(document.querySelectorAll(".folder-action-menu-item"))
    .find((button) => button.textContent.includes("Cram Mode"))
    .click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-cram-view").hidden, false);
    assert.equal(
      document.querySelectorAll("#cram-class-material-picker input[type=\"checkbox\"]").length,
      3,
    );
  });

  clickMaterialCheckbox("#cram-class-material-picker", "lab-graph-notes.txt");
  clickMaterialCheckbox("#cram-class-material-picker", "Class Material Notes");
  document.querySelector("#cram-exam-name").value = "Unit 5 Test";
  document.querySelector("#generate-cram-button").click();

  await waitFor(() => {
    assert.equal(Boolean(cramPayload), true);
    assert.match(cramPayload.uploadedMaterial, /thermo-review\.txt/i);
    assert.doesNotMatch(cramPayload.uploadedMaterial, /lab-graph-notes\.txt/i);
    assert.doesNotMatch(cramPayload.uploadedMaterial, /Teacher note: focus on equilibrium and entropy\./i);
  });

  document.querySelector("#cram-back-button").click();

  document.querySelector("#edit-current-class-button").click();
  document.querySelector("#open-assessment-config-button").click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-assessment-view").hidden, false);
    assert.equal(
      document.querySelectorAll("#assessment-class-material-picker input[type=\"checkbox\"]")
        .length,
      3,
    );
  });

  document.querySelector("#assessment-manager-create-button").click();
  clickMaterialCheckbox("#assessment-class-material-picker", "lab-graph-notes.txt");
  clickMaterialCheckbox("#assessment-class-material-picker", "Class Material Notes");
  document.querySelector("#assessment-profile-name").value = "Selected Sources Only";
  document
    .querySelector("#assessment-profile-name")
    .dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  document.querySelector("#assessment-save-button").click();

  await waitFor(() => {
    assert.equal(Boolean(assessmentPayload), true);
    assert.equal(
      assessmentPayload.uploadedMaterials.some((material) =>
        material.name === "thermo-review.txt",
      ),
      true,
    );
    assert.equal(
      assessmentPayload.uploadedMaterials.some((material) =>
        material.name === "lab-graph-notes.txt",
      ),
      false,
    );
    assert.equal(
      assessmentPayload.uploadedMaterials.some((material) =>
        material.name === "Class Material Notes",
      ),
      false,
    );
  });

  dom.window.close();
});

test("quiz generation autosaves a processing item and replaces it with the finished quiz", async () => {
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

  let persistedFolders = createStoredClassWithMaterial();
  const deferredQuiz = createDeferred();

  window.overlayApi = {
    getClassFolders: async () => persistedFolders,
    getPreferences: async () => ({
      themeSource: "light",
      classFolders: persistedFolders,
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
    extractStudyMaterial: async () => [],
    generateCramPlan: async () => ({}),
    generateCramPlanFromSessions: async () => ({}),
    generateQuiz: async () => deferredQuiz.promise,
  };

  const homePath = path.join(__dirname, "..", "src", "home.js");
  delete require.cache[require.resolve(homePath)];
  require(homePath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  document.querySelector(".folder-open-button").click();
  document.querySelector("#new-folder").click();
  Array.from(document.querySelectorAll(".folder-action-menu-item"))
    .find((button) => button.textContent.includes("Quiz"))
    .click();

  await waitFor(() => {
    assert.equal(document.querySelector("#home-quiz-view").hidden, false);
  });

  document.querySelector("#generate-quiz-button").click();

  await waitFor(() => {
    const processingQuiz = persistedFolders[0].children.find(
      (child) => child.type === "quiz" && child.status === "processing",
    );
    assert.equal(processingQuiz.name, "Quiz - Processing");
    assert.equal(
      document.querySelector(".folder-card-title-processing .jumping-dots") !== null,
      true,
    );
  });

  deferredQuiz.resolve({
    title: "Thermo Check",
    subtitle: "Saved automatically.",
    questions: [
      {
        prompt: "What does Hess's law preserve?",
        options: ["Total enthalpy", "Mass only"],
        correctIndex: 0,
        explanation: "Hess's law tracks total enthalpy across equivalent paths.",
      },
    ],
  });

  await waitFor(() => {
    const savedQuiz = persistedFolders[0].children.find(
      (child) => child.type === "quiz" && child.status === "ready",
    );
    assert.equal(savedQuiz.name, "Thermo Check");
    assert.equal(savedQuiz.questionCount, 1);
    assert.equal(savedQuiz.quizData.title, "Thermo Check");
    assert.equal(document.querySelector("#save-quiz-button").hidden, true);
  });

  dom.window.close();
});
