const root = document.querySelector(".window-shell");
const closeWindow = document.querySelector("#close-window");
const onboardingIntroView = document.querySelector("#onboarding-intro-view");
const onboardingSetupView = document.querySelector("#onboarding-setup-view");
const getStartedButton = document.querySelector("#onboarding-get-started");
const themeStatus = document.querySelector("#theme-status");
const sourceStatus = document.querySelector("#source-status");
const profileStatus = document.querySelector("#profile-status");
const stepCaption = document.querySelector("#step-caption");
const backButton = document.querySelector("#back-button");
const continueButton = document.querySelector("#continue-button");
const progressFill = document.querySelector("#onboarding-progress-fill");
const progressItems = Array.from(document.querySelectorAll("[data-step-label]"));
const choiceButtons = {
  light: document.querySelector("#choose-light"),
  dark: document.querySelector("#choose-dark"),
  system: document.querySelector("#choose-system"),
};
const sourceSelect = document.querySelector("#discovery-source-select");
const profileSelect = document.querySelector("#customer-profile-select");
const privacyPolicySelect = document.querySelector("#privacy-screenshot-policy-select");
const syncConsentSelect = document.querySelector("#privacy-sync-consent-select");
const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
const privacyStatus = document.querySelector("#privacy-onboarding-status");
const authStatus = document.querySelector("#auth-status");
const authEmailInput = document.querySelector("#auth-email-input");
const authPasswordInput = document.querySelector("#auth-password-input");
const authDisplayNameInput = document.querySelector("#auth-display-name-input");
const authLoginButton = document.querySelector("#auth-login-button");
const authRegisterButton = document.querySelector("#auth-register-button");

let activeStep = 1;
let onboardingStarted = false;
let authSession = null;

const sourceLabels = {
  teacher: "Teacher or class recommendation",
  friend: "Friend recommendation",
  hackathon: "Big Red Hacks or demo",
  search: "Online search",
};

const profileLabels = {
  advanced: "AP / Honors",
  "catch-up": "Catch-Up",
  exam: "Exam Focused",
};

const screenshotPolicyLabels = {
  automatic: "Auto",
  manual: "Manual",
  disabled: "Never",
};

const syncConsentLabels = {
  unknown: "Later",
  granted: "On",
  denied: "Off",
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

  sourceSelect.value = discoverySource || "";
  profileSelect.value = customerProfile || "";
  sourceSelect.parentElement.dataset.hasValue = discoverySource ? "true" : "false";
  profileSelect.parentElement.dataset.hasValue = customerProfile ? "true" : "false";

  sourceStatus.textContent = discoverySource
    ? `Current: ${sourceLabels[discoverySource]}`
    : "No source selected yet.";

  profileStatus.textContent = customerProfile
    ? `Current: ${profileLabels[customerProfile]}`
    : "Pick the closest fit.";
}

function applyPrivacySelections(settings) {
  const { screenshotPolicy, syncConsent } = settings;

  privacyPolicySelect.value = screenshotPolicy;
  syncConsentSelect.value = syncConsent;
  privacyPolicySelect.parentElement.dataset.hasValue = "true";
  syncConsentSelect.parentElement.dataset.hasValue = "true";

  privacyStatus.textContent = `Screenshots: ${screenshotPolicyLabels[screenshotPolicy]}. Telemetry: ${syncConsentLabels[syncConsent]}.`;
}

function applyAuthSession(nextSession) {
  authSession = nextSession && typeof nextSession === "object" ? nextSession : null;
  authStatus.textContent = authSession?.user
    ? `Signed in as ${authSession.user.displayName || authSession.user.email}.`
    : "Create an account or sign in to continue.";
  authLoginButton.disabled = false;
  authRegisterButton.disabled = false;
}

function setAuthButtonsDisabled(disabled) {
  authLoginButton.disabled = disabled;
  authRegisterButton.disabled = disabled;
}

