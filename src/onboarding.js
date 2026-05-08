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
const privacyPolicyButtons = Array.from(document.querySelectorAll("[data-onboarding-screenshot-policy]"));
const syncConsentButtons = Array.from(document.querySelectorAll("[data-onboarding-sync-consent]"));
const stepButtons = Array.from(document.querySelectorAll("[data-step-target]"));
const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
const resizeHandle = document.querySelector("#resize-handle");
const privacyStatus = document.querySelector("#privacy-onboarding-status");
const authStatus = document.querySelector("#auth-status");
const authEmailInput = document.querySelector("#auth-email-input");
const authPasswordInput = document.querySelector("#auth-password-input");
const authDisplayNameInput = document.querySelector("#auth-display-name-input");
const authLoginButton = document.querySelector("#auth-login-button");
const authRegisterButton = document.querySelector("#auth-register-button");
let activeStep = 1;
let authSession = null;

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

const screenshotPolicyLabels = {
  automatic: "Automatic screenshots enabled",
  manual: "Manual screenshots only",
  disabled: "Screenshots disabled",
};

const syncConsentLabels = {
  unknown: "Consent not set",
  granted: "Open to future sync",
  denied: "No sync consent",
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

function applyPrivacySelections(settings) {
  const { screenshotPolicy, syncConsent } = settings;

  for (const button of privacyPolicyButtons) {
    button.dataset.selected =
      button.dataset.onboardingScreenshotPolicy === screenshotPolicy ? "true" : "false";
  }

  for (const button of syncConsentButtons) {
    button.dataset.selected =
      button.dataset.onboardingSyncConsent === syncConsent ? "true" : "false";
  }

  privacyStatus.textContent = `${screenshotPolicyLabels[screenshotPolicy]}. ${syncConsentLabels[syncConsent]}.`;
}

function applyAuthSession(nextSession) {
  authSession = nextSession && typeof nextSession === "object" ? nextSession : null;
  authStatus.textContent = authSession?.user
    ? `Signed in as ${authSession.user.displayName || authSession.user.email}.`
    : "Create an account or sign in before using the app.";
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
    setActiveStep(2);
  } catch (error) {
    authStatus.textContent =
      error instanceof Error ? error.message : "Authentication failed.";
  } finally {
    setAuthButtonsDisabled(false);
  }
}

function setActiveStep(nextStep) {
  if (nextStep > 1 && !authSession?.user) {
    activeStep = 1;
  } else {
    activeStep = nextStep;
  }
  root.dataset.activeStep = String(activeStep);

  for (const button of stepButtons) {
    button.dataset.active = button.dataset.stepTarget === String(activeStep) ? "true" : "false";
  }

  for (const panel of stepPanels) {
    panel.hidden = panel.dataset.stepPanel !== String(activeStep);
  }

  stepCaption.textContent = `Step ${activeStep} of 4`;
  continueButton.textContent = activeStep === 4 ? "Open SideClick" : "Continue";
  continueButton.disabled = activeStep === 1 && !authSession?.user;
}

function attachResizeHandle(handle) {
  if (!handle) {
    return;
  }

  let startPointer = null;
  let startBounds = null;

  handle.addEventListener("pointerdown", async (event) => {
    event.preventDefault();
    startPointer = { x: event.screenX, y: event.screenY };
    startBounds = await window.overlayApi.getWindowBounds();
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", async (event) => {
    if (!startPointer || !startBounds) {
      return;
    }

    await window.overlayApi.resizeWindow({
      width: startBounds.width + (event.screenX - startPointer.x),
      height: startBounds.height + (event.screenY - startPointer.y),
    });
  });

  handle.addEventListener("pointerup", (event) => {
    startPointer = null;
    startBounds = null;
    handle.releasePointerCapture(event.pointerId);
  });
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

for (const button of privacyPolicyButtons) {
  button.addEventListener("click", async () => {
    const settings = await window.overlayApi.updatePrivacySettings({
      screenshotPolicy: button.dataset.onboardingScreenshotPolicy,
    });
    applyPrivacySelections(settings);
  });
}

for (const button of syncConsentButtons) {
  button.addEventListener("click", async () => {
    const settings = await window.overlayApi.updatePrivacySettings({
      syncConsent: button.dataset.onboardingSyncConsent,
    });
    applyPrivacySelections(settings);
  });
}
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
  setActiveStep(1);
  attachResizeHandle(resizeHandle);
});
