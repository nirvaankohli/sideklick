const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadSessionModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "src", "main", "session.ts")).href
  );
}

function createWindowDouble() {
  const sent = [];
  return {
    sent,
    shown: false,
    focused: false,
    closed: false,
    destroyed: false,
    show() {
      this.shown = true;
    },
    focus() {
      this.focused = true;
    },
    close() {
      this.closed = true;
    },
    isDestroyed() {
      return this.destroyed;
    },
    webContents: {
      send(channel, payload) {
        sent.push({ channel, payload });
      },
    },
  };
}

test("session lifecycle starts a session, persists state, and creates chat when missing", () => {
  return loadSessionModule().then(({ createSessionLifecycle }) => {
  let storedCurrentSession = null;
  const windowsByKey = new Map();
  const createdWindows = [];

  const lifecycle = createSessionLifecycle({
    createSession(classId, title, notes) {
      assert.equal(classId, 41);
      assert.equal(title, "Chapter 2 Review");
      assert.equal(notes, "focus on stoichiometry");
      return {
        id: 88,
        startedAt: "2026-05-05T10:00:00.000Z",
      };
    },
    endSession() {
      throw new Error("not used");
    },
    getClassProfileById(id) {
      return id === 41 ? { id: 41 } : null;
    },
    saveClassProfile() {
      throw new Error("should not create a new class");
    },
    getCurrentSessionState() {
      return storedCurrentSession;
    },
    setCurrentSessionState(nextSession) {
      storedCurrentSession = nextSession;
      return nextSession;
    },
    clearCurrentSessionState() {
      storedCurrentSession = null;
    },
    getStoredClassFolders() {
      return [];
    },
    setStoredClassFolders(nextFolders) {
      return nextFolders;
    },
    windowsByKey,
    createManagedWindow(windowKey, templateKey) {
      createdWindows.push({ windowKey, templateKey });
      const win = createWindowDouble();
      windowsByKey.set(windowKey, win);
      return win;
    },
    notifyHomeWindowFoldersChanged() {},
  });

  const result = lifecycle.startSession({
    classId: 41,
    className: "Chemistry",
    sessionName: "Chapter 2 Review",
    sessionNotes: "focus on stoichiometry",
  });

  assert.deepEqual(createdWindows, [{ windowKey: "chat", templateKey: "chat" }]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.currentSession, {
    classId: 41,
    className: "Chemistry",
    sessionName: "Chapter 2 Review",
    sessionNotes: "focus on stoichiometry",
    sessionId: 88,
    sessionStartedAt: "2026-05-05T10:00:00.000Z",
  });
  assert.deepEqual(lifecycle.getCurrentSession(), result.currentSession);
  });
});

test("session lifecycle creates a backing class and notifies an existing chat window", () => {
  return loadSessionModule().then(({ createSessionLifecycle }) => {
  let storedCurrentSession = null;
  const chatWindow = createWindowDouble();
  const windowsByKey = new Map([["chat", chatWindow]]);
  let savedClassPayload = null;

  const lifecycle = createSessionLifecycle({
    createSession(classId) {
      return {
        id: 15,
        startedAt: "2026-05-05T11:00:00.000Z",
        classId,
      };
    },
    endSession() {
      throw new Error("not used");
    },
    getClassProfileById() {
      return null;
    },
    saveClassProfile(payload) {
      savedClassPayload = payload;
      return { id: 55 };
    },
    getCurrentSessionState() {
      return storedCurrentSession;
    },
    setCurrentSessionState(nextSession) {
      storedCurrentSession = nextSession;
      return nextSession;
    },
    clearCurrentSessionState() {
      storedCurrentSession = null;
    },
    getStoredClassFolders() {
      return [];
    },
    setStoredClassFolders(nextFolders) {
      return nextFolders;
    },
    windowsByKey,
    createManagedWindow() {
      throw new Error("should reuse existing chat window");
    },
    notifyHomeWindowFoldersChanged() {},
  });

  const result = lifecycle.startSession({
    className: "Calculus",
    teacherName: "Ms. Lin",
    teacherNotes: "Derivatives",
    description: "Limits and derivatives",
    additionalNotes: "Quiz Friday",
    sessionName: "Derivatives Help",
    sessionNotes: "chain rule",
  });

  assert.deepEqual(savedClassPayload, {
    className: "Calculus",
    subject: "Calculus",
    currentUnit: null,
    teacherFocus: "Teacher: Ms. Lin | Focus: Derivatives",
    keyConcepts: [],
    notes: "Description: Limits and derivatives\nAdditional notes: Quiz Friday",
  });
  assert.equal(chatWindow.shown, true);
  assert.equal(chatWindow.focused, true);
  assert.deepEqual(chatWindow.sent, [
    {
      channel: "session:changed",
      payload: result.currentSession,
    },
  ]);
  assert.equal(result.currentSession.classId, 55);
  });
});

