const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
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
} = require("../backend/src/server.ts");
const {
  createSession,
  endSession,
} = require("../backend/src/services/sessions.ts");
const {
  clearCurrentSessionState,
  getCurrentSessionState,
  getStoredClassFolders,
  hasStoredClassFolders,
  hasStoredCurrentSession,
  setCurrentSessionState,
  setStoredClassFolders,
} = require("../backend/src/services/app-state.ts");
const {
  getClassProfileById,
  saveClassProfile,
} = require("../backend/src/services/classes.ts");
const {
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
  resolveWindowTemplate,
} = require("./config/windows");
const {
  capturePrimaryDisplayScreenshot,
  enforceScreenshotPolicy,
  shouldCaptureAutomaticScreenshot,
} = require("./main/capture.ts");
const {
  createIncomingMessageBridge,
} = require("./main/bridge.ts");
const {
  getPrivacySettings,
  resetPrivacySettings,
  setPrivacySettings,
  updatePrivacySettings,
} = require("./main/privacy/settings.ts");
const {
  createSessionLifecycle,
} = require("./main/session.ts");
const {
  enqueueOfflineRequest,
} = require("./main/cache/local.ts");

const windowsByKey = new Map();
const windowState = new Map();
const ALLOWED_THEME_SOURCES = new Set(["system", "light", "dark"]);
const LOCAL_API_BASE_URL =
  process.env.LOCAL_API_BASE_URL || "http://127.0.0.1:3001";
const DEFAULT_BRIDGE_AUTH_SECRET = "sideclick-local-dev-secret";
const DEFAULT_MANAGED_BACKEND_URL = "";
const DEFAULT_MANAGED_BACKEND_JWT = "";
const DEFAULT_BACKEND_JWT_SECRET = "sideclick-managed-backend-dev-secret";
const MANAGED_AUTH_KEY = "managedAuth";

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

function getStoredManagedAuth() {
  const preferences = readPreferences();
  const candidate = preferences[MANAGED_AUTH_KEY];
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const token =
    typeof candidate.token === "string" && candidate.token.trim()
      ? candidate.token.trim()
      : "";
  const user =
    candidate.user && typeof candidate.user === "object" ? candidate.user : null;

  if (!token || !user) {
    return null;
  }

  return {
    token,
    user,
  };
}

function setStoredManagedAuth(authSession) {
  const nextPreferences = {
    ...readPreferences(),
    [MANAGED_AUTH_KEY]: authSession,
  };
  writePreferences(nextPreferences);
  return authSession;
}

