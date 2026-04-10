const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayApi", {
  minimizeToDock: () => ipcRenderer.invoke("window:minimizeToDock"),
  expandWindow: () => ipcRenderer.invoke("window:expand"),
  minimizeNative: () => ipcRenderer.invoke("window:minimizeNative"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  setThemeSource: (source) => ipcRenderer.invoke("theme:setSource", source),
  getPreferences: () => ipcRenderer.invoke("preferences:get"),
  updatePreferences: (patch) => ipcRenderer.invoke("preferences:update", patch),
  completeOnboarding: () => ipcRenderer.invoke("onboarding:complete"),
  onThemeChanged: (callback) => ipcRenderer.on("theme:changed", (_event, payload) => callback(payload)),
  onWindowMode: (callback) => ipcRenderer.on("window:mode", (_event, payload) => callback(payload))
});
