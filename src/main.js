const path = require("path");
const fs = require("fs");
require("tsx/cjs");
const http = require("http");
const {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  nativeTheme,
  screen,
} = require("electron");
const {
  startServer,
  stopServer,
} = require("./main/server/index.ts");
const {
  createSession,
  endSession,
} = require("./main/server/services/sessions.ts");
const {
  getClassProfileById,
  saveClassProfile,
} = require("./main/server/services/classes.ts");
const {
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
  resolveWindowTemplate,
} = require("./config/windows");

const windowsByKey = new Map();
const windowState = new Map();
const ALLOWED_THEME_SOURCES = new Set(["system", "light", "dark"]);
const LOCAL_API_BASE_URL = "http://127.0.0.1:3001";
const INCOMING_HTTP_PORT = 4353;
const INCOMING_HTTP_HOST = "localhost";
let incomingMessageServer = null;

function normalizeSession(session) {
  if (!session || typeof session !== "object") {
    return null;
  }

  return {
    ...session,
    sessionMode: session.sessionMode === "review" ? "review" : "study",
  };
}

function getThemePreferencePath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

function readPreferences() {
  try {
    const preferencePath = getThemePreferencePath();
    if (!fs.existsSync(preferencePath)) {
      return {};
    }

    const raw = fs.readFileSync(preferencePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writePreferences(nextPreferences) {
  const preferencePath = getThemePreferencePath();
  fs.mkdirSync(path.dirname(preferencePath), { recursive: true });
  fs.writeFileSync(
    preferencePath,
    JSON.stringify(nextPreferences, null, 2),
    "utf8",
  );
}

function getPreferenceSnapshot() {
  const preferences = readPreferences();
  return {
    themeSource: ALLOWED_THEME_SOURCES.has(preferences.themeSource)
      ? preferences.themeSource
      : "system",
    hasLaunchedBefore: Boolean(preferences.hasLaunchedBefore),
    discoverySource: preferences.discoverySource || "",
    customerProfile: preferences.customerProfile || "",
    classFolders: Array.isArray(preferences.classFolders)
      ? preferences.classFolders
      : [],
    currentSession: normalizeSession(preferences.currentSession),
  };
}

function readStoredThemeSource() {
  const parsed = readPreferences();
  return ALLOWED_THEME_SOURCES.has(parsed.themeSource)
    ? parsed.themeSource
    : "system";
}

function persistThemeSource(themeSource) {
  const nextPreferences = {
    ...readPreferences(),
    themeSource,
  };
  writePreferences(nextPreferences);
}

function hasLaunchedBefore() {
  return Boolean(readPreferences().hasLaunchedBefore);
}

function markAppLaunched() {
  const nextPreferences = {
    ...readPreferences(),
    hasLaunchedBefore: true,
  };
  writePreferences(nextPreferences);
}

function getThemeState() {
  return {
    themeSource:
      nativeTheme.themeSource === "system" ? "system" : nativeTheme.themeSource,
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  };
}

function applyThemeSource(themeSource) {
  const nextSource = ALLOWED_THEME_SOURCES.has(themeSource)
    ? themeSource
    : "system";
  nativeTheme.themeSource = nextSource;
  persistThemeSource(nextSource);
  return getThemeState();
}

function getAnchorBounds(config) {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;
  const { width, height } = config.layout.compact;
  const { padding } = config.layout.anchor;

  return {
    x: workArea.x + workArea.width - width - padding,
    y: workArea.y + padding,
    width,
    height,
  };
}

function getDefaultBounds(config) {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;
  const { width, height } = config.layout.expanded;
  const { padding, topOffset } = config.layout.anchor;

  return {
    width,
    height,
    x: workArea.x + workArea.width - width - padding,
    y: workArea.y + topOffset,
  };
}

function sendThemeState() {
  const themeState = getThemeState();

  for (const { win } of windowState.values()) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("theme:changed", themeState);
    }
  }
}

function setWindowMode(win, mode) {
  const state = windowState.get(win.id);
  if (!state) {
    return;
  }

  const { config } = state;
  const currentBounds = win.getBounds();
  const {
    expanded: { width, height, minWidth, minHeight },
    compact,
  } = config.layout;

  if (mode === "compact") {
    const compactBounds = getAnchorBounds(config);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setBounds(compactBounds, true);
  } else {
    const expandedBounds = getDefaultBounds(config);
    const nextBounds = {
      x: currentBounds.x,
      y: currentBounds.y,
      width: Math.max(currentBounds.width, width, minWidth),
      height: Math.max(currentBounds.height, height, minHeight),
    };

    if (mode === "expanded" && currentBounds.width <= compact.width + 8) {
      win.setBounds(expandedBounds, true);
    } else {
      win.setBounds(nextBounds, true);
    }
  }

  state.mode = mode;
  win.webContents.send("window:mode", { mode });
}

function registerWindow(windowKey, templateKey, config, win) {
  windowsByKey.set(windowKey, win);
  windowState.set(win.id, {
    windowKey,
    templateKey,
    config,
    win,
    mode: config.startMode,
  });
}

function unregisterWindow(win) {
  const state = windowState.get(win.id);
  if (!state) {
    return;
  }

  windowsByKey.delete(state.windowKey);
  windowState.delete(win.id);
}

function createManagedWindow(
  windowKey,
  templateKey,
  config = resolveWindowTemplate(templateKey),
) {
  const bounds = getDefaultBounds(config);
  const {
    browserWindow,
    layout: {
      expanded: { minWidth, minHeight },
    },
  } = config;

  const win = new BrowserWindow({
    ...bounds,
    minWidth,
    minHeight,
    frame: browserWindow.frame,
    transparent: browserWindow.transparent,
    backgroundColor: "#00000000",
    alwaysOnTop: browserWindow.alwaysOnTop,
    resizable: browserWindow.resizable,
    roundedCorners: browserWindow.roundedCorners,
    hasShadow: browserWindow.hasShadow,
    maximizable: browserWindow.maximizable,
    fullscreenable: browserWindow.fullscreenable,
    show: false,
    skipTaskbar: browserWindow.skipTaskbar,
    title: config.title,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerWindow(windowKey, templateKey, config, win);

  win.loadFile(path.join(__dirname, config.htmlFile));

  win.once("ready-to-show", () => {
    win.show();
    sendThemeState();
    setWindowMode(win, config.startMode);
  });

  win.on("closed", () => {
    unregisterWindow(win);
  });

  return win;
}

function createStartupWindows(isFirstRun) {
  const startupConfigs = isFirstRun
    ? getFirstRunStartupWindowConfigs()
    : getStartupWindowConfigs();

  for (const { windowKey, templateKey, config } of startupConfigs) {
    if (!windowsByKey.has(windowKey)) {
      createManagedWindow(windowKey, templateKey, config);
    }
  }
}

async function startLocalBackend() {
  try {
    await startServer({
      host: "127.0.0.1",
      port: 3001,
    });
  } catch (error) {
    console.error("[local-backend] failed to start", error);
  }
}

async function callLocalApi(endpoint, options = {}) {
  const response = await fetch(`${LOCAL_API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const rawText = await response.text();
  let payload = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload && typeof payload.error === "string"
        ? payload.error
        : rawText || `Local API request failed for ${endpoint}`,
    );
  }

  return payload;
}

async function capturePrimaryDisplayScreenshot() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: Math.max(width, 1),
      height: Math.max(height, 1),
    },
  });

  const matchingSource =
    sources.find((source) => source.display_id === String(primaryDisplay.id)) ||
    sources[0];
  if (!matchingSource || matchingSource.thumbnail.isEmpty()) {
    throw new Error("Could not capture a screen screenshot.");
  }

  return matchingSource.thumbnail.toDataURL();
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function notifyChatWindowIncomingPayload(payload) {
  const chatWindow = windowsByKey.get("chat");
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.webContents.send("incoming:payload", payload);
  }
}

function focusOrCreateChatWindow() {
  let chatWindow = windowsByKey.get("chat");
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.show();
    chatWindow.focus();
    return chatWindow;
  }

  chatWindow = createManagedWindow("chat", "chat");
  return chatWindow;
}

function notifyHomeWindowFoldersChanged(classFolders) {
  const homeWindow = windowsByKey.get("home");
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.webContents.send("class-folders:changed", classFolders);
  }
}

function appendStoppedSessionToFolders(classFolders, session, persistedSession) {
  if (!Array.isArray(classFolders)) {
    return [];
  }

  return classFolders.map((folder) => {
    if (
      folder?.type !== "class" ||
      (folder.dbClassId !== session.classId &&
        String(folder.name || "").trim() !== String(session.className || "").trim())
    ) {
      return folder;
    }

    const existingChildren = Array.isArray(folder.children) ? folder.children : [];
    const sessionEntry = {
      id: `session-${persistedSession.id}`,
      type: "session",
      name: session.sessionName || persistedSession.title || "Session",
      dbSessionId: persistedSession.id,
      startedAt: persistedSession.startedAt,
      endedAt: persistedSession.endedAt,
      notes: persistedSession.notes,
      summary: persistedSession.summary,
      carryForward: persistedSession.carryForward,
    };
    const dedupedChildren = existingChildren.filter(
      (child) => child?.type !== "session" || child.dbSessionId !== persistedSession.id,
    );

    return {
      ...folder,
      children: [sessionEntry, ...dedupedChildren],
    };
  });
}

function buildBackendClassPayloadFromSession(session) {
  const noteParts = [
    session?.description ? `Description: ${session.description}` : null,
    session?.additionalNotes
      ? `Additional notes: ${session.additionalNotes}`
      : null,
  ].filter(Boolean);
  const teacherFocusParts = [
    session?.teacherName ? `Teacher: ${session.teacherName}` : null,
    session?.teacherNotes ? `Focus: ${session.teacherNotes}` : null,
  ].filter(Boolean);

  return {
    className: typeof session?.className === "string" ? session.className : "",
    subject: typeof session?.className === "string" ? session.className : "",
    currentUnit: null,
    teacherFocus:
      teacherFocusParts.length > 0 ? teacherFocusParts.join(" | ") : null,
    keyConcepts: [],
    notes: noteParts.length > 0 ? noteParts.join("\n") : null,
  };
}

function ensureSessionClassId(session) {
  const existingClassId =
    typeof session?.classId === "number" && session.classId > 0
      ? session.classId
      : null;

  if (existingClassId && getClassProfileById(existingClassId)) {
    return existingClassId;
  }

  const classPayload = buildBackendClassPayloadFromSession(session);
  if (!classPayload.className.trim()) {
    throw new Error("Cannot start a session without a valid class name.");
  }

  const savedClassProfile = saveClassProfile(classPayload);
  return savedClassProfile.id;
}

function dispatchIncomingPayload(payload) {
  const chatWindow = focusOrCreateChatWindow();
  const deliverPayload = () => {
    if (!chatWindow.isDestroyed()) {
      chatWindow.webContents.send("incoming:payload", payload);
    }
  };

  if (chatWindow.webContents.isLoading()) {
    chatWindow.webContents.once("did-finish-load", deliverPayload);
    return;
  }

  deliverPayload();
}

function startIncomingMessageServer() {
  if (incomingMessageServer) {
    return;
  }

  incomingMessageServer = http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      const payload = {
        action_type:
          typeof parsed.action_type === "string"
            ? parsed.action_type
            : typeof parsed.actionType === "string"
              ? parsed.actionType
              : "chat",
        selected_text:
          typeof parsed.selected_text === "string"
            ? parsed.selected_text
            : typeof parsed.selectedText === "string"
              ? parsed.selectedText
              : typeof parsed.text === "string"
                ? parsed.text
                : "",
        surrounding_text:
          typeof parsed.surrounding_text === "string"
            ? parsed.surrounding_text
            : typeof parsed.surroundingText === "string"
              ? parsed.surroundingText
              : null,
        page_title:
          typeof parsed.page_title === "string"
            ? parsed.page_title
            : typeof parsed.pageTitle === "string"
              ? parsed.pageTitle
              : "",
        page_url:
          typeof parsed.page_url === "string"
            ? parsed.page_url
            : typeof parsed.pageUrl === "string"
              ? parsed.pageUrl
              : "",
        user_note:
          typeof parsed.user_note === "string"
            ? parsed.user_note
            : typeof parsed.userNote === "string"
              ? parsed.userNote
              : "",
        screenshot_data_url:
          typeof parsed.screenshot_data_url === "string"
            ? parsed.screenshot_data_url
            : typeof parsed.screenshotDataUrl === "string"
              ? parsed.screenshotDataUrl
              : null,
        click_function:
          typeof parsed.click_function === "string"
            ? parsed.click_function
            : "",
      };

      dispatchIncomingPayload(payload);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "Invalid JSON payload" }));
    }
  });

  incomingMessageServer.on("error", (error) => {
    console.error("Incoming message server error:", error);
  });

  incomingMessageServer.listen(INCOMING_HTTP_PORT, INCOMING_HTTP_HOST, () => {
    console.log(
      `Incoming message server listening on http://${INCOMING_HTTP_HOST}:${INCOMING_HTTP_PORT}`,
    );
  });
}

app.whenReady().then(async () => {
  await startLocalBackend();
  const isFirstRun = !hasLaunchedBefore();
  applyThemeSource(readStoredThemeSource());
  createStartupWindows(isFirstRun);
  startIncomingMessageServer();
  if (isFirstRun) {
    markAppLaunched();
  }

  nativeTheme.on("updated", sendThemeState);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartupWindows(false);
    }
  });
});