test("session lifecycle stops a session, archives it into folders, and closes chat", () => {
  return loadSessionModule().then(({ createSessionLifecycle }) => {
  let storedCurrentSession = {
    classId: 7,
    className: "Biology",
    sessionId: 90,
    sessionName: "Cell Review",
  };
  let storedClassFolders = [
    {
      id: "class-1",
      type: "class",
      name: "Biology",
      dbClassId: 7,
      children: [
        { type: "session", dbSessionId: 90, id: "session-90-old" },
        { type: "quiz", id: "quiz-1" },
      ],
    },
  ];
  const chatWindow = createWindowDouble();
  const homeWindow = createWindowDouble();
  const windowsByKey = new Map([
    ["chat", chatWindow],
    ["home", homeWindow],
  ]);
  const notifiedFolders = [];

  const lifecycle = createSessionLifecycle({
    createSession() {
      throw new Error("not used");
    },
    endSession(sessionId) {
      assert.equal(sessionId, 90);
      return {
        id: 90,
        title: "Cell Review",
        startedAt: "2026-05-05T09:00:00.000Z",
        endedAt: "2026-05-05T10:00:00.000Z",
        notes: "notes",
        summary: "summary",
        carryForward: "next step",
        requestCount: 4,
        screenshotPreview: "preview",
        keyTopics: ["mitosis"],
      };
    },
    getClassProfileById() {
      return null;
    },
    saveClassProfile() {
      throw new Error("not used");
    },
    getCurrentSessionState() {
      return storedCurrentSession;
    },
    setCurrentSessionState(nextSession) {
      storedCurrentSession = nextSession;
      return nextSession;
    },
    clearCurrentSessionState() {
      storedCurrentSession = null;
    },
    getStoredClassFolders() {
      return storedClassFolders;
    },
    setStoredClassFolders(nextFolders) {
      storedClassFolders = nextFolders;
      return nextFolders;
    },
    windowsByKey,
    createManagedWindow() {
      throw new Error("not used");
    },
    notifyHomeWindowFoldersChanged(nextFolders) {
      notifiedFolders.push(nextFolders);
    },
  });

  const result = lifecycle.stopSession();

  assert.deepEqual(result, { ok: true });
  assert.equal(storedCurrentSession, null);
  assert.equal(chatWindow.closed, true);
  assert.equal(homeWindow.shown, true);
  assert.equal(homeWindow.focused, true);
  assert.equal(notifiedFolders.length, 1);
  assert.deepEqual(storedClassFolders[0].children[0], {
    id: "session-90",
    type: "session",
    name: "Cell Review",
    classId: 7,
    dbSessionId: 90,
    startedAt: "2026-05-05T09:00:00.000Z",
    endedAt: "2026-05-05T10:00:00.000Z",
    notes: "notes",
    summary: "summary",
    carryForward: "next step",
    requestCount: 4,
    screenshotPreview: "preview",
    keyTopics: ["mitosis"],
  });
  assert.deepEqual(storedClassFolders[0].children[1], { type: "quiz", id: "quiz-1" });
  });
});

test("session lifecycle rejects starting a session without a valid class name", () => {
  return loadSessionModule().then(({ createSessionLifecycle }) => {
  const lifecycle = createSessionLifecycle({
    createSession() {
      throw new Error("not used");
    },
    endSession() {
      throw new Error("not used");
    },
    getClassProfileById() {
      return null;
    },
    saveClassProfile() {
      throw new Error("not used");
    },
    getCurrentSessionState() {
      return null;
    },
    setCurrentSessionState(nextSession) {
      return nextSession;
    },
    clearCurrentSessionState() {},
    getStoredClassFolders() {
      return [];
    },
    setStoredClassFolders(nextFolders) {
      return nextFolders;
    },
    windowsByKey: new Map(),
    createManagedWindow() {
      throw new Error("not used");
    },
    notifyHomeWindowFoldersChanged() {},
  });

  assert.throws(
    () => lifecycle.startSession({ className: "   ", sessionName: "Review" }),
    /Cannot start a session without a valid class name/,
  );
  });
});
