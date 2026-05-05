const path = require("path");
const fs = require("fs");
require("tsx/cjs");
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
  clearCurrentSessionState,
  getCurrentSessionState,
  getStoredClassFolders,
  hasStoredClassFolders,
  hasStoredCurrentSession,
  setCurrentSessionState,
  setStoredClassFolders,
} = require("./main/server/services/app-state.ts");
const {
  getClassProfileById,
  saveClassProfile,
} = require("./main/server/services/classes.ts");
const {
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
  resolveWindowTemplate,
} = require("./config/windows");
const {
  capturePrimaryDisplayScreenshot,
  shouldCaptureAutomaticScreenshot,
} = require("./main/capture.ts");
const {
  createIncomingMessageBridge,
} = require("./main/bridge.ts");
const {
  createSessionLifecycle,
} = require("./main/session.ts");

const windowsByKey = new Map();
const windowState = new Map();
const ALLOWED_THEME_SOURCES = new Set(["system", "light", "dark"]);
const LOCAL_API_BASE_URL = "http://127.0.0.1:3001";
const DEFAULT_BRIDGE_AUTH_TOKEN = "sideclick-local-dev-token";

function getAppLogoPath() {
  return path.join(process.cwd(), "assets", "images", "logo", "logo.png");
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
    classFolders: getStoredClassFolders(),
    currentSession: getCurrentSessionState(),
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
    icon: getAppLogoPath(),
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

function migrateLegacyStoredState() {
  const preferences = readPreferences();
  let shouldRewritePreferences = false;

  if (!hasStoredClassFolders() && Array.isArray(preferences.classFolders)) {
    setStoredClassFolders(preferences.classFolders);
    shouldRewritePreferences = true;
  }

  if (
    !hasStoredCurrentSession() &&
    preferences.currentSession &&
    typeof preferences.currentSession === "object"
  ) {
    setCurrentSessionState(preferences.currentSession);
    shouldRewritePreferences = true;
  }

  if (!shouldRewritePreferences) {
    return;
  }

  const {
    classFolders: _legacyClassFolders,
    currentSession: _legacyCurrentSession,
    ...nextPreferences
  } = preferences;
  writePreferences(nextPreferences);
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

function getBridgeAuthToken() {
  const configuredToken =
    typeof process.env.SIDECLICK_BRIDGE_TOKEN === "string"
      ? process.env.SIDECLICK_BRIDGE_TOKEN.trim()
      : "";

  return configuredToken || DEFAULT_BRIDGE_AUTH_TOKEN;
}

const incomingMessageServer = createIncomingMessageBridge({
  dispatchIncomingPayload,
  authToken: getBridgeAuthToken(),
});
const sessionManager = createSessionLifecycle({
  createSession,
  endSession,
  getClassProfileById,
  saveClassProfile,
  getCurrentSessionState,
  setCurrentSessionState,
  clearCurrentSessionState,
  getStoredClassFolders,
  setStoredClassFolders,
  windowsByKey,
  createManagedWindow,
  notifyHomeWindowFoldersChanged,
});

app.whenReady().then(async () => {
  await startLocalBackend();
  migrateLegacyStoredState();
  const isFirstRun = !hasLaunchedBefore();
  applyThemeSource(readStoredThemeSource());
  createStartupWindows(isFirstRun);
  incomingMessageServer.start();
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
  incomingMessageServer.stop();

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
  const safePatch =
    patch && typeof patch === "object"
      ? Object.fromEntries(
          Object.entries(patch).filter(
            ([key]) => key !== "classFolders" && key !== "currentSession",
          ),
        )
      : {};
  const nextPreferences = {
    ...readPreferences(),
    ...safePatch,
  };
  writePreferences(nextPreferences);
  return getPreferenceSnapshot();
});

ipcMain.handle("class-folders:get", () => {
  return getStoredClassFolders();
});

ipcMain.handle("class-folders:update", (_event, classFolders) => {
  const nextClassFolders = setStoredClassFolders(classFolders);
  notifyHomeWindowFoldersChanged(nextClassFolders);
  return nextClassFolders;
});

ipcMain.handle("backend:saveClassProfile", async (_event, classProfile) => {
  return callLocalApi("/api/classes", {
    method: "POST",
    body: classProfile,
  });
});

ipcMain.handle("backend:assist", async (_event, payload) => {
  let screenshotDataUrl = payload?.screenshotDataUrl ?? null;
  if (shouldCaptureAutomaticScreenshot(payload)) {
    screenshotDataUrl = await capturePrimaryDisplayScreenshot({
      desktopCapturer,
      screen,
    }).catch((error) => {
      console.error("[screen-capture] failed to capture screenshot", error);
      return screenshotDataUrl;
    });
  }

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

ipcMain.handle("backend:quiz", async (_event, payload) => {
  return callLocalApi("/api/quiz", {
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
  return sessionManager.getCurrentSession();
});

ipcMain.handle("session:start", (_event, session) => {
  return sessionManager.startSession(session);
});

ipcMain.handle("session:stop", () => {
  return sessionManager.stopSession();
});