app.on("window-all-closed", () => {
  if (incomingMessageServer) {
    incomingMessageServer.close();
    incomingMessageServer = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void stopServer().catch((error) => {
    console.error("[local-backend] failed to stop", error);
  });
});

ipcMain.handle("window:minimizeToDock", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  setWindowMode(win, "compact");
  return { ok: true };
});

ipcMain.handle("window:expand", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  setWindowMode(win, "expanded");
  return { ok: true };
});

ipcMain.handle("window:minimizeNative", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  win.minimize();
  return { ok: true };
});

ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  win.close();
  return { ok: true };
});

ipcMain.handle("window:getBounds", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  return win.getBounds();
});

ipcMain.handle("window:resize", (event, nextBounds) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const state = win ? windowState.get(win.id) : null;
  if (!win || !state || !nextBounds) {
    return null;
  }

  const minWidth = state.config.layout.expanded.minWidth;
  const minHeight = state.config.layout.expanded.minHeight;
  win.setBounds(
    {
      ...win.getBounds(),
      width: Math.max(nextBounds.width, minWidth),
      height: Math.max(nextBounds.height, minHeight),
    },
    true,
  );
  return win.getBounds();
});

ipcMain.handle("theme:setSource", (_event, source) => {
  const themeState = applyThemeSource(source);
  sendThemeState();
  return {
    ok: true,
    ...themeState,
  };
});

