const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const dotenv = require("dotenv");
if (process.env.SIDEKLICK_DISABLE_TSX_LOADER !== "true") {
  require("tsx/cjs");
}
const {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  ipcMain,
  nativeTheme,
  screen,
  shell,
} = require("electron");
const {
  DEFAULT_MANAGED_BACKEND_URL,
} = require("./main/config/desktop");
const {
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
  resolveWindowTemplate,
} = require("./config/windows");
const {
  canAttachManualScreenshot,
  capturePrimaryDisplayScreenshot,
  enforceScreenshotPolicy,
  getScreenshotPolicyErrorMessage,
  shouldCaptureAutomaticScreenshot,
} = require("./main/capture.ts");
const {
  isManagedBackendAuthFailure,
} = require("./main/auth-session.js");
const {
  getPrivacySettings,
  resetPrivacySettings,
  setPrivacySettings,
  updatePrivacySettings,
} = require("./main/privacy/settings.ts");
const {
  enqueueOfflineRequest,
} = require("./main/cache/local.ts");
const {
  extractStudyMaterialFiles,
} = require("./main/study-material.js");

const windowsByKey = new Map();
const windowState = new Map();
const ALLOWED_THEME_SOURCES = new Set(["system", "light", "dark"]);
const ALLOWED_TRANSPARENCY_MODES = new Set(["normal", "reduced", "solid"]);
const USER_EDITABLE_PREFERENCE_KEYS = new Set([
  "customerProfile",
  "discoverySource",
]);
const LOCAL_API_BASE_URL =
  process.env.LOCAL_API_BASE_URL || "http://127.0.0.1:3001";
const DEFAULT_MANAGED_BACKEND_JWT = "";
const MANAGED_AUTH_FILENAME = "managed-auth.json";
const AUTH_REFRESH_TIMEOUT_MS = 2500;
const LOCAL_DB_FILENAME = "sideklick.sqlite";
const OFFLINE_QUEUE_ELIGIBLE_ENDPOINTS = new Set([]);
let serverApi = null;
let sessionServiceApi = null;
let appStateApi = null;
let classServiceApi = null;
let createSessionLifecycle = null;
let nativeMessagingIpcServer = null;
let sessionManager = null;

function getServerApi() {
  if (!serverApi) {
    serverApi = require("./main/server/index.ts");
  }
  return serverApi;
}

function getSessionServiceApi() {
  if (!sessionServiceApi) {
    sessionServiceApi = require("./main/server/services/sessions.ts");
  }
  return sessionServiceApi;
}

function getAppStateApi() {
  if (!appStateApi) {
    appStateApi = require("./main/server/services/app-state.ts");
  }
  return appStateApi;
}

function getClassServiceApi() {
  if (!classServiceApi) {
    classServiceApi = require("./main/server/services/classes.ts");
  }
  return classServiceApi;
}

function getCreateSessionLifecycle() {
  if (!createSessionLifecycle) {
    ({ createSessionLifecycle } = require("./main/session.ts"));
  }
  return createSessionLifecycle;
}

function hasStoredClassFolders() {
  return getAppStateApi().hasStoredClassFolders();
}

function getStoredClassFolders() {
  return getAppStateApi().getStoredClassFolders();
}

function hasStoredCurrentSession() {
  return getAppStateApi().hasStoredCurrentSession();
}

function getCurrentSessionState() {
  return getAppStateApi().getCurrentSessionState();
}

function setCurrentSessionState(currentSession) {
  return getAppStateApi().setCurrentSessionState(currentSession);
}

function clearCurrentSessionState() {
  return getAppStateApi().clearCurrentSessionState();
}

function setStoredClassFolders(classFolders) {
  return getAppStateApi().setStoredClassFolders(classFolders);
}

function getClassProfileById(id) {
  return getClassServiceApi().getClassProfileById(id);
}

function saveClassProfile(input) {
  return getClassServiceApi().saveClassProfile(input);
}

function loadEnvironment() {
  if (app.isPackaged) {
    return;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), ".env.desktop"),
    path.resolve(process.cwd(), ".env.backend"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../../.env.desktop"),
    path.resolve(__dirname, "../../../.env.backend"),
    path.resolve(__dirname, "../../../.env"),
  ];

  for (const envPath of new Set(candidatePaths)) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    dotenv.config({ path: envPath });
  }
}

loadEnvironment();

function getAppLogoPath() {
  const workspaceLogoPath = path.join(
    process.cwd(),
    "apps",
    "desktop",
    "assets",
    "images",
    "logo",
    "logo.png",
  );
  if (fs.existsSync(workspaceLogoPath)) {
    return workspaceLogoPath;
  }

  return path.join(__dirname, "../assets/images/logo/logo.png");
}

