const path = require("path");
const fs = require("fs");
const {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  screen,
} = require("electron");
const {
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
  resolveWindowTemplate,
} = require("./config/windows");

const windowsByKey = new Map();
const windowState = new Map();
const ALLOWED_THEME_SOURCES = new Set(["system", "light", "dark"]);

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
  return !Boolean(readPreferences().hasLaunchedBefore);
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

app.whenReady().then(() => {
  const isFirstRun = !hasLaunchedBefore();
  applyThemeSource(readStoredThemeSource());
  createStartupWindows(isFirstRun);
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
  if (process.platform !== "darwin") {
    app.quit();
  }
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

ipcMain.handle("onboarding:complete", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  createStartupWindows(false);
  if (win && !win.isDestroyed()) {
    win.close();
  }
  return { ok: true };
});