function clearStoredManagedAuth() {
  const nextPreferences = { ...readPreferences() };
  delete nextPreferences[MANAGED_AUTH_KEY];
  writePreferences(nextPreferences);
  return null;
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
  const {
    padding,
    topOffset,
    horizontal = "right",
    vertical = "top",
  } = config.layout.anchor;

  const x =
    horizontal === "center"
      ? workArea.x + Math.round((workArea.width - width) / 2)
      : workArea.x + workArea.width - width - padding;
  const y =
    vertical === "middle"
      ? workArea.y + Math.round((workArea.height - height) / 2)
      : workArea.y + topOffset;

  return {
    width,
    height,
    x,
    y,
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
  if (shouldUseManagedBackend()) {
    return;
  }

  try {
    await startServer({
      host: "127.0.0.1",
      port: 3001,
    });
  } catch (error) {
    console.error("[local-backend] failed to start", error);
  }
}

function shouldUseManagedBackend() {
  return Boolean(getManagedBackendBaseUrl());
}

function getManagedBackendBaseUrl() {
  const configuredUrl =
    typeof process.env.MANAGED_BACKEND_URL === "string"
      ? process.env.MANAGED_BACKEND_URL.trim()
      : "";

  return configuredUrl || DEFAULT_MANAGED_BACKEND_URL;
}

function getManagedBackendJwt() {
  const configuredJwt =
    typeof process.env.MANAGED_BACKEND_JWT === "string"
      ? process.env.MANAGED_BACKEND_JWT.trim()
      : "";

  if (configuredJwt) {
    return configuredJwt;
  }

  const storedAuth = getStoredManagedAuth();
  if (storedAuth?.token) {
    return storedAuth.token;
  }
  return null;
}

function getBackendJwtSecret() {
  const configuredSecret =
    typeof process.env.BACKEND_JWT_SECRET === "string"
      ? process.env.BACKEND_JWT_SECRET.trim()
      : "";

  return configuredSecret || DEFAULT_BACKEND_JWT_SECRET;
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function createLocalBackendJwt() {
  const header = base64UrlEncode(JSON.stringify({
    alg: "HS256",
    typ: "JWT",
  }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: "local-electron-client",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  }));
  const signature = crypto
    .createHmac("sha256", getBackendJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function normalizeManagedBackendBaseUrl(baseUrl) {
  if (!baseUrl) {
    return LOCAL_API_BASE_URL.replace(/\/+$/, "");
  }

  const parsedUrl = new URL(baseUrl);
  if (
    parsedUrl.protocol !== "https:" &&
    process.env.MANAGED_BACKEND_ALLOW_HTTP !== "true"
  ) {
    throw new Error("Managed backend URL must use HTTPS.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function buildOfflineRequestKey(endpoint, options = {}) {
  const method = options.method || "GET";
  const payload = options.body === undefined ? "" : JSON.stringify(options.body);
  return crypto
    .createHash("sha256")
    .update(`${method}:${endpoint}:${payload}`)
    .digest("hex");
}

async function callManagedBackend(endpoint, options = {}) {
  const baseUrl = normalizeManagedBackendBaseUrl(getManagedBackendBaseUrl());
  const requestUrl = `${baseUrl}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
  };

  const managedBackendJwt = options.skipAuth ? null : getManagedBackendJwt();
  if (managedBackendJwt) {
    headers.Authorization = `Bearer ${managedBackendJwt}`;
  }

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  };

  if (
    requestUrl.startsWith("https://") &&
    process.env.MANAGED_BACKEND_ALLOW_SELF_SIGNED === "true"
  ) {
    fetchOptions.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  let response;
  try {
    response = await fetch(requestUrl, fetchOptions);
  } catch (error) {
    if ((options.method || "GET") !== "GET") {
      enqueueOfflineRequest({
        requestKey: buildOfflineRequestKey(endpoint, options),
        endpoint,
        method: options.method || "GET",
        payload: options.body ?? null,
      });
    }
    throw error;
  }

  const rawText = await response.text();
  let payload = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if ((options.method || "GET") !== "GET") {
      enqueueOfflineRequest({
        requestKey: buildOfflineRequestKey(endpoint, options),
        endpoint,
        method: options.method || "GET",
        payload: options.body ?? null,
        retryAfter: response.headers.get("retry-after"),
      });
    }
    throw new Error(
      payload && typeof payload.error === "string"
        ? payload.error
        : rawText || `Managed backend request failed for ${endpoint}`,
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

function shouldShowOnboardingGate() {
  return !hasLaunchedBefore() || !getStoredManagedAuth();
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

function getBridgeAuthSecret() {
  const configuredSecret =
    typeof process.env.SIDECLICK_BRIDGE_SECRET === "string"
      ? process.env.SIDECLICK_BRIDGE_SECRET.trim()
      : "";

  return configuredSecret || DEFAULT_BRIDGE_AUTH_SECRET;
}

const incomingMessageServer = createIncomingMessageBridge({
  dispatchIncomingPayload,
  authSecret: getBridgeAuthSecret(),
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
  const shouldOpenOnboarding = shouldShowOnboardingGate();
  applyThemeSource(readStoredThemeSource());
  createStartupWindows(shouldOpenOnboarding);
  incomingMessageServer.start();
  if (!hasLaunchedBefore()) {
    markAppLaunched();
  }

  nativeTheme.on("updated", sendThemeState);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartupWindows(shouldShowOnboardingGate());
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

ipcMain.handle("privacy-settings:get", () => {
  return getPrivacySettings();
});

ipcMain.handle("privacy-settings:set", (_event, nextSettings) => {
  return setPrivacySettings(nextSettings);
});

ipcMain.handle("privacy-settings:update", (_event, patch) => {
  return updatePrivacySettings(patch);
});

ipcMain.handle("privacy-settings:reset", () => {
  return resetPrivacySettings();
});

ipcMain.handle("backend:saveClassProfile", async (_event, classProfile) => {
  return callManagedBackend("/api/classes", {
    method: "POST",
    body: classProfile,
  });
});

ipcMain.handle("backend:assist", async (_event, payload) => {
  const privacySettings = getPrivacySettings();
  let screenshotDataUrl = enforceScreenshotPolicy(payload, privacySettings);
  if (shouldCaptureAutomaticScreenshot(payload, privacySettings)) {
    screenshotDataUrl = await capturePrimaryDisplayScreenshot({
      desktopCapturer,
      screen,
    }).catch((error) => {
      console.error("[screen-capture] failed to capture screenshot", error);
      return screenshotDataUrl;
    });
  }

  return callManagedBackend("/api/assist", {
    method: "POST",
    body: {
      ...payload,
      screenshotDataUrl,
    },
  });
});

ipcMain.handle("backend:feedback", async (_event, payload) => {
  return callManagedBackend("/api/feedback", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("backend:quiz", async (_event, payload) => {
  return callManagedBackend("/api/quiz", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("backend:authRegister", async (_event, payload) => {
  const session = await callManagedBackend("/api/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  return setStoredManagedAuth(session);
});

ipcMain.handle("backend:authLogin", async (_event, payload) => {
  const session = await callManagedBackend("/api/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  return setStoredManagedAuth(session);
});

ipcMain.handle("backend:authLogout", () => {
  return clearStoredManagedAuth();
});

ipcMain.handle("backend:authSession", async () => {
  const storedAuth = getStoredManagedAuth();
  if (!storedAuth?.token) {
    return null;
  }

  try {
    const result = await callManagedBackend("/api/auth/me", {
      method: "GET",
    });
    return setStoredManagedAuth({
      token: storedAuth.token,
      user: result.user,
    });
  } catch {
    clearStoredManagedAuth();
    return null;
  }
});

ipcMain.handle("backend:exportAccount", async (_event, options) => {
  const includeContent =
    !options || typeof options !== "object" || options.includeContent !== false;
  const query = includeContent ? "" : "?includeContent=false";
  return callManagedBackend(`/api/export${query}`, {
    method: "GET",
  });
});

ipcMain.handle("backend:deleteAccount", async () => {
  return callManagedBackend("/api/account", {
    method: "DELETE",
    body: {
      confirm: true,
    },
  });
});

ipcMain.handle("onboarding:complete", (event) => {
  if (!getStoredManagedAuth()) {
    throw new Error("Sign in or create an account before continuing.");
  }
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