async function submitAuth(mode) {
  setAuthButtonsDisabled(true);
  authStatus.textContent =
    mode === "register" ? "Creating account..." : "Signing in...";

  try {
    const session =
      mode === "register"
        ? await window.overlayApi.registerAccount({
            email: authEmailInput.value.trim(),
            password: authPasswordInput.value,
            displayName: authDisplayNameInput.value.trim(),
          })
        : await window.overlayApi.loginAccount({
            email: authEmailInput.value.trim(),
            password: authPasswordInput.value,
          });
    applyAuthSession(session);
    authPasswordInput.value = "";
    onboardingStarted = true;
    root.dataset.onboardingStage = "setup";
    onboardingIntroView.hidden = true;
    onboardingSetupView.hidden = false;
    setActiveStep(2);
  } catch (error) {
    authStatus.textContent =
      error instanceof Error ? error.message : "Authentication failed.";
  } finally {
    setAuthButtonsDisabled(false);
  }
}

function setProgress(step) {
  const progressPercent = Math.max(0, Math.min(100, (step / 4) * 100));
  progressFill.style.width = `${progressPercent}%`;

  for (const item of progressItems) {
    item.dataset.active = item.dataset.stepLabel === String(step) ? "true" : "false";
    item.dataset.complete = Number(item.dataset.stepLabel) < step ? "true" : "false";
  }
}

function setActiveStep(nextStep) {
  if (nextStep > 1 && !authSession?.user) {
    activeStep = 1;
  } else {
    activeStep = nextStep;
  }

  setProgress(activeStep);

  for (const panel of stepPanels) {
    panel.hidden = panel.dataset.stepPanel !== String(activeStep);
  }

  stepCaption.textContent = `${activeStep} / 4`;
  continueButton.textContent = activeStep === 4 ? "Open SideKlick" : "Continue";
  continueButton.disabled = activeStep === 1 && !authSession?.user;
  backButton.disabled = activeStep === 1;
}

for (const [source, button] of Object.entries(choiceButtons)) {
  button.addEventListener("click", async () => {
    const result = await window.overlayApi.setThemeSource(source);
    applyThemeState(result);
  });
}

sourceSelect.addEventListener("change", async () => {
  const preferences = await window.overlayApi.updatePreferences({
    discoverySource: sourceSelect.value || null,
  });
  applyPreferenceSelections(preferences);
});

profileSelect.addEventListener("change", async () => {
  const preferences = await window.overlayApi.updatePreferences({
    customerProfile: profileSelect.value || null,
  });
  applyPreferenceSelections(preferences);
});

privacyPolicySelect.addEventListener("change", async () => {
  const settings = await window.overlayApi.updatePrivacySettings({
    screenshotPolicy: privacyPolicySelect.value,
  });
  applyPrivacySelections(settings);
});

syncConsentSelect.addEventListener("change", async () => {
  const settings = await window.overlayApi.updatePrivacySettings({
    syncConsent: syncConsentSelect.value,
  });
  applyPrivacySelections(settings);
});

getStartedButton.addEventListener("click", () => {
  onboardingStarted = true;
  root.dataset.onboardingStage = "setup";
  onboardingIntroView.hidden = true;
  onboardingSetupView.hidden = false;
  setActiveStep(1);
});

authLoginButton.addEventListener("click", async () => {
  await submitAuth("login");
});

authRegisterButton.addEventListener("click", async () => {
  await submitAuth("register");
});

closeWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

continueButton.addEventListener("click", async () => {
  if (activeStep < 4) {
    setActiveStep(activeStep + 1);
    return;
  }

  await window.overlayApi.completeOnboarding();
});

backButton.addEventListener("click", () => {
  if (activeStep > 1) {
    setActiveStep(activeStep - 1);
  }
});

window.overlayApi.onThemeChanged(applyThemeState);

window.addEventListener("DOMContentLoaded", async () => {
  const [preferences, privacySettings, session] = await Promise.all([
    window.overlayApi.getPreferences(),
    window.overlayApi.getPrivacySettings(),
    window.overlayApi.getAuthSession(),
  ]);
  applyPreferenceSelections(preferences);
  applyPrivacySelections(privacySettings);
  applyAuthSession(session);
  root.dataset.onboardingStage = "intro";
  onboardingIntroView.hidden = false;
  onboardingSetupView.hidden = true;
  setActiveStep(1);
});
