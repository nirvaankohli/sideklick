const root = document.querySelector(".window-shell");
const closeWindow = document.querySelector("#close-window");
const themeStatus = document.querySelector("#theme-status");
const sourceStatus = document.querySelector("#source-status");
const profileStatus = document.querySelector("#profile-status");
const stepCaption = document.querySelector("#step-caption");
const continueButton = document.querySelector("#continue-button");
const choiceButtons = {
  light: document.querySelector("#choose-light"),
  dark: document.querySelector("#choose-dark"),
  system: document.querySelector("#choose-system")
};
const sourceButtons = Array.from(document.querySelectorAll("[data-source]"));
const profileButtons = Array.from(document.querySelectorAll("[data-profile]"));
const stepButtons = Array.from(document.querySelectorAll("[data-step-target]"));
const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
let activeStep = 1;

const sourceLabels = {
  teacher: "Teacher or class recommendation",
  friend: "Friend recommendation",
  hackathon: "Big Red Hacks or demo",
  search: "Online search"
};

const profileLabels = {
  advanced: "AP / Honors",
  "catch-up": "Catch-Up",
  exam: "Exam Focused"
};

function humanLabel(themeSource, shouldUseDarkColors) {
  if (themeSource === "system") {
    return `System (${shouldUseDarkColors ? "Dark" : "Light"})`;
  }

  return `${themeSource.charAt(0).toUpperCase()}${themeSource.slice(1)}`;
}

function applyThemeState({ themeSource, shouldUseDarkColors }) {
  root.dataset.tone = shouldUseDarkColors ? "dark" : "light";

  for (const [source, button] of Object.entries(choiceButtons)) {
    button.dataset.selected = source === themeSource ? "true" : "false";
  }

  themeStatus.textContent = `Current preference: ${humanLabel(themeSource, shouldUseDarkColors)}`;
}

function applyPreferenceSelections(preferences) {
  const { discoverySource, customerProfile } = preferences;

  for (const button of sourceButtons) {
    button.dataset.selected = button.dataset.source === discoverySource ? "true" : "false";
  }

  for (const button of profileButtons) {
    button.dataset.selected = button.dataset.profile === customerProfile ? "true" : "false";
  }

  sourceStatus.textContent = discoverySource
    ? `Current source: ${sourceLabels[discoverySource]}`
    : "No source selected yet.";

  profileStatus.textContent = customerProfile
    ? `Current profile: ${profileLabels[customerProfile]}`
    : "Pick the closest fit.";
}

function setActiveStep(nextStep) {
  activeStep = nextStep;
  root.dataset.activeStep = String(activeStep);

  for (const button of stepButtons) {
    button.dataset.active = button.dataset.stepTarget === String(activeStep) ? "true" : "false";
  }

  for (const panel of stepPanels) {
    panel.hidden = panel.dataset.stepPanel !== String(activeStep);
  }

  stepCaption.textContent = `Step ${activeStep} of 3`;
  continueButton.textContent = activeStep === 3 ? "Open SideClick" : "Continue";
}

for (const [source, button] of Object.entries(choiceButtons)) {
  button.addEventListener("click", async () => {
    const result = await window.overlayApi.setThemeSource(source);
    applyThemeState(result);
  });
}

for (const button of stepButtons) {
  button.addEventListener("click", () => {
    setActiveStep(Number(button.dataset.stepTarget));
  });
}

for (const button of sourceButtons) {
  button.addEventListener("click", async () => {
    const preferences = await window.overlayApi.updatePreferences({
      discoverySource: button.dataset.source
    });
    applyPreferenceSelections(preferences);
  });
}

for (const button of profileButtons) {
  button.addEventListener("click", async () => {
    const preferences = await window.overlayApi.updatePreferences({
      customerProfile: button.dataset.profile
    });
    applyPreferenceSelections(preferences);
  });
}

closeWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

continueButton.addEventListener("click", async () => {
  if (activeStep < 3) {
    setActiveStep(activeStep + 1);
    return;
  }

  await window.overlayApi.completeOnboarding();
});

window.overlayApi.onThemeChanged(applyThemeState);

window.addEventListener("DOMContentLoaded", async () => {
  const preferences = await window.overlayApi.getPreferences();
  applyPreferenceSelections(preferences);
  setActiveStep(1);
});
