const root = document.querySelector(".window-shell");
const themeToggle = document.querySelector("#theme-toggle");
const themeIconToggle = document.querySelector("#theme-icon-toggle");
const shrinkWindow = document.querySelector("#shrink-window");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const presetLight = document.querySelector("#preset-light");
const presetDark = document.querySelector("#preset-dark");
const presetSystem = document.querySelector("#preset-system");
const restoreWindow = document.querySelector("#restore-window");

const sources = ["light", "dark", "system"];
let currentSourceIndex = 0;
let currentTone = "light";

function labelForSource(source, isDark) {
  if (source === "system") {
    return `Backdrop: System (${isDark ? "Dark" : "Light"})`;
  }

  return `Backdrop: ${source.charAt(0).toUpperCase()}${source.slice(1)}`;
}

function applyThemeState({ themeSource, shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
  currentSourceIndex = sources.indexOf(themeSource);
  if (currentSourceIndex < 0) {
    currentSourceIndex = 0;
  }

  themeToggle.textContent = labelForSource(themeSource, shouldUseDarkColors);
}

function setMode(mode) {
  root.dataset.mode = mode;
}

themeToggle.addEventListener("click", async () => {
  currentSourceIndex = (currentSourceIndex + 1) % sources.length;
  const nextSource = sources[currentSourceIndex];
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemeState(result);
});

themeIconToggle.addEventListener("click", async () => {
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemeState(result);
});

shrinkWindow.addEventListener("click", async () => {
  await window.overlayApi.minimizeToDock();
});

closeWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

compactCloseWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

presetLight.addEventListener("click", async () => {
  const result = await window.overlayApi.setThemeSource("light");
  applyThemeState(result);
});

presetDark.addEventListener("click", async () => {
  const result = await window.overlayApi.setThemeSource("dark");
  applyThemeState(result);
});

presetSystem.addEventListener("click", async () => {
  const result = await window.overlayApi.setThemeSource("system");
  applyThemeState(result);
});

restoreWindow.addEventListener("click", async () => {
  await window.overlayApi.expandWindow();
});

window.overlayApi.onThemeChanged(applyThemeState);
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
