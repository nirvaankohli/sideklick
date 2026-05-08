const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayApi", {
  minimizeToDock: () => ipcRenderer.invoke("window:minimizeToDock"),
  expandWindow: () => ipcRenderer.invoke("window:expand"),
  minimizeNative: () => ipcRenderer.invoke("window:minimizeNative"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  setThemeSource: (source) => ipcRenderer.invoke("theme:setSource", source),
  getPreferences: () => ipcRenderer.invoke("preferences:get"),
  updatePreferences: (patch) => ipcRenderer.invoke("preferences:update", patch),
  getClassFolders: () => ipcRenderer.invoke("class-folders:get"),
  updateClassFolders: (folders) =>
    ipcRenderer.invoke("class-folders:update", folders),
  getPrivacySettings: () => ipcRenderer.invoke("privacy-settings:get"),
  setPrivacySettings: (settings) => ipcRenderer.invoke("privacy-settings:set", settings),
  updatePrivacySettings: (patch) => ipcRenderer.invoke("privacy-settings:update", patch),
  resetPrivacySettings: () => ipcRenderer.invoke("privacy-settings:reset"),
  saveClassProfile: (classProfile) => ipcRenderer.invoke("backend:saveClassProfile", classProfile),
  assist: (payload) => ipcRenderer.invoke("backend:assist", payload),
  submitFeedback: (payload) => ipcRenderer.invoke("backend:feedback", payload),
  generateQuiz: (payload) => ipcRenderer.invoke("backend:quiz", payload),
  exportAccountData: (options) => ipcRenderer.invoke("backend:exportAccount", options),
  deleteAccount: () => ipcRenderer.invoke("backend:deleteAccount"),
  completeOnboarding: () => ipcRenderer.invoke("onboarding:complete"),
  getCurrentSession: () => ipcRenderer.invoke("session:getCurrent"),
  startSession: (session) => ipcRenderer.invoke("session:start", session),
  stopSession: () => ipcRenderer.invoke("session:stop"),
  getWindowBounds: () => ipcRenderer.invoke("window:getBounds"),
  resizeWindow: (bounds) => ipcRenderer.invoke("window:resize", bounds),
  onThemeChanged: (callback) =>
    ipcRenderer.on("theme:changed", (_event, payload) => callback(payload)),
  onWindowMode: (callback) =>
    ipcRenderer.on("window:mode", (_event, payload) => callback(payload)),
  onSessionChanged: (callback) =>
    ipcRenderer.on("session:changed", (_event, payload) => callback(payload)),
  onClassFoldersChanged: (callback) =>
    ipcRenderer.on("class-folders:changed", (_event, payload) => callback(payload)),
  onIncomingPayload: (callback) =>
    ipcRenderer.on("incoming:payload", (_event, payload) => callback(payload)),
});