ipcMain.handle("preferences:get", () => {
  return getPreferenceSnapshot();
});

ipcMain.handle("preferences:update", (_event, patch) => {
  const nextPreferences = {
    ...readPreferences(),
    ...patch,
  };
  writePreferences(nextPreferences);
  return getPreferenceSnapshot();
});

ipcMain.handle("class-folders:get", () => {
  return getPreferenceSnapshot().classFolders;
});

ipcMain.handle("class-folders:update", (_event, classFolders) => {
  const nextPreferences = {
    ...readPreferences(),
    classFolders: Array.isArray(classFolders) ? classFolders : [],
  };
  writePreferences(nextPreferences);
  notifyHomeWindowFoldersChanged(nextPreferences.classFolders);
  return nextPreferences.classFolders;
});

ipcMain.handle("backend:saveClassProfile", async (_event, classProfile) => {
  return callLocalApi("/api/classes", {
    method: "POST",
    body: classProfile,
  });
});

ipcMain.handle("backend:assist", async (_event, payload) => {
  const screenshotDataUrl = await capturePrimaryDisplayScreenshot().catch(
    (error) => {
      console.error("[screen-capture] failed to capture screenshot", error);
      return payload?.screenshotDataUrl ?? null;
    },
  );

  return callLocalApi("/api/assist", {
    method: "POST",
    body: {
      ...payload,
      screenshotDataUrl,
    },
  });
});