function getThemePreferencePath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

function getManagedAuthPath() {
  return path.join(app.getPath("userData"), MANAGED_AUTH_FILENAME);
}

function getLocalBackendJwtSecretPath() {
  return path.join(app.getPath("userData"), "local-backend-jwt-secret.txt");
}

function ensureLocalBackendJwtSecret() {
  const configuredSecret =
    typeof process.env.BACKEND_JWT_SECRET === "string"
      ? process.env.BACKEND_JWT_SECRET.trim()
      : "";

  if (configuredSecret) {
    return configuredSecret;
  }

  const secretPath = getLocalBackendJwtSecretPath();
  try {
    if (fs.existsSync(secretPath)) {
      const storedSecret = fs.readFileSync(secretPath, "utf8").trim();
      if (storedSecret) {
        process.env.BACKEND_JWT_SECRET = storedSecret;
        return storedSecret;
      }
    }
  } catch (error) {
    console.warn("[local-backend] failed to read stored JWT secret", error);
  }

  const generatedSecret = crypto.randomBytes(48).toString("hex");
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  fs.writeFileSync(secretPath, generatedSecret, "utf8");
  process.env.BACKEND_JWT_SECRET = generatedSecret;
  console.warn(
    "[local-backend] BACKEND_JWT_SECRET was not set. Generated a persistent local secret for this device.",
  );
  return generatedSecret;
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

function readManagedAuthFile() {
  try {
    const authPath = getManagedAuthPath();
    if (!fs.existsSync(authPath)) {
      return null;
    }

    const raw = fs.readFileSync(authPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeTransparencyMode(value, fallback = "normal") {
  return ALLOWED_TRANSPARENCY_MODES.has(value) ? value : fallback;
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
  const transparencyMode = normalizeTransparencyMode(
    preferences.transparencyMode ||
      (preferences.reduceTransparency ? "reduced" : "normal"),
  );
  return {
    themeSource: ALLOWED_THEME_SOURCES.has(preferences.themeSource)
      ? preferences.themeSource
      : "system",
    transparencyMode,
    reduceTransparency: transparencyMode !== "normal",
    hasLaunchedBefore: Boolean(preferences.hasLaunchedBefore),
    discoverySource: preferences.discoverySource || "",
    customerProfile: preferences.customerProfile || "",
    classFolders: getStoredClassFolders(),
    currentSession: getCurrentSessionState(),
  };
}

function getStoredManagedAuth() {
  const candidate = readManagedAuthFile();
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
  const authPath = getManagedAuthPath();
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  fs.writeFileSync(authPath, JSON.stringify(authSession, null, 2), "utf8");
  return authSession;
}

function clearStoredManagedAuth() {
  const authPath = getManagedAuthPath();
  if (fs.existsSync(authPath)) {
    fs.unlinkSync(authPath);
  }
  return null;
}

function toRendererAuthSession(authSession) {
  if (!authSession?.user) {
    return null;
  }

  return {
    user: authSession.user,
  };
}

function getLocalDbPath() {
  return path.join(app.getPath("userData"), LOCAL_DB_FILENAME);
}

function migrateLegacyLocalDbToUserData() {
  const targetPath = getLocalDbPath();
  const legacyPath = path.join(process.cwd(), LOCAL_DB_FILENAME);

  if (targetPath === legacyPath || fs.existsSync(targetPath) || !fs.existsSync(legacyPath)) {
    process.env.SIDEKLICK_DB_PATH = targetPath;
    return;
  }

  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(legacyPath, targetPath);
  } catch (error) {
    console.error("[db] failed to migrate legacy sqlite file", error);
  }

  process.env.SIDEKLICK_DB_PATH = targetPath;
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
  const {
    width,
    height,
    minWidth,
    minHeight,
    viewportWidthRatio,
    viewportHeightRatio,
  } = config.layout.expanded;
  const {
    padding,
    topOffset,
    horizontal = "right",
    vertical = "top",
  } = config.layout.anchor;
  const resolvedWidth = viewportWidthRatio
    ? Math.max(
        minWidth || width,
        Math.min(width, Math.round(workArea.width * viewportWidthRatio)),
      )
    : width;
  const resolvedHeight = viewportHeightRatio
    ? Math.max(
        minHeight || height,
        Math.min(height, Math.round(workArea.height * viewportHeightRatio)),
      )
    : height;

  const x =
    horizontal === "center"
      ? workArea.x + Math.round((workArea.width - resolvedWidth) / 2)
      : workArea.x + workArea.width - resolvedWidth - padding;
  const y =
    vertical === "middle"
      ? workArea.y + Math.round((workArea.height - resolvedHeight) / 2)
      : workArea.y + topOffset;

  return {
    width: resolvedWidth,
    height: resolvedHeight,
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

function broadcastPreferencesChanged(preferences) {
  for (const { win } of windowState.values()) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("preferences:changed", preferences);
    }
  }
}

function getWindowOptionsForMode(config, mode) {
  const browserWindow =
    mode === "compact"
      ? {
          ...config.browserWindow,
          ...(config.compactBrowserWindow || {}),
        }
      : config.browserWindow;

  return browserWindow;
}

function applyCompactWindowState(win, state) {
  const compactBounds = getAnchorBounds(state.config);
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setBounds(compactBounds, true);
}

function applyExpandedWindowState(win, state) {
  const { config } = state;
  const currentBounds = win.getBounds();
  const {
    expanded: { width, height, minWidth, minHeight },
    compact,
  } = config.layout;
  const expandedBounds = getDefaultBounds(config);
  const nextBounds = {
    x: currentBounds.x,
    y: currentBounds.y,
    width: Math.max(currentBounds.width, width, minWidth),
    height: Math.max(currentBounds.height, height, minHeight),
  };

  win.setAlwaysOnTop(Boolean(config.browserWindow.alwaysOnTop));
  win.setVisibleOnAllWorkspaces(false);

  if (currentBounds.width <= compact.width + 8) {
    win.setBounds(expandedBounds, true);
  } else {
    win.setBounds(nextBounds, true);
  }
}

function createCompactCompanionWindow(state) {
  const compactWindowKey = `${state.windowKey}:compact`;
  const existing = windowsByKey.get(compactWindowKey);
  if (existing && !existing.isDestroyed()) {
    return existing;
  }

  const compactWin = createManagedWindow(
    compactWindowKey,
    state.templateKey,
    state.config,
    {
      initialMode: "compact",
      variant: "compact",
      primaryWindowKey: state.windowKey,
      partnerWindowId: state.win.id,
    },
  );
  state.companionWindowId = compactWin.id;
  return compactWin;
}

function showExpandedPartnerWindow(compactState) {
  const partner = BrowserWindow.fromId(compactState.partnerWindowId);
  if (!partner || partner.isDestroyed()) {
    return null;
  }

  const partnerState = windowState.get(partner.id);
  if (!partnerState) {
    return partner;
  }

  partnerState.companionWindowId = null;
  partnerState.mode = "expanded";
  applyExpandedWindowState(partner, partnerState);
  partner.show();
  partner.focus();
  partner.webContents.send("window:mode", { mode: "expanded" });
  return partner;
}

function setWindowMode(win, mode) {
  const state = windowState.get(win.id);
  if (!state) {
    return;
  }

  if (mode === "compact") {
    if (state.variant === "compact") {
      applyCompactWindowState(win, state);
      state.mode = "compact";
      win.webContents.send("window:mode", { mode: "compact" });
      return;
    }

    const compactWin = createCompactCompanionWindow(state);
    state.mode = "compact";
    win.hide();
    compactWin.show();
    compactWin.focus();
    compactWin.webContents.send("window:mode", { mode: "compact" });
  } else {
    if (state.variant === "compact") {
      win.hide();
      showExpandedPartnerWindow(state);
      win.close();
      return;
    }

    if (state.companionWindowId) {
      const companion = BrowserWindow.fromId(state.companionWindowId);
      state.companionWindowId = null;
      if (companion && !companion.isDestroyed()) {
        companion.close();
      }
    }

    applyExpandedWindowState(win, state);
    state.mode = "expanded";
    win.show();
    win.focus();
    win.webContents.send("window:mode", { mode: "expanded" });
    return;
  }
}

function registerWindow(windowKey, templateKey, config, win, options = {}) {
  windowsByKey.set(windowKey, win);
  windowState.set(win.id, {
    windowKey,
    templateKey,
    config,
    win,
    mode: options.initialMode || config.startMode,
    variant: options.variant || config.startMode,
    primaryWindowKey: options.primaryWindowKey || windowKey,
    partnerWindowId: options.partnerWindowId || null,
    companionWindowId: null,
  });
}

function unregisterWindow(win) {
  const state = windowState.get(win.id);
  if (!state) {
    return;
  }

  windowsByKey.delete(state.windowKey);

  if (state.variant === "expanded" && state.companionWindowId) {
    const companion = BrowserWindow.fromId(state.companionWindowId);
    if (companion && !companion.isDestroyed()) {
      companion.close();
    }
  }

  if (state.variant === "compact" && state.partnerWindowId) {
    const partner = BrowserWindow.fromId(state.partnerWindowId);
    const partnerState = partner ? windowState.get(partner.id) : null;
    if (partnerState) {
      partnerState.companionWindowId = null;
    }
  }

  windowState.delete(win.id);
}

function createManagedWindow(
  windowKey,
  templateKey,
  config = resolveWindowTemplate(templateKey),
  options = {},
) {
  const initialMode = options.initialMode || config.startMode;
  const bounds =
    initialMode === "compact" ? getAnchorBounds(config) : getDefaultBounds(config);
  const browserWindow = getWindowOptionsForMode(config, initialMode);
  const minWidth =
    initialMode === "compact"
      ? config.layout.compact.width
      : config.layout.expanded.minWidth;
  const minHeight =
    initialMode === "compact"
      ? config.layout.compact.height
      : config.layout.expanded.minHeight;

  const win = new BrowserWindow({
    ...bounds,
    minWidth,
    minHeight,
    icon: getAppLogoPath(),
    frame: browserWindow.frame,
    transparent: browserWindow.transparent,
    alwaysOnTop: browserWindow.alwaysOnTop,
    resizable: browserWindow.resizable,
    roundedCorners: browserWindow.roundedCorners,
    hasShadow: browserWindow.hasShadow,
    maximizable: browserWindow.maximizable,
    fullscreenable: browserWindow.fullscreenable,
    show: false,
    skipTaskbar: browserWindow.skipTaskbar,
    title: config.title,
    backgroundColor: browserWindow.backgroundColor || "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerWindow(windowKey, templateKey, config, win, {
    ...options,
    initialMode,
  });

  win.loadFile(path.join(__dirname, config.htmlFile));

  win.once("ready-to-show", () => {
    win.show();
    sendThemeState();
    const state = windowState.get(win.id);
    if (!state) {
      return;
    }
    if (initialMode === "compact") {
      applyCompactWindowState(win, state);
      state.mode = "compact";
      win.webContents.send("window:mode", { mode: "compact" });
      return;
    }
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
    ensureLocalBackendJwtSecret();
    await getServerApi().startServer({
      host: "127.0.0.1",
      port: 3001,
    });
  } catch (error) {
    console.error("[local-backend] failed to start", error);
  }
}

function shouldUseManagedBackend() {
  if (process.env.SIDEKLICK_FORCE_LOCAL_BACKEND === "true") {
    return false;
  }
  return Boolean(getManagedBackendBaseUrl());
}

function getManagedBackendBaseUrl() {
  const configuredUrl =
    typeof process.env.MANAGED_BACKEND_URL === "string"
      ? process.env.MANAGED_BACKEND_URL.trim()
      : "";

  if (configuredUrl) {
    return configuredUrl;
  }

  if (app.isPackaged) {
    return DEFAULT_MANAGED_BACKEND_URL;
  }

  return "";
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

function getAiBackendStatus() {
  if (shouldUseManagedBackend()) {
    return {
      available: true,
      provider: "managed",
      message: "",
    };
  }

  const apiKey =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";

  if (apiKey) {
    return {
      available: true,
      provider: "local",
      message: "",
    };
  }

  return {
    available: false,
    provider: "local",
    message:
      "Add OPENAI_API_KEY to .env.backend and restart SideKlick to use quiz, cram, and AI assist on this device.",
  };
}

function normalizeManagedBackendBaseUrl(baseUrl) {
  if (!baseUrl) {
    return LOCAL_API_BASE_URL.replace(/\/+$/, "");
  }

  const parsedUrl = new URL(baseUrl);
  const isLocalUrl = ["localhost", "127.0.0.1", "::1"].includes(
    parsedUrl.hostname,
  );
  if (
    parsedUrl.protocol !== "https:" &&
    !(
      process.env.MANAGED_BACKEND_ALLOW_HTTP === "true" &&
      !app.isPackaged &&
      isLocalUrl
    )
  ) {
    throw new Error("Managed backend URL must use HTTPS.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function isLocalhostUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function buildManagedBackendRequestUrl(baseUrl, endpoint) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (baseUrl.endsWith("/api") && normalizedEndpoint === "/api") {
    return baseUrl;
  }

  if (baseUrl.endsWith("/api") && normalizedEndpoint.startsWith("/api/")) {
    return `${baseUrl}${normalizedEndpoint.slice(4)}`;
  }

  return `${baseUrl}${normalizedEndpoint}`;
}

function buildOfflineRequestKey(endpoint, options = {}) {
  const method = options.method || "GET";
  const payload = options.body === undefined ? "" : JSON.stringify(options.body);
  return crypto
    .createHash("sha256")
    .update(`${method}:${endpoint}:${payload}`)
    .digest("hex");
}

function canQueueOfflineRequest(endpoint) {
  return OFFLINE_QUEUE_ELIGIBLE_ENDPOINTS.has(endpoint);
}

function enqueueManagedOfflineRequest(endpoint, options = {}, retryAfter = null) {
  if ((options.method || "GET") === "GET" || !canQueueOfflineRequest(endpoint)) {
    return;
  }

  enqueueOfflineRequest({
    requestKey: buildOfflineRequestKey(endpoint, options),
    endpoint,
    method: options.method || "GET",
    payload: options.body ?? null,
    retryAfter,
  });
}

async function callManagedBackend(endpoint, options = {}) {
  const baseUrl = normalizeManagedBackendBaseUrl(getManagedBackendBaseUrl());
  const requestUrl = buildManagedBackendRequestUrl(baseUrl, endpoint);
  const headers = {
    "Content-Type": "application/json",
  };
  if (typeof options.idempotencyKey === "string" && options.idempotencyKey.trim()) {
    headers["X-Idempotency-Key"] = options.idempotencyKey.trim();
  }

  const explicitAuthToken =
    typeof options.authToken === "string" && options.authToken.trim()
      ? options.authToken.trim()
      : null;
  const managedBackendJwt = options.skipAuth
    ? null
    : explicitAuthToken || getManagedBackendJwt();
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
    process.env.MANAGED_BACKEND_ALLOW_SELF_SIGNED === "true" &&
    !app.isPackaged &&
    isLocalhostUrl(requestUrl)
  ) {
    fetchOptions.agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  let response;
  try {
    response = await fetch(requestUrl, fetchOptions);
  } catch (error) {
    enqueueManagedOfflineRequest(endpoint, options);
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
    enqueueManagedOfflineRequest(
      endpoint,
      options,
      response.headers.get("retry-after"),
    );
    const error = new Error(
      payload && typeof payload.error === "string"
        ? payload.error
        : rawText || `Managed backend request failed for ${endpoint}`,
    );
    error.status = response.status;
    throw error;
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

function broadcastAuthSessionChanged(nextSession) {
  const rendererSession = toRendererAuthSession(nextSession);
  for (const win of windowsByKey.values()) {
    if (!win || win.isDestroyed()) {
      continue;
    }
    win.webContents.send("auth:sessionChanged", rendererSession);
  }
}

async function callManagedBackendWithTimeout(endpoint, options = {}, timeoutMs = AUTH_REFRESH_TIMEOUT_MS) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return callManagedBackend(endpoint, options);
  }

  return Promise.race([
    callManagedBackend(endpoint, options),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Managed backend request timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    }),
  ]);
}

function refreshAuthSessionInBackground(storedAuth) {
  if (!storedAuth?.token) {
    return;
  }

  void callManagedBackendWithTimeout("/api/auth/me", {
    method: "GET",
    authToken: storedAuth.token,
  })
    .then((result) => {
      const nextSession = setStoredManagedAuth({
        token: storedAuth.token,
        user: result.user,
      });
      broadcastAuthSessionChanged(nextSession);
    })
    .catch((error) => {
      if (isManagedBackendAuthFailure(error)) {
        clearStoredManagedAuth();
        broadcastAuthSessionChanged(null);
      }
    });
}

function migrateLegacyStoredState() {
  const preferences = readPreferences();
  let shouldRewritePreferences = false;
  if (preferences.managedAuth && !getStoredManagedAuth()) {
    setStoredManagedAuth(preferences.managedAuth);
    shouldRewritePreferences = true;
  }

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
    managedAuth: _legacyManagedAuth,
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

function ensureSessionManager() {
  if (sessionManager) {
    return sessionManager;
  }

  const sessionServices = getSessionServiceApi();
  sessionManager = getCreateSessionLifecycle()({
    createSession: sessionServices.createSession,
    endSession: sessionServices.endSession,
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
  return sessionManager;
}

app.whenReady().then(async () => {
  migrateLegacyLocalDbToUserData();
  const { createNativeMessagingIpcServer } = require("./main/native-bridge.ts");
  nativeMessagingIpcServer = createNativeMessagingIpcServer({
    dispatchIncomingPayload,
  });

  if (process.platform === "darwin" && app.dock) {
    app.dock.setIcon(getAppLogoPath());
  }

  await startLocalBackend();
  migrateLegacyStoredState();
  const shouldOpenOnboarding = shouldShowOnboardingGate();
  applyThemeSource(readStoredThemeSource());
  createStartupWindows(shouldOpenOnboarding);
  nativeMessagingIpcServer.start();
  if (!hasLaunchedBefore()) {
    markAppLaunched();
  }

  nativeTheme.on("updated", sendThemeState);

  initializeAutoUpdater();
  setTimeout(() => {
    triggerUpdateCheck().catch((err) => {
      console.error("[updater] startup check failed", err);
    });
  }, 5000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartupWindows(shouldShowOnboardingGate());
    }
  });
});

app.on("window-all-closed", () => {
  if (nativeMessagingIpcServer) {
    nativeMessagingIpcServer.stop();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void getServerApi().stopServer().catch((error) => {
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

  const state = windowState.get(win.id);
  if (state?.variant === "compact" && state.partnerWindowId) {
    const partner = BrowserWindow.fromId(state.partnerWindowId);
    if (partner && !partner.isDestroyed()) {
      partner.close();
    }
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
  const nextTransparencyMode =
    patch && typeof patch === "object" && "transparencyMode" in patch
      ? normalizeTransparencyMode(
          patch.transparencyMode,
          normalizeTransparencyMode(
            patch.reduceTransparency ? "reduced" : "normal",
          ),
        )
      : normalizeTransparencyMode(
          patch && typeof patch === "object" && patch.reduceTransparency
            ? "reduced"
            : readPreferences().transparencyMode,
        );
  const safePatch =
    patch && typeof patch === "object"
      ? Object.fromEntries(
          Object.entries(patch).filter(
            ([key]) =>
              USER_EDITABLE_PREFERENCE_KEYS.has(key),
          ),
        )
    : {};
  const nextPreferences = {
    ...readPreferences(),
    ...safePatch,
    transparencyMode: nextTransparencyMode,
  };
  writePreferences(nextPreferences);
  const preferenceSnapshot = getPreferenceSnapshot();
  broadcastPreferencesChanged(preferenceSnapshot);
  return preferenceSnapshot;
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

ipcMain.handle("capture:screenshot", async () => {
  const privacySettings = getPrivacySettings();
  if (!canAttachManualScreenshot(privacySettings)) {
    throw new Error(getScreenshotPolicyErrorMessage(privacySettings));
  }

  return capturePrimaryDisplayScreenshot({
    desktopCapturer,
    screen,
  });
});

ipcMain.handle("clipboard:readAttachment", () => {
  const image = clipboard.readImage();
  if (!image.isEmpty()) {
    const privacySettings = getPrivacySettings();
    if (!canAttachManualScreenshot(privacySettings)) {
      throw new Error(getScreenshotPolicyErrorMessage(privacySettings));
    }

    return {
      type: "image",
      dataUrl: `data:image/png;base64,${image.toPNG().toString("base64")}`,
    };
  }

  const text = clipboard.readText().trim();
  if (!text) {
    return null;
  }

  return {
    type: "text",
    text,
  };
});

ipcMain.handle("study-material:extract", async (_event, payload) => {
  const files = Array.isArray(payload?.files) ? payload.files : [];
  if (files.length === 0) {
    return [];
  }

  return extractStudyMaterialFiles(files, {
    mode: payload?.mode === "quiz" ? "quiz" : "cram",
  });
});

ipcMain.handle("backend:saveClassProfile", async (_event, classProfile) => {
  return callManagedBackend("/api/classes", {
    method: "POST",
    body: classProfile,
  });
});

ipcMain.handle("backend:getAiStatus", async () => getAiBackendStatus());

ipcMain.handle("backend:assessmentProfileAnalyze", async (_event, payload) => {
  return callManagedBackend("/api/assessment-profile/analyze", {
    method: "POST",
    body: payload,
    idempotencyKey: crypto.randomUUID(),
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

ipcMain.handle("backend:cram", async (_event, payload) => {
  return callManagedBackend("/api/cram", {
    method: "POST",
    body: payload,
    idempotencyKey: crypto.randomUUID(),
  });
});

ipcMain.handle("backend:quiz", async (_event, payload) => {
  return callManagedBackend("/api/quiz", {
    method: "POST",
    body: payload,
    idempotencyKey: crypto.randomUUID(),
  });
});

ipcMain.handle("backend:cramPlan", async (_event, payload) => {
  return callManagedBackend("/api/cram-plan", {
    method: "POST",
    body: payload,
    idempotencyKey: crypto.randomUUID(),
  });
});

ipcMain.handle("backend:billingMe", async () => {
  return callManagedBackend("/api/billing/me", {
    method: "GET",
  });
});

ipcMain.handle("backend:billingCheckout", async (_event, payload) => {
  return callManagedBackend("/api/billing/checkout", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("backend:billingPortal", async (_event, payload) => {
  return callManagedBackend("/api/billing/portal", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("backend:billingRedeemDiscountCode", async (_event, payload) => {
  return callManagedBackend("/api/billing/discount-codes/redeem", {
    method: "POST",
    body: payload,
  });
});

ipcMain.handle("backend:creditsQuote", async (_event, payload) => {
  return callManagedBackend("/api/credits/quote", {
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
  const nextSession = setStoredManagedAuth(session);
  broadcastAuthSessionChanged(nextSession);
  return toRendererAuthSession(nextSession);
});

ipcMain.handle("backend:authLogin", async (_event, payload) => {
  const session = await callManagedBackend("/api/auth/login", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  const nextSession = setStoredManagedAuth(session);
  broadcastAuthSessionChanged(nextSession);
  return toRendererAuthSession(nextSession);
});

ipcMain.handle("backend:authLogout", async () => {
  let logoutError = null;
  const storedAuth = getStoredManagedAuth();

  if (storedAuth?.token) {
    try {
      await callManagedBackend("/api/auth/logout", {
        method: "POST",
        authToken: storedAuth.token,
      });
    } catch (error) {
      logoutError = error;
    }
  }

  clearStoredManagedAuth();
  broadcastAuthSessionChanged(null);

  if (logoutError) {
    throw logoutError;
  }

  return null;
});

ipcMain.handle("backend:authSession", async () => {
  const storedAuth = getStoredManagedAuth();
  if (!storedAuth?.token) {
    return null;
  }

  refreshAuthSessionInBackground(storedAuth);
  return toRendererAuthSession(storedAuth);
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
  return ensureSessionManager().getCurrentSession();
});

ipcMain.handle("session:start", (_event, session) => {
  return ensureSessionManager().startSession(session);
});

ipcMain.handle("session:stop", () => {
  return ensureSessionManager().stopSession();
});

ipcMain.handle("shell:openExternal", (_event, url) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("External URL must be http or https.");
  }
  shell.openExternal(url);
  return { ok: true };
});

// --- AUTO UPDATER IMPLEMENTATION ---

let autoUpdater = null;
if (process.platform === "win32") {
  try {
    ({ autoUpdater } = require("electron-updater"));
    // Trigger downloads ourselves so the state machine is predictable.
    autoUpdater.autoDownload = false;
  } catch (error) {
    console.error("[updater] failed to load electron-updater", error);
  }
}

let updateStatus = { status: "idle", version: app.getVersion(), progress: 0 };
let updateDownloadPromise = null;

function broadcastUpdateStatus() {
  for (const { win } of windowState.values()) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("update:status", updateStatus);
    }
  }
}

function initializeAutoUpdater() {
  if (!autoUpdater) {
    return;
  }

  autoUpdater.logger = console;

  autoUpdater.on("checking-for-update", () => {
    updateStatus = { status: "checking", version: app.getVersion() };
    broadcastUpdateStatus();
  });

  autoUpdater.on("update-available", (info) => {
    updateStatus = { status: "available", version: info.version };
    broadcastUpdateStatus();
    void triggerAutoUpdateDownload(info.version);
  });

  autoUpdater.on("update-not-available", () => {
    updateDownloadPromise = null;
    updateStatus = { status: "up-to-date", version: app.getVersion() };
    broadcastUpdateStatus();
  });

  autoUpdater.on("error", (err) => {
    updateDownloadPromise = null;
    updateStatus = { status: "error", version: app.getVersion(), message: err.message };
    broadcastUpdateStatus();
  });

  autoUpdater.on("download-progress", (progressObj) => {
    updateStatus = { status: "downloading", version: updateStatus.version, progress: progressObj.percent };
    broadcastUpdateStatus();
  });

  autoUpdater.on("update-downloaded", () => {
    updateDownloadPromise = null;
    updateStatus = { status: "downloaded", version: updateStatus.version };
    broadcastUpdateStatus();
  });
}

function triggerAutoUpdateDownload(version) {
  if (!autoUpdater) {
    return Promise.resolve();
  }

  if (updateDownloadPromise) {
    return updateDownloadPromise;
  }

  updateStatus = { status: "downloading", version, progress: 0 };
  broadcastUpdateStatus();

  updateDownloadPromise = autoUpdater
    .downloadUpdate()
    .catch((error) => {
      updateDownloadPromise = null;
      updateStatus = { status: "error", version: app.getVersion(), message: error.message };
      broadcastUpdateStatus();
      throw error;
    });

  return updateDownloadPromise;
}

function parseVersion(version) {
  return version
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function isNewerVersion(latest, current) {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);
  const maxLength = Math.max(latestParts.length, currentParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

function getPlatformAssetExtensions() {
  if (process.platform === "win32") {
    return [".exe", ".msi"];
  }
  if (process.platform === "darwin") {
    return [".dmg", ".zip", ".pkg"];
  }
  if (process.platform === "linux") {
    return [".appimage", ".deb", ".rpm", ".pacman", ".tar.gz"];
  }
  return [];
}

function getAssetExtensionWeight(name) {
  if (process.platform === "darwin") {
    if (name.endsWith(".dmg")) return 30;
    if (name.endsWith(".pkg")) return 20;
    if (name.endsWith(".zip")) return 10;
  }
  return 0;
}

function pickReleaseAssetUrl(releaseInfo) {
  const assets = Array.isArray(releaseInfo?.assets) ? releaseInfo.assets : [];
  if (assets.length === 0) {
    return releaseInfo?.html_url || null;
  }

  const expectedArchToken = process.arch === "x64" ? "x64" : process.arch;
  const expectedExtensions = getPlatformAssetExtensions();

  const scoredAssets = assets
    .map((asset) => {
      const url = typeof asset?.browser_download_url === "string" ? asset.browser_download_url : "";
      const name = String(asset?.name || "").toLowerCase();
      if (!url || !name) {
        return null;
      }

      const hasExpectedExtension = expectedExtensions.some((ext) => name.endsWith(ext));
      const matchesPlatform = name.includes(process.platform === "darwin" ? "mac" : process.platform);
      const matchesArch = name.includes(expectedArchToken);
      const score =
        (hasExpectedExtension ? 100 : 0) +
        (matchesPlatform ? 10 : 0) +
        (matchesArch ? 5 : 0) +
        getAssetExtensionWeight(name);

      return { score, url };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  if (scoredAssets.length === 0) {
    return releaseInfo?.html_url || null;
  }

  return scoredAssets[0].url || releaseInfo?.html_url || null;
}

async function triggerManualReleaseCheck(currentVersion) {
  const releaseInfo = await fetchLatestGitHubRelease("nirvaankohli", "sideklick");
  if (releaseInfo && releaseInfo.tag_name) {
    const latestVersion = releaseInfo.tag_name;
    if (isNewerVersion(latestVersion, currentVersion)) {
      updateStatus = {
        status: "manual-available",
        version: latestVersion,
        url:
          pickReleaseAssetUrl(releaseInfo) ||
          "https://github.com/nirvaankohli/sideklick/releases/latest"
      };
      broadcastUpdateStatus();
      return true;
    }
  }

  updateStatus = { status: "up-to-date", version: currentVersion };
  broadcastUpdateStatus();
  return false;
}

function fetchLatestGitHubRelease(owner, repo) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const options = {
      headers: {
        "User-Agent": "SideKlick-Updater-Client"
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
      }

      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", (e) => {
      reject(e);
    });
  });
}

async function triggerUpdateCheck() {
  const currentVersion = app.getVersion();
  if (autoUpdater) {
    updateStatus = { status: "checking", version: currentVersion };
    broadcastUpdateStatus();
    try {
      await autoUpdater.checkForUpdates();
      return;
    } catch (err) {
      console.error("[updater] check error", err);
      try {
        await triggerManualReleaseCheck(currentVersion);
      } catch (fallbackError) {
        console.error("[updater] manual fallback check error", fallbackError);
        updateStatus = { status: "error", version: currentVersion, message: err.message };
        broadcastUpdateStatus();
      }
      return;
    }
  } else {
    updateStatus = { status: "checking", version: currentVersion };
    broadcastUpdateStatus();

    try {
      await triggerManualReleaseCheck(currentVersion);
    } catch (err) {
      console.error("[updater] custom check error", err);
      updateStatus = { status: "error", version: currentVersion, message: err.message };
      broadcastUpdateStatus();
    }
  }
}

// IPC Handlers for Updates
ipcMain.handle("update:check", async () => {
  await triggerUpdateCheck();
  return { ok: true };
});

ipcMain.handle("update:quitAndInstall", () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall();
  }
});

ipcMain.handle("update:openDownload", (_event, url) => {
  if (url) {
    shell.openExternal(url);
  }
});

ipcMain.handle("update:getStatus", () => {
  return updateStatus;
});