ipcMain.handle("backend:feedback", async (_event, payload) => {
  return callLocalApi("/api/feedback", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("onboarding:complete", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  createStartupWindows(false);
  if (win && !win.isDestroyed()) {
    win.close();
  }
  return { ok: true };
});

ipcMain.handle("session:getCurrent", () => {
  return getPreferenceSnapshot().currentSession;
});

ipcMain.handle("session:start", (_event, session) => {
  const resolvedClassId = ensureSessionClassId(session);
  const persistedSession = createSession(
    resolvedClassId,
    session.sessionName || "Study Session",
    session.sessionNotes || null,
  );
  const normalizedSession = normalizeSession({
    ...session,
    classId: resolvedClassId,
    sessionId: persistedSession.id,
    sessionStartedAt: persistedSession.startedAt,
  });
  const nextPreferences = {
    ...readPreferences(),
    currentSession: normalizedSession,
  };
  writePreferences(nextPreferences);

  if (!windowsByKey.has("chat")) {
    createManagedWindow("chat", "chat");
  } else {
    const existingChat = windowsByKey.get("chat");
    if (existingChat && !existingChat.isDestroyed()) {
      existingChat.show();
      existingChat.focus();
      existingChat.webContents.send("session:changed", nextPreferences.currentSession);
      existingChat.webContents.send(
        "session:changed",
        nextPreferences.currentSession,
      );
    }
  }

  return { ok: true, currentSession: nextPreferences.currentSession };
});

ipcMain.handle("session:stop", () => {
  const currentSession = getPreferenceSnapshot().currentSession;
  let persistedSession = null;
  if (currentSession?.sessionId) {
    persistedSession = endSession(currentSession.sessionId);
  }

  const currentPreferences = readPreferences();
  const nextClassFolders =
    currentSession && persistedSession
      ? appendStoppedSessionToFolders(
          Array.isArray(currentPreferences.classFolders)
            ? currentPreferences.classFolders
            : [],
          currentSession,
          persistedSession,
        )
      : Array.isArray(currentPreferences.classFolders)
        ? currentPreferences.classFolders
        : [];
  const nextPreferences = {
    ...currentPreferences,
    classFolders: nextClassFolders,
    currentSession: null,
  };
  writePreferences(nextPreferences);
  notifyHomeWindowFoldersChanged(nextPreferences.classFolders);

  const chatWindow = windowsByKey.get("chat");
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.close();
  }

  const homeWindow = windowsByKey.get("home");
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.show();
    homeWindow.focus();
  }

  return { ok: true };
});
