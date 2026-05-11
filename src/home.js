const root = document.querySelector(".window-shell");
const shrinkWindow = document.querySelector("#shrink-window");
const openSettingsButton = document.querySelector("#open-settings");
const openSettingsIconPath = openSettingsButton?.querySelector("path");
const minimizeNative = document.querySelector("#minimize-native");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const homeDashboardView = document.querySelector("#home-dashboard-view");
const homeSettingsView = document.querySelector("#home-settings-view");
const homeAuthGateView = document.querySelector("#home-auth-gate-view");
const settingsHomeButton = document.querySelector("#settings-home-button");
const backFolderButton = document.querySelector("#back-folder");
const newFolderButton = document.querySelector("#new-folder");
const folderActionMenu = document.querySelector("#folder-action-menu");
const folderNameInput = document.querySelector("#folder-name-input");
const folderGrid = document.querySelector("#folder-grid");
const breadcrumbs = document.querySelector("#breadcrumbs");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const editCurrentClassButton = document.querySelector("#edit-current-class-button");
const classModalBackdrop = document.querySelector("#class-modal-backdrop");
const classModalKicker = document.querySelector("#class-modal-kicker");
const classModalTitle = document.querySelector("#class-modal-title");
const closeClassModal = document.querySelector("#close-class-modal");
const cancelClassModal = document.querySelector("#cancel-class-modal");
const saveClassModal = document.querySelector("#save-class-modal");
const classFields = document.querySelector("#class-fields");
const sessionFields = document.querySelector("#session-fields");
const nameFieldLabel = document.querySelector("#name-field-label");
const teacherNameField = document.querySelector("#teacher-name-field");
const teacherNotesField = document.querySelector("#teacher-notes-field");
const testFormatField = document.querySelector("#test-format-field");
const testExamplesField = document.querySelector("#test-examples-field");
const additionalNotesLabel = document.querySelector("#additional-notes-label");
const classCourseInput = document.querySelector("#class-course-input");
const classTeacherInput = document.querySelector("#class-teacher-input");
const classTestFormatInput = document.querySelector("#class-test-format-input");
const classDescriptionInput = document.querySelector(
  "#class-description-input",
);
const classTeacherNotesInput = document.querySelector(
  "#class-teacher-notes-input",
);
const classTestExamplesInput = document.querySelector(
  "#class-test-examples-input",
);
const classAdditionalNotesInput = document.querySelector(
  "#class-additional-notes-input",
);
const sessionNameInput = document.querySelector("#session-name-input");
const sessionNotesInput = document.querySelector("#session-notes-input");
const sessionSummaryBackdrop = document.querySelector(
  "#session-summary-backdrop",
);
const closeSessionSummaryButton = document.querySelector(
  "#close-session-summary",
);
const sessionSummaryTitle = document.querySelector("#session-summary-title");
const sessionSummaryMeta = document.querySelector("#session-summary-meta");
const sessionSummaryText = document.querySelector("#session-summary-text");
const quizBackdrop = document.querySelector("#quiz-backdrop");
const closeQuizModalButton = document.querySelector("#close-quiz-modal");
const quizThemeToggle = document.querySelector("#quiz-theme-toggle");
const quizMinimizeNative = document.querySelector("#quiz-minimize-native");
const quizModalTitle = document.querySelector("#quiz-modal-title");
const quizSessionMeta = document.querySelector("#quiz-session-meta");
const quizSessionPicker = document.querySelector("#quiz-session-picker");
const quizSetupView = document.querySelector("#quiz-setup-view");
const quizView = document.querySelector("#quiz-view");
const quizSourceSummary = document.querySelector("#quiz-source-summary");
const quizSourceNotes = document.querySelector("#quiz-source-notes");
const quizSourceTopics = document.querySelector("#quiz-source-topics");
const quizSourceUploaded = document.querySelector("#quiz-source-uploaded");
const quizMaterialFile = document.querySelector("#quiz-material-file");
const quizFileName = document.querySelector("#quiz-file-name");
const quizMaterialText = document.querySelector("#quiz-material-text");
const quizGapFocus = document.querySelector("#quiz-gap-focus");
const quizGapFocusValue = document.querySelector("#quiz-gap-focus-value");
const generateQuizButton = document.querySelector("#generate-quiz-button");
const quizSubtitle = document.querySelector("#quiz-subtitle");
const quizInsights = document.querySelector("#quiz-insights");
const quizStrengths = document.querySelector("#quiz-strengths");
const quizGaps = document.querySelector("#quiz-gaps");
const quizQuestions = document.querySelector("#quiz-questions");
const quizExplainHint = document.querySelector("#quiz-explain-hint");
const quizExplanationPanel = document.querySelector("#quiz-explanation-panel");
const quizExplanationTitle = document.querySelector("#quiz-explanation-title");
const quizExplanationAnswer = document.querySelector(
  "#quiz-explanation-answer",
);
const quizExplanationText = document.querySelector("#quiz-explanation-text");
const saveQuizButton = document.querySelector("#save-quiz-button");
const quizSubmitButton = document.querySelector("#quiz-submit-button");
const cramBackdrop = document.querySelector("#cram-backdrop");
const closeCramModalButton = document.querySelector("#close-cram-modal");
const cramThemeToggle = document.querySelector("#cram-theme-toggle");
const cramMinimizeNative = document.querySelector("#cram-minimize-native");
const cramSessionMeta = document.querySelector("#cram-session-meta");
const cramSetupView = document.querySelector("#cram-setup-view");
const cramView = document.querySelector("#cram-view");
const cramExamNameInput = document.querySelector("#cram-exam-name");
const cramTimeAvailableSelect = document.querySelector("#cram-time-available");
const cramMaterialFile = document.querySelector("#cram-material-file");
const cramFileName = document.querySelector("#cram-file-name");
const cramUploadRollup = document.querySelector("#cram-upload-rollup");
const cramMaterialText = document.querySelector("#cram-material-text");
const cramAdditionalNotes = document.querySelector("#cram-additional-notes");
const cramMaterialCount = document.querySelector("#cram-material-count");
const cramMaterialStatus = document.querySelector("#cram-material-status");
const generateCramButton = document.querySelector("#generate-cram-button");
const cramSubtitle = document.querySelector("#cram-subtitle");
const cramNowFocus = document.querySelector("#cram-now-focus");
const cramSideklickTip = document.querySelector("#cram-sideklick-tip");
const cramStudyFirst = document.querySelector("#cram-study-first");
const cramStudyNext = document.querySelector("#cram-study-next");
const cramSkipList = document.querySelector("#cram-skip-list");
const cramTimePlan = document.querySelector("#cram-time-plan");
const cramLikelyQuestions = document.querySelector("#cram-likely-questions");
const cramQuickSelfTest = document.querySelector("#cram-quick-self-test");
const cramRunwaySummary = document.querySelector("#cram-runway-summary");
const cramStepNow = document.querySelector("#cram-step-now");
const cramStepNext = document.querySelector("#cram-step-next");
const cramStepSkip = document.querySelector("#cram-step-skip");
const cramStepQuestions = document.querySelector("#cram-step-questions");
const cramStepTest = document.querySelector("#cram-step-test");
const cramGuideGuardrail = document.querySelector("#cram-guide-guardrail");
const cramGuideRecovery = document.querySelector("#cram-guide-recovery");
const backToCramSetupButton = document.querySelector(
  "#back-to-cram-setup-button",
);
const regenerateCramButton = document.querySelector("#regenerate-cram-button");
const cramShared = window.CRAM_SHARED || {};
const cramConstraintsConfig = cramShared.cramInputConstraints || {
  maxMaterialCharacters: 24000,
};
const validateCramMaterialPayload =
  cramShared.validateCramMaterialInput ||
  ((value) => ({
    ok: Boolean(String(value ?? "").trim()),
    normalizedMaterial: String(value ?? "").trim(),
  }));
const resizeHandle = document.querySelector("#resize-handle");
const settingsThemeStatus = document.querySelector("#settings-theme-status");
const settingsSourceStatus = document.querySelector("#settings-source-status");
const settingsProfileStatus = document.querySelector(
  "#settings-profile-status",
);
const settingsThemeSelect = document.querySelector("#settings-theme-select");
const settingsSourceSelect = document.querySelector("#settings-source-select");
const settingsProfileSelect = document.querySelector("#settings-profile-select");
const settingsPrivacyStatus = document.querySelector(
  "#settings-privacy-status",
);
const privacyScreenshotStatus = document.querySelector(
  "#privacy-screenshot-status",
);
const privacySyncStatus = document.querySelector("#privacy-sync-status");
const privacyLocalOnlyStatus = document.querySelector(
  "#privacy-local-only-status",
);
const privacyScreenshotSelect = document.querySelector(
  "#privacy-screenshot-select",
);
const privacySyncSelect = document.querySelector("#privacy-sync-select");
const privacyLocalOnlySelect = document.querySelector(
  "#privacy-local-only-select",
);
const accountAuthStatus = document.querySelector("#account-auth-status");
const accountSignedOutPanel = document.querySelector("#account-signed-out-panel");
const accountSignedInPanel = document.querySelector("#account-signed-in-panel");
const accountIdentityDisplay = document.querySelector("#account-identity-display");
const accountOpenAuthGateButton = document.querySelector(
  "#account-open-auth-gate-button",
);
const accountLogoutButton = document.querySelector("#account-logout-button");
const privacyExportButton = document.querySelector("#privacy-export-button");
const privacyDeleteAccountButton = document.querySelector(
  "#privacy-delete-account-button",
);
const privacyAccountStatus = document.querySelector("#privacy-account-status");
const authGateStatus = document.querySelector("#auth-gate-status");
const authGateEmailInput = document.querySelector("#auth-gate-email-input");
const authGatePasswordInput = document.querySelector("#auth-gate-password-input");
const authGateDisplayNameInput = document.querySelector(
  "#auth-gate-display-name-input",
);
const authGateLoginButton = document.querySelector("#auth-gate-login-button");
const authGateRegisterButton = document.querySelector("#auth-gate-register-button");
const settingsThemeButtons = Array.from(
  document.querySelectorAll("[data-home-theme]"),
);
const settingsSourceButtons = Array.from(
  document.querySelectorAll("[data-home-source]"),
);
const settingsProfileButtons = Array.from(
  document.querySelectorAll("[data-home-profile]"),
);
const privacyScreenshotButtons = Array.from(
  document.querySelectorAll("[data-screenshot-policy]"),
);
const privacySyncButtons = Array.from(
  document.querySelectorAll("[data-sync-consent]"),
);
const homeHeader = document.querySelector("#top-h1");

let currentTone = "light";
let folders = [];
let currentPath = [];
let currentModalMode = "class";
let currentModalAction = "create";
let currentModalTargetPath = null;
let isFolderActionMenuOpen = false;
let fitTextFrame = null;
let activeQuizClassFolder = null;
let uploadedQuizMaterial = "";
let uploadedQuizMaterialSummary = "";
let activeQuiz = null;
let quizHasBeenChecked = false;
let activeCramPlan = null;
let uploadedCramMaterials = [];
let cramMaterialUploadError = "";
let cramMaterialUploadSummary = "";
let isGeneratingCramPlan = false;
let activeHomeView = "dashboard";
let privacySettings = null;
let authSession = null;
let postAuthHomeView = "dashboard";
const customSettingsDropdowns = new Map();
const SETTINGS_ICON_PATH =
  "M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z";
const HOME_ICON_PATH = "M12 3 3 10.4V21h6.5v-6h5v6H21V10.4z";
const MUI_CREATE_ACTION_ICON_PATHS = {
  class:
    "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z",

  unit:
    "M11.99 18.54 4.62 12.8 3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z",

  lesson:
    "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",

  session:
    "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",

  quiz:
    "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5.99 13H12v-2h2.01v2zm1.54-5.07-.9.92c-.65.66-.86 1.16-.86 2.15h-1.8v-.45c0-1 .41-1.91 1.07-2.57l1.24-1.26c.37-.36.58-.86.58-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H9.08c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.26z",
  cram:
    "M4 5h16v2H4zm2 4h12v2H6zm-1 4h14v2H5zm2 4h8v2H7z",
};

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
  automatic: "Automatic",
  manual: "Manual only",
  disabled: "Never",
};

const syncConsentLabels = {
  unknown: "Ask later",
  granted: "Allowed",
  denied: "Denied",
};

const localOnlyLabels = {
  true: "Local data only",
  false: "Cloud features allowed",
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isContainerType(type) {
  return type === "class" || type === "unit" || type === "lesson";
}

function getContainerDepth(path = currentPath) {
  return path.length;
}

function getCurrentNode() {
  return getFolderAtPath(currentPath);
}

function getCurrentClassFolder() {
  if (currentPath.length === 0) {
    return null;
  }

  return getFolderAtPath([currentPath[0]]);
}

function getCurrentClassPath() {
  return currentPath.length > 0 ? [currentPath[0]] : null;
}

function getCurrentContainerType() {
  if (currentPath.length === 0) {
    return "root";
  }

  return getCurrentNode()?.type || "root";
}

function getCurrentUnitLessonLineage() {
  const lineage = [];
  let currentChildren = folders;

  for (const segment of currentPath) {
    const next = (currentChildren || []).find((item) => item.id === segment);
    if (!next) {
      break;
    }
    if (next.type === "unit" || next.type === "lesson") {
      lineage.push(next);
    }
    currentChildren = next.children || [];
  }

  return lineage;
}

function buildCurrentUnitPathLabel() {
  const lineage = getCurrentUnitLessonLineage();
  if (lineage.length === 0) {
    return null;
  }
  return lineage.map((item) => item.name).join(" > ");
}

function buildHierarchyContextNotes() {
  const lineage = getCurrentUnitLessonLineage();
  const lines = lineage.flatMap((item) => {
    const label = item.type === "unit" ? "Unit" : "Lesson";
    return [
      `${label}: ${item.name}`,
      item.description ? `${label} description: ${item.description}` : null,
      item.additionalNotes ? `${label} notes: ${item.additionalNotes}` : null,
    ].filter(Boolean);
  });

  return lines.length > 0 ? lines.join("\n") : null;
}

function getContextualCreateActions() {
  const containerType = getCurrentContainerType();

  if (containerType === "root") {
    return [{ key: "class", label: "Class", icon: MUI_CREATE_ACTION_ICON_PATHS.class }];
  }

  if (containerType === "class") {
    return [
      { key: "unit", label: "Unit", icon: MUI_CREATE_ACTION_ICON_PATHS.unit },
      { key: "session", label: "Session", icon: MUI_CREATE_ACTION_ICON_PATHS.session },
      { key: "cram", label: "Cram Mode", icon: MUI_CREATE_ACTION_ICON_PATHS.cram },
      { key: "quiz", label: "Quiz", icon: MUI_CREATE_ACTION_ICON_PATHS.quiz },
    ];
  }

  if (containerType === "unit") {
    return [
      { key: "lesson", label: "Lesson", icon: MUI_CREATE_ACTION_ICON_PATHS.lesson },
      { key: "session", label: "Session", icon: MUI_CREATE_ACTION_ICON_PATHS.session },
      { key: "cram", label: "Cram Mode", icon: MUI_CREATE_ACTION_ICON_PATHS.cram },
      { key: "quiz", label: "Quiz", icon: MUI_CREATE_ACTION_ICON_PATHS.quiz },
    ];
  }

  return [
    { key: "session", label: "Session", icon: MUI_CREATE_ACTION_ICON_PATHS.session },
    { key: "cram", label: "Cram Mode", icon: MUI_CREATE_ACTION_ICON_PATHS.cram },
    { key: "quiz", label: "Quiz", icon: MUI_CREATE_ACTION_ICON_PATHS.quiz },
  ];
}

function fitTextToBox(element, minimumFontSize = 11) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const computedStyle = window.getComputedStyle(element);
  const baseFontSize =
    Number.parseFloat(element.dataset.baseFontSize || "") ||
    Number.parseFloat(computedStyle.fontSize);
  if (!Number.isFinite(baseFontSize)) {
    return;
  }

  element.dataset.baseFontSize = String(baseFontSize);
  element.style.fontSize = `${baseFontSize}px`;

  let nextFontSize = baseFontSize;
  while (
    nextFontSize > minimumFontSize &&
    (element.scrollWidth > element.clientWidth ||
      element.scrollHeight > element.clientHeight)
  ) {
    nextFontSize -= 0.5;
    element.style.fontSize = `${nextFontSize}px`;
  }
}

function scheduleFitText() {
  if (fitTextFrame !== null) {
    window.cancelAnimationFrame(fitTextFrame);
  }

  fitTextFrame = window.requestAnimationFrame(() => {
    fitTextFrame = null;
    document
      .querySelectorAll("[data-fit-text]")
      .forEach((element) => fitTextToBox(element));
  });
}

function humanLabel(themeSource, shouldUseDarkColors) {
  if (themeSource === "system") {
    return `System (${shouldUseDarkColors ? "Dark" : "Light"})`;
  }

  return `${themeSource.charAt(0).toUpperCase()}${themeSource.slice(1)}`;
}

function resolveShouldUseDarkColors(themeSource) {
  if (themeSource === "dark") {
    return true;
  }

  if (themeSource === "light") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function setHomeView(nextView) {
  activeHomeView =
    nextView === "settings"
      ? "settings"
      : nextView === "auth"
        ? "auth"
        : "dashboard";
  homeHeader.textContent =
    activeHomeView === "dashboard"
      ? "Home"
      : activeHomeView === "settings"
        ? "Settings"
        : "Sign In";
  homeDashboardView.hidden = activeHomeView !== "dashboard";
  homeSettingsView.hidden = activeHomeView !== "settings";
  homeAuthGateView.hidden = activeHomeView !== "auth";
  homeDashboardView.classList.toggle(
    "home-view-active",
    activeHomeView === "dashboard",
  );
  homeSettingsView.classList.toggle(
    "home-view-active",
    activeHomeView === "settings",
  );
  homeAuthGateView.classList.toggle("home-view-active", activeHomeView === "auth");
  if (activeHomeView !== "settings") {
    for (const controller of customSettingsDropdowns.values()) {
      controller.close();
    }
  }
  if (openSettingsButton) {
    const shouldGoHome = activeHomeView === "settings";
    openSettingsButton.setAttribute(
      "aria-label",
      shouldGoHome ? "Back to home" : "Open settings",
    );
    openSettingsButton.dataset.mode = shouldGoHome ? "home" : "settings";
    if (openSettingsIconPath) {
      openSettingsIconPath.setAttribute(
        "d",
        shouldGoHome ? HOME_ICON_PATH : SETTINGS_ICON_PATH,
      );
    }
  }
}

function initCustomSettingsDropdown(select) {
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }

  if (customSettingsDropdowns.has(select)) {
    return;
  }

  const wrap = select.closest(".settings-select-wrap");
  if (!(wrap instanceof HTMLElement)) {
    return;
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "settings-select-button";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "settings-select-menu";
  menu.hidden = true;

  const optionButtons = [];
  for (const option of Array.from(select.options)) {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "settings-select-option";
    optionButton.textContent = option.textContent || "";
    optionButton.dataset.value = option.value;
    optionButton.setAttribute("role", "option");
    optionButton.addEventListener("click", () => {
      setValue(option.value, true);
      close();
    });
    optionButtons.push(optionButton);
    menu.appendChild(optionButton);
  }

  function close() {
    wrap.dataset.open = "false";
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function open() {
    for (const controller of customSettingsDropdowns.values()) {
      controller.close();
    }
    wrap.dataset.open = "true";
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  }

  function setValue(nextValue, emitChange = false) {
    const nextOption = Array.from(select.options).find(
      (option) => option.value === nextValue,
    );
    if (!nextOption) {
      return;
    }

    const didChange = select.value !== nextOption.value;
    select.value = nextOption.value;
    trigger.textContent = nextOption.textContent || "";
    optionButtons.forEach((optionButton) => {
      optionButton.dataset.selected =
        optionButton.dataset.value === select.value ? "true" : "false";
    });

    if (emitChange && didChange) {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) {
      open();
    } else {
      close();
    }
  });

  wrap.dataset.open = "false";
  wrap.append(trigger, menu);
  select.hidden = true;
  select.tabIndex = -1;
  setValue(select.value);
  customSettingsDropdowns.set(select, { close, setValue });
}

function syncCustomSettingsDropdown(select) {
  const controller = customSettingsDropdowns.get(select);
  if (!controller) {
    return;
  }
  controller.setValue(select.value, false);
}

function applyPrivacySettings(settings) {
  privacySettings = settings;

  for (const button of privacyScreenshotButtons) {
    button.dataset.selected =
      button.dataset.screenshotPolicy === settings.screenshotPolicy
        ? "true"
        : "false";
  }

  for (const button of privacySyncButtons) {
    button.dataset.selected =
      button.dataset.syncConsent === settings.syncConsent ? "true" : "false";
  }

  privacyScreenshotStatus.textContent =
    screenshotPolicyLabels[settings.screenshotPolicy];
  privacySyncStatus.textContent = syncConsentLabels[settings.syncConsent];
  privacyLocalOnlyStatus.textContent =
    localOnlyLabels[String(Boolean(settings.localOnly))];
  if (privacyScreenshotSelect) {
    privacyScreenshotSelect.value = settings.screenshotPolicy;
    syncCustomSettingsDropdown(privacyScreenshotSelect);
  }
  if (privacySyncSelect) {
    privacySyncSelect.value = settings.syncConsent;
    syncCustomSettingsDropdown(privacySyncSelect);
  }
  if (privacyLocalOnlySelect) {
    privacyLocalOnlySelect.value = String(Boolean(settings.localOnly));
    syncCustomSettingsDropdown(privacyLocalOnlySelect);
  }
  settingsPrivacyStatus.textContent =
    settings.localOnly
      ? "Local-only mode is on. Screenshots and sync stay under local control."
      : settings.syncConsent === "denied"
      ? "Screenshots are controlled locally and sync consent is denied."
      : "Review screenshot and sync preferences carefully.";
}

function applyAuthSession(nextSession) {
  authSession =
    nextSession && typeof nextSession === "object" ? nextSession : null;
  const currentUser = authSession?.user ?? null;
  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.email || "User";
    const email = currentUser.email || "no-email";
    accountIdentityDisplay.textContent = `${displayName} (${email})`;
    accountAuthStatus.hidden = true;
    settingsPrivacyStatus.hidden = true;
    accountSignedOutPanel.hidden = true;
    accountSignedInPanel.hidden = false;
  } else {
    accountAuthStatus.textContent = "Not signed in.";
    accountAuthStatus.hidden = false;
    settingsPrivacyStatus.hidden = false;
    accountSignedOutPanel.hidden = false;
    accountSignedInPanel.hidden = true;
  }
  accountLogoutButton.disabled = !currentUser;
  privacyExportButton.disabled = !currentUser;
  privacyDeleteAccountButton.disabled = !currentUser;
  if (!currentUser) {
    setAuthGateStatus("Create an account or sign in to continue.", "neutral");
  }
}

function requireSignedIn(actionLabel) {
  if (authSession?.user) {
    return true;
  }
  postAuthHomeView = activeHomeView === "settings" ? "settings" : "dashboard";
  setHomeView("auth");
  setAuthGateStatus(`Sign in to ${actionLabel}.`, "danger");
  authGateEmailInput.focus();
  return false;
}

function setAuthGateButtonsDisabled(disabled) {
  authGateLoginButton.disabled = disabled;
  authGateRegisterButton.disabled = disabled;
}

function readAuthGateFormValues() {
  return {
    email: authGateEmailInput.value.trim(),
    password: authGatePasswordInput.value,
    displayName: authGateDisplayNameInput.value.trim(),
  };
}

function setAuthGateStatus(message, tone = "neutral") {
  authGateStatus.textContent = message;
  authGateStatus.dataset.tone = tone;
}

async function submitAuthGateRequest(mode) {
  const { email, password, displayName } = readAuthGateFormValues();
  setAuthGateButtonsDisabled(true);
  setAuthGateStatus(
    mode === "register" ? "Creating account..." : "Signing in...",
    "neutral",
  );

  try {
    const session =
      mode === "register"
        ? await window.overlayApi.registerAccount({
            email,
            password,
            displayName,
          })
        : await window.overlayApi.loginAccount({ email, password });
    applyAuthSession(session);
    authGatePasswordInput.value = "";
    setAuthGateStatus(
      mode === "register" ? "Account created and signed in." : "Signed in.",
      "success",
    );
    setHomeView(postAuthHomeView);
  } catch (error) {
    setAuthGateStatus(
      error instanceof Error ? error.message : "Authentication failed.",
      "danger",
    );
  } finally {
    setAuthGateButtonsDisabled(false);
  }
}

function setPrivacyAccountStatus(message, tone = "neutral") {
  privacyAccountStatus.textContent = message;
  privacyAccountStatus.dataset.tone = tone;
}

function triggerJsonDownload(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function applyPreferenceSelections(preferences) {
  const { discoverySource, customerProfile } = preferences;

  for (const button of settingsSourceButtons) {
    button.dataset.selected =
      button.dataset.homeSource === discoverySource ? "true" : "false";
  }

  for (const button of settingsProfileButtons) {
    button.dataset.selected =
      button.dataset.homeProfile === customerProfile ? "true" : "false";
  }

  settingsSourceStatus.textContent = discoverySource
    ? `Current source: ${sourceLabels[discoverySource]}`
    : "No source selected yet.";
  settingsProfileStatus.textContent = customerProfile
    ? `Current profile: ${profileLabels[customerProfile]}`
    : "Pick the closest fit.";
  if (settingsSourceSelect) {
    settingsSourceSelect.value = discoverySource || "";
    syncCustomSettingsDropdown(settingsSourceSelect);
  }
  if (settingsProfileSelect) {
    settingsProfileSelect.value = customerProfile || "";
    syncCustomSettingsDropdown(settingsProfileSelect);
  }
}

function normalizeFolders(source) {
  function normalizeChildren(children, depth) {
    if (!Array.isArray(children)) {
      return [];
    }

    const allowedContainerType =
      depth === 1 ? "unit" : depth === 2 ? "lesson" : null;

    return children
      .filter((child) => {
        if (!child || typeof child !== "object") {
          return false;
        }

        if (child.type === "session" || child.type === "quiz") {
          return true;
        }

        return Boolean(
          allowedContainerType && child.type === allowedContainerType,
        );
      })
      .map((child) => ({
        ...child,
        children: isContainerType(child.type)
          ? normalizeChildren(child.children, depth + 1)
          : [],
      }));
  }

  return Array.isArray(source)
    ? source
        .filter((item) => item?.type === "class")
        .map((item) => ({
          ...item,
          testFormat:
            typeof item.testFormat === "string" ? item.testFormat.trim() : "",
          testExamples: normalizeTestExamples(item.testExamples),
          children: normalizeChildren(item.children, 1),
        }))
    : [];
}

function getFolderAtPath(path) {
  let current = { children: folders };

  for (const segment of path) {
    const next = (current.children || []).find((item) => item.id === segment);
    if (!next) {
      return null;
    }
    current = next;
  }

  return current;
}

function getCurrentChildren() {
  const current = getFolderAtPath(currentPath);
  return current ? current.children || [] : folders;
}

function getCurrentClassSessions() {
  return getCurrentChildren().filter((item) => item?.type === "session");
}

function getCurrentClassItems() {
  return getCurrentChildren();
}

function isInsideClass() {
  return currentPath.length > 0;
}

function replaceChildrenAtPath(path, nextChildren, source = folders) {
  if (path.length === 0) {
    return nextChildren;
  }

  const [head, ...rest] = path;
  return source.map((item) => {
    if (item.id !== head) {
      return item;
    }

    if (rest.length === 0) {
      return {
        ...item,
        children: nextChildren,
      };
    }

    return {
      ...item,
      children: replaceChildrenAtPath(rest, nextChildren, item.children || []),
    };
  });
}

function updateFolderAtPath(path, transform, source = folders) {
  if (!Array.isArray(path) || path.length === 0) {
    return source;
  }

  const [head, ...rest] = path;
  return source.map((item) => {
    if (item.id !== head) {
      return item;
    }

    if (rest.length === 0) {
      return transform(item);
    }

    return {
      ...item,
      children: updateFolderAtPath(rest, transform, item.children || []),
    };
  });
}

async function persistFolders(nextFolders) {
  folders = await window.overlayApi.updateClassFolders(nextFolders);
  renderFolders();
}

function normalizeTestExamples(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(/\r?\n+/);

  return source
    .map((entry) =>
      String(entry || "")
        .trim()
        .replace(/^[-*•\d.)\s]+/, ""),
    )
    .filter(Boolean)
    .slice(0, 8);
}

function formatTestExamplesForField(value) {
  return normalizeTestExamples(value).join("\n");
}

function buildBackendClassPayload(values) {
  const noteParts = [
    values.description ? `Description: ${values.description}` : null,
    values.additionalNotes
      ? `Additional notes: ${values.additionalNotes}`
      : null,
    values.hierarchyNotes ? values.hierarchyNotes : null,
  ].filter(Boolean);
  const teacherFocusParts = [
    values.teacherName ? `Teacher: ${values.teacherName}` : null,
    values.teacherNotes ? `Focus: ${values.teacherNotes}` : null,
  ].filter(Boolean);

  return {
    id:
      Number.isFinite(values.dbClassId) && values.dbClassId > 0
        ? values.dbClassId
        : undefined,
    className: values.course,
    subject: values.course,
    currentUnit: values.currentUnit || null,
    teacherFocus:
      teacherFocusParts.length > 0 ? teacherFocusParts.join(" | ") : null,
    testFormat: values.testFormat || null,
    testExamples: normalizeTestExamples(values.testExamples),
    keyConcepts: [],
    notes: noteParts.length > 0 ? noteParts.join("\n") : null,
  };
}

async function ensureBackendClassId(classFolder) {
  if (!classFolder) {
    throw new Error("No class folder selected.");
  }

  if (classFolder.dbClassId) {
    return classFolder.dbClassId;
  }

  const result = await window.overlayApi.saveClassProfile(
    buildBackendClassPayload({
      course: classFolder.name,
      dbClassId: classFolder.dbClassId,
      teacherName: classFolder.teacherName || "",
      description: classFolder.description || "",
      teacherNotes: classFolder.teacherNotes || "",
      testFormat: classFolder.testFormat || "",
      testExamples: classFolder.testExamples || [],
      additionalNotes: classFolder.additionalNotes || "",
      currentUnit: buildCurrentUnitPathLabel(),
      hierarchyNotes: buildHierarchyContextNotes(),
    }),
  );

  const classPath = [classFolder.id];
  const nextFolders = updateFolderAtPath(classPath, (item) => ({
    ...item,
    dbClassId: result.classProfile.id,
  }));
  await persistFolders(nextFolders);

  return result.classProfile.id;
}

function getSearchQuery() {
  return folderNameInput.value.trim().toLowerCase();
}

function formatSessionDate(value) {
  if (!value) {
    return "Unknown time";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildSessionCardSentence(session) {
  const summarySentence =
    typeof session.summary === "string" && session.summary.trim()
      ? session.summary.trim().split(/(?<=[.!?])\s+/)[0]
      : `${session.name || "Saved study session"}.`;
  return summarySentence.trim();
}

function buildSessionCardStats(session) {
  const requestCount = Number.isFinite(session.requestCount)
    ? session.requestCount
    : 0;
  return `${requestCount} request${requestCount === 1 ? "" : "s"} • ${formatSessionDate(session.endedAt)}`;
}

function normalizeExtractedFileText(rawText) {
  return rawText
    .replace(/\u0000/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractReadableSegments(rawText) {
  const segments = rawText.match(/[A-Za-z0-9][A-Za-z0-9 ,.:;'"()/%&!?+\-]{5,}/g);
  if (!segments) {
    return "";
  }

  return segments.slice(0, 400).join("\n");
}

async function extractStudyMaterialFromFiles(files, mode) {
  const payloadFiles = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );

  return window.overlayApi.extractStudyMaterial({
    mode,
    files: payloadFiles,
  });
}

function getCombinedUploadedCramMaterial() {
  return uploadedCramMaterials
    .map(({ name, content }) => `--- ${name} ---\n${content}`)
    .join("\n\n");
}

function getCombinedCramMaterialInput() {
  return [getCombinedUploadedCramMaterial().trim(), cramMaterialText.value.trim()]
    .filter(Boolean)
    .join("\n\n");
}

function getCramUploadSummaryText() {
  if (uploadedCramMaterials.length === 0) {
    return "No files selected";
  }

  if (uploadedCramMaterials.length === 1) {
    const file = uploadedCramMaterials[0];
    return file.handler ? `${file.name} (${file.handler})` : file.name;
  }

  return `${uploadedCramMaterials.length} files selected`;
}

function renderCramUploadRollup() {
  if (!cramUploadRollup) {
    return;
  }

  if (uploadedCramMaterials.length === 0) {
    cramUploadRollup.hidden = true;
    cramUploadRollup.replaceChildren();
    return;
  }

  cramUploadRollup.hidden = false;
  cramUploadRollup.replaceChildren();

  uploadedCramMaterials.slice(0, 4).forEach((file) => {
    const chip = document.createElement("span");
    chip.className = "cram-upload-rollup-chip";
    chip.textContent = file.handler
      ? `${file.name} • ${file.handler}`
      : file.name;
    cramUploadRollup.appendChild(chip);
  });

  if (uploadedCramMaterials.length > 4) {
    const moreChip = document.createElement("span");
    moreChip.className = "cram-upload-rollup-chip cram-upload-rollup-chip-muted";
    moreChip.textContent = `+${uploadedCramMaterials.length - 4} more`;
    cramUploadRollup.appendChild(moreChip);
  }
}

function getFirstSentence(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    .trim();
}

function renderCramTimelineCopy(plan) {
  const firstFocus = plan.studyFirst?.[0] || "Start with the first study move.";
  const secondFocus = plan.studyNext?.[0] || "Move to the next supporting concept.";
  const skipFocus = plan.skipIfNeeded?.[0] || "Trim lower-value material if time gets tight.";
  const firstQuestion = plan.likelyQuestions?.[0] || "Rehearse a likely exam-style question.";
  const firstSelfTest = plan.quickSelfTest?.[0] || "Check what you can answer from memory.";
  const firstRunwayStep = plan.timePlan?.[0] || "Take the first timeline step.";
  const secondRunwayStep = plan.timePlan?.[1] || "Then move to the next block.";

  cramNowFocus.textContent = getFirstSentence(firstFocus) || "Start here.";
  cramSideklickTip.textContent = `${getFirstSentence(firstRunwayStep)} Next: ${getFirstSentence(secondRunwayStep) || "next block."}`;
  cramRunwaySummary.textContent = `${plan.timePlan.length} step${plan.timePlan.length === 1 ? "" : "s"} tonight.`;
  cramStepNow.textContent = getFirstSentence(firstRunwayStep) || "First move.";
  cramStepNext.textContent = getFirstSentence(secondFocus) || "Next priority.";
  cramStepSkip.textContent = getFirstSentence(skipFocus) || "Drop this first.";
  cramStepQuestions.textContent = getFirstSentence(firstQuestion) || "Rehearse these.";
  cramStepTest.textContent = getFirstSentence(firstSelfTest) || "Answer from memory.";
  cramGuideGuardrail.textContent = `${getFirstSentence(firstFocus)} Back here if you drift.`;
  cramGuideRecovery.textContent = `${getFirstSentence(firstSelfTest)} Missed it? Retry that step.`;
}

function openSessionSummary(session) {
  if (!requireSignedIn("view saved sessions")) {
    return;
  }
  sessionSummaryTitle.textContent = session.name || "Session Summary";
  sessionSummaryMeta.textContent = `${Number.isFinite(session.requestCount) ? session.requestCount : 0} request${session.requestCount === 1 ? "" : "s"} • Ended ${formatSessionDate(session.endedAt)}${Array.isArray(session.keyTopics) && session.keyTopics.length > 0 ? ` • ${session.keyTopics.slice(0, 3).join(", ")}` : ""}`;
  sessionSummaryText.textContent =
    typeof session.summary === "string" && session.summary.trim()
      ? session.summary.trim()
      : "No summary was saved for this session.";
  sessionSummaryBackdrop.hidden = false;
}

function closeSessionSummary() {
  sessionSummaryBackdrop.hidden = true;
}

function resetQuizModalState() {
  activeQuiz = null;
  uploadedQuizMaterial = "";
  uploadedQuizMaterialSummary = "";
  quizHasBeenChecked = false;
  quizSetupView.hidden = false;
  quizView.hidden = true;
  quizQuestions.replaceChildren();
  quizSubtitle.textContent = "";
  quizMaterialText.value = "";
  quizMaterialFile.value = "";
  quizFileName.textContent = "No file selected";
  quizSourceSummary.checked = true;
  quizSourceNotes.checked = false;
  quizSourceTopics.checked = true;
  quizSourceUploaded.checked = false;
  quizGapFocus.value = "50";
  quizGapFocusValue.textContent = "50%";
  quizSubmitButton.textContent = "Check Answers";
  quizSubmitButton.disabled = false;
  saveQuizButton.hidden = true;
  quizExplanationPanel.hidden = true;
  quizExplanationTitle.textContent = "Pick a question";
  quizExplanationAnswer.textContent = "";
  quizExplanationText.textContent = "";
  quizInsights.hidden = true;
  quizStrengths.textContent = "";
  quizGaps.textContent = "";
  quizQuestions.parentElement?.classList.remove("has-explanation");
  if (quizExplainHint) {
    quizExplainHint.textContent =
      "Answer explanations unlock after you check answers.";
  }
}

function summarizeQuestionTopic(question) {
  const source = String(question?.prompt || "").trim();
  if (!source) {
    return "recent material";
  }

  const cleaned = source
    .replace(/^\d+[\).\s-]*/, "")
    .replace(/^(which|what|when|why|how|where)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();

  const words = cleaned.split(/\s+/).slice(0, 8);
  return words.join(" ");
}

function joinTopics(topics) {
  if (topics.length === 0) {
    return "";
  }
  if (topics.length === 1) {
    return topics[0];
  }
  if (topics.length === 2) {
    return `${topics[0]} and ${topics[1]}`;
  }
  return `${topics.slice(0, -1).join(", ")}, and ${topics[topics.length - 1]}`;
}

function buildQuizInsights(correctTopics, gapTopics, unansweredTopics) {
  const strengths =
    correctTopics.length > 0
      ? `You showed strength on ${joinTopics(correctTopics.slice(0, 3))}.`
      : "No clear strengths yet because nothing was answered correctly.";

  const gapParts = [];
  if (gapTopics.length > 0) {
    gapParts.push(`Review ${joinTopics(gapTopics.slice(0, 3))}`);
  }
  if (unansweredTopics.length > 0) {
    gapParts.push(`come back to ${joinTopics(unansweredTopics.slice(0, 2))}`);
  }

  const gaps =
    gapParts.length > 0
      ? `${gapParts.join(", and ")}.`
      : "No major gaps showed up in this round.";

  return { strengths, gaps };
}

function renderQuizSessionPicker(sessions) {
  quizSessionPicker.replaceChildren();

  if (sessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quiz-picker-empty";
    empty.textContent =
      "No saved sessions selected. The quiz will use class context and any uploaded material.";
    quizSessionPicker.appendChild(empty);
    return;
  }

  sessions.forEach((session) => {
    const label = document.createElement("label");
    label.className = "quiz-session-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(session.dbSessionId);

    const textWrap = document.createElement("div");
    textWrap.className = "quiz-session-option-copy";

    const title = document.createElement("span");
    title.className = "quiz-session-option-title";
    title.textContent = session.name || "Saved Session";

    const meta = document.createElement("span");
    meta.className = "quiz-session-option-meta";
    meta.textContent = buildSessionCardStats(session);

    textWrap.append(title, meta);
    label.append(input, textWrap);
    quizSessionPicker.appendChild(label);
  });
}

function openQuizModalForCurrentClass() {
  if (!requireSignedIn("start a quiz")) {
    return;
  }
  const currentClassFolder = getCurrentClassFolder();
  if (!currentClassFolder || currentClassFolder.type !== "class") {
    return;
  }

  activeQuizClassFolder = currentClassFolder;
  resetQuizModalState();
  quizModalTitle.textContent = `Quiz: ${currentClassFolder.name || "Class"}`;
  quizSessionMeta.textContent =
    "Pick any saved sessions from this view, or leave them unchecked to build from broader class context.";
  renderQuizSessionPicker(getCurrentClassSessions());
  quizBackdrop.hidden = false;
}

function closeQuizModal() {
  quizBackdrop.hidden = true;
  activeQuizClassFolder = null;
  activeQuiz = null;
  quizHasBeenChecked = false;
  quizQuestions.parentElement?.classList.remove("has-explanation");
}

function updateCramMaterialCount() {
  const pastedLength = cramMaterialText?.value.trim().length || 0;
  const uploadedLength = uploadedCramMaterials.reduce(
    (total, file) => total + file.content.length,
    0,
  );
  const combinedLength = pastedLength + uploadedLength;
  const approxTokens = Math.ceil(combinedLength / 4);
  const hasUploadedMaterial = uploadedCramMaterials.length > 0;
  const hasUploadError = Boolean(cramMaterialUploadError);
  const overLimit = combinedLength > cramConstraintsConfig.maxMaterialCharacters;

  cramMaterialCount.textContent = `Approx ${approxTokens.toLocaleString()} tokens loaded`;
  cramMaterialStatus.textContent = hasUploadError
      ? cramMaterialUploadError
      : overLimit
        ? `Too much material loaded for one pass. Keep it under ${cramConstraintsConfig.maxMaterialCharacters.toLocaleString()} characters by trimming to the most testable notes.`
      : cramMaterialUploadSummary
        ? cramMaterialUploadSummary
      : hasUploadedMaterial
        ? `Using ${uploadedCramMaterials.length} uploaded file${uploadedCramMaterials.length === 1 ? "" : "s"} together with any pasted material.`
        : "Paste or upload material.";
  cramMaterialStatus.dataset.tone =
    hasUploadError || overLimit ? "danger" : "neutral";
  generateCramButton.disabled = isGeneratingCramPlan;

  return {
    approxTokens,
  };
}

function resetCramModalState() {
  activeCramPlan = null;
  uploadedCramMaterials = [];
  cramMaterialUploadError = "";
  cramMaterialUploadSummary = "";
  renderCramUploadRollup();
  cramSetupView.hidden = false;
  cramView.hidden = true;
  cramExamNameInput.value = "";
  cramTimeAvailableSelect.value = "1 hour";
  cramMaterialFile.value = "";
  cramFileName.textContent = "No files selected";
  cramMaterialText.value = "";
  cramAdditionalNotes.value = "";
  cramSubtitle.textContent = "";
  cramNowFocus.textContent = "Start here.";
  cramSideklickTip.textContent =
    "Tight plan. Finishable tonight.";
  cramRunwaySummary.textContent = "One step at a time.";
  cramStepNow.textContent = "Lock in the highest-yield idea first.";
  cramStepNext.textContent = "Next priority.";
  cramStepSkip.textContent = "Drop this first.";
  cramStepQuestions.textContent = "Rehearse these.";
  cramStepTest.textContent = "Answer from memory.";
  cramGuideGuardrail.textContent =
    "Return to step one if you drift.";
  cramGuideRecovery.textContent =
    "Missed it? Retry the matching step.";
  cramStudyFirst.replaceChildren();
  cramStudyNext.replaceChildren();
  cramSkipList.replaceChildren();
  cramTimePlan.replaceChildren();
  cramLikelyQuestions.replaceChildren();
  cramQuickSelfTest.replaceChildren();
  isGeneratingCramPlan = false;
  generateCramButton.disabled = false;
  generateCramButton.textContent = "Build My Study Plan";
  updateCramMaterialCount();
}

function closeCramModal() {
  cramBackdrop.hidden = true;
  activeCramPlan = null;
}

function openCramModalForCurrentClass() {
  if (!requireSignedIn("start Cram Mode")) {
    return;
  }

  const currentClassFolder = getCurrentClassFolder();
  if (!currentClassFolder || currentClassFolder.type !== "class") {
    return;
  }

  resetCramModalState();
  const unitPathLabel = buildCurrentUnitPathLabel();
  cramSessionMeta.textContent = unitPathLabel
    ? `${currentClassFolder.name || "Class"} • ${unitPathLabel}`
    : `${currentClassFolder.name || "Class"} • Exam rescue mode`;
  cramBackdrop.hidden = false;
  cramExamNameInput.focus();
}

function renderCramList(container, items) {
  container.replaceChildren();

  items.forEach((item) => {
    const entry = document.createElement("li");
    entry.className = "cram-list-item";
    entry.textContent = item;
    container.appendChild(entry);
  });
}

async function generateCramPlan() {
  if (!requireSignedIn("build a cram plan")) {
    return;
  }

  const currentClassFolder = getCurrentClassFolder();
  if (!currentClassFolder) {
    return;
  }

  const examName = cramExamNameInput.value.trim();
  const material = getCombinedCramMaterialInput();
  updateCramMaterialCount();
  if (!examName) {
    cramExamNameInput.focus();
    return;
  }
  const materialValidation = validateCramMaterialPayload(material);
  if (!materialValidation.ok) {
    cramMaterialStatus.dataset.tone = "danger";
    cramMaterialStatus.textContent = materialValidation.message;
    cramMaterialText.focus();
    return;
  }

  isGeneratingCramPlan = true;
  generateCramButton.disabled = true;
  generateCramButton.textContent = "Building plan...";

  try {
    const classId = await ensureBackendClassId(currentClassFolder);
    activeCramPlan = await window.overlayApi.generateCramPlan({
      classId,
      courseName: currentClassFolder.name,
      unitPathLabel: buildCurrentUnitPathLabel(),
      examName,
      timeAvailable: cramTimeAvailableSelect.value,
      examMaterial: materialValidation.normalizedMaterial,
      additionalNotes: cramAdditionalNotes.value.trim() || null,
    });

    cramSubtitle.textContent = activeCramPlan.subtitle;
    renderCramList(cramStudyFirst, activeCramPlan.studyFirst);
    renderCramList(cramStudyNext, activeCramPlan.studyNext);
    renderCramList(cramSkipList, activeCramPlan.skipIfNeeded);
    renderCramList(cramTimePlan, activeCramPlan.timePlan);
    renderCramList(cramLikelyQuestions, activeCramPlan.likelyQuestions);
    renderCramList(cramQuickSelfTest, activeCramPlan.quickSelfTest);
    renderCramTimelineCopy(activeCramPlan);

    cramSetupView.hidden = true;
    cramView.hidden = false;
  } catch (error) {
    cramMaterialStatus.dataset.tone = "danger";
    cramMaterialStatus.textContent =
      error instanceof Error
        ? error.message
        : "Could not build a cram plan right now.";
  } finally {
    isGeneratingCramPlan = false;
    generateCramButton.disabled = false;
    generateCramButton.textContent = "Build My Study Plan";
    updateCramMaterialCount();
  }
}

function showQuizExplanation(question, index) {
  if (!question || !quizHasBeenChecked) {
    return;
  }

  quizExplanationPanel.hidden = false;
  quizQuestions.parentElement?.classList.add("has-explanation");
  quizExplanationTitle.textContent = `Question ${index + 1}`;
  quizExplanationAnswer.textContent = `Correct answer: ${question.options[question.correctIndex]}`;
  quizExplanationText.textContent = question.explanation;
}

function loadQuizIntoView(quiz, options = {}) {
  activeQuiz = quiz;
  quizHasBeenChecked = false;
  quizSubtitle.textContent = quiz.subtitle;
  renderQuizQuestions(quiz);
  quizSetupView.hidden = true;
  quizView.hidden = false;
  quizSubmitButton.disabled = Boolean(options.readOnly);
  quizSubmitButton.hidden = Boolean(options.readOnly);
  saveQuizButton.hidden = Boolean(options.hideSave);
  quizExplanationPanel.hidden = true;
  quizQuestions.parentElement?.classList.remove("has-explanation");
}

function updateExplainButtons() {
  quizQuestions.querySelectorAll(".quiz-explain-button").forEach((button) => {
    button.disabled = !quizHasBeenChecked;
    button.classList.toggle("is-locked", !quizHasBeenChecked);
  });
}

function openSavedQuiz(quizItem) {
  if (!requireSignedIn("open saved quizzes")) {
    return;
  }
  activeQuizClassFolder = getCurrentClassFolder();
  resetQuizModalState();
  quizModalTitle.textContent = quizItem.name || "Saved Quiz";
  quizSessionMeta.textContent = `${quizItem.questionCount || 0} questions • Saved ${formatSessionDate(quizItem.createdAt)}`;
  loadQuizIntoView(quizItem.quizData, {
    readOnly: false,
    hideSave: true,
  });
  quizBackdrop.hidden = false;
}

async function saveActiveQuizToExplorer() {
  if (!requireSignedIn("save quizzes")) {
    return;
  }
  if (!activeQuiz || !activeQuizClassFolder) {
    return;
  }

  const nextQuizEntry = {
    id: makeId(),
    type: "quiz",
    name: activeQuiz.title || "Saved Quiz",
    createdAt: new Date().toISOString(),
    questionCount: activeQuiz.questions.length,
    summary: activeQuiz.subtitle,
    quizData: activeQuiz,
  };

  const nextChildren = [nextQuizEntry, ...getCurrentClassItems()];
  const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
  await persistFolders(nextFolders);
  saveQuizButton.hidden = true;
}

function renderQuizQuestions(quiz) {
  quizQuestions.replaceChildren();

  quiz.questions.forEach((question, index) => {
    const article = document.createElement("article");
    article.className = "quiz-question-card";
    article.dataset.questionIndex = String(index);

    const header = document.createElement("div");
    header.className = "quiz-question-header";

    const statusDot = document.createElement("span");
    statusDot.className = "quiz-question-status";
    statusDot.setAttribute("aria-hidden", "true");

    const prompt = document.createElement("h3");
    prompt.className = "quiz-question-title";
    prompt.textContent = `${index + 1}. ${question.prompt}`;

    const explainButton = document.createElement("button");
    explainButton.type = "button";
    explainButton.className = "ghost-button quiz-explain-button";
    explainButton.textContent = "Explain Answer";
    explainButton.disabled = true;
    explainButton.classList.add("is-locked");
    explainButton.addEventListener("click", () => {
      showQuizExplanation(question, index);
    });

    header.append(statusDot, prompt, explainButton);

    const options = document.createElement("div");
    options.className = "quiz-option-list";

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "quiz-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `quiz-question-${index}`;
      input.value = String(optionIndex);

      const text = document.createElement("span");
      text.textContent = option;

      label.append(input, text);
      options.appendChild(label);
    });

    const feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.hidden = true;

    article.append(header, options, feedback);
    quizQuestions.appendChild(article);
  });

  updateExplainButtons();
}

async function generateQuizForActiveSession() {
  if (!requireSignedIn("generate quizzes")) {
    return;
  }
  if (!activeQuizClassFolder) {
    return;
  }

  const pastedMaterial = quizMaterialText.value.trim();
  const uploadedMaterial = [uploadedQuizMaterial, pastedMaterial]
    .filter(Boolean)
    .join("\n\n");
  const classId = await ensureBackendClassId(activeQuizClassFolder);
  const selectedSessionIds = Array.from(
    quizSessionPicker.querySelectorAll('input[type="checkbox"]:checked'),
  )
    .map((input) => Number(input.value))
    .filter((value) => Number.isFinite(value));

  const payload = {
    classId,
    sessionIds: selectedSessionIds,
    includeSessionSummary: quizSourceSummary.checked,
    includeSessionNotes: quizSourceNotes.checked,
    includeKeyTopics: quizSourceTopics.checked,
    includeUploadedMaterial: quizSourceUploaded.checked,
    uploadedMaterial: uploadedMaterial || null,
    gapFocus: Number(quizGapFocus.value),
  };

  generateQuizButton.disabled = true;
  generateQuizButton.textContent = "Generating...";

  try {
    const quiz = await window.overlayApi.generateQuiz(payload);
    loadQuizIntoView(quiz, {
      readOnly: false,
      hideSave: false,
    });
  } finally {
    generateQuizButton.disabled = false;
    generateQuizButton.textContent = "Generate Quiz";
  }
}

function gradeQuiz() {
  if (!activeQuiz) {
    return;
  }

  let correctCount = 0;
  const correctTopics = [];
  const gapTopics = [];
  const unansweredTopics = [];

  quizQuestions
    .querySelectorAll(".quiz-question-card")
    .forEach((card, index) => {
      const question = activeQuiz.questions[index];
      const selected = card.querySelector(
        `input[name="quiz-question-${index}"]:checked`,
      );
      const feedback = card.querySelector(".quiz-feedback");
      const statusDot = card.querySelector(".quiz-question-status");
      const selectedIndex = selected ? Number(selected.value) : -1;
      const topic = summarizeQuestionTopic(question);

      card
        .querySelectorAll(".quiz-option")
        .forEach((optionNode, optionIndex) => {
          optionNode.classList.toggle(
            "correct",
            optionIndex === question.correctIndex,
          );
          optionNode.classList.toggle(
            "incorrect",
            selectedIndex === optionIndex &&
              optionIndex !== question.correctIndex,
          );
        });

      if (selectedIndex === question.correctIndex) {
        correctCount += 1;
        correctTopics.push(topic);
        card.dataset.result = "correct";
      } else if (selectedIndex === -1) {
        unansweredTopics.push(topic);
        card.dataset.result = "unanswered";
      } else {
        gapTopics.push(topic);
        card.dataset.result = "incorrect";
      }

      feedback.hidden = false;
      feedback.textContent =
        selectedIndex === question.correctIndex
          ? "Correct."
          : `Correct answer: ${question.options[question.correctIndex]}`;
      if (statusDot) {
        statusDot.dataset.result = card.dataset.result;
        statusDot.title = card.dataset.result;
      }
    });

  const insights = buildQuizInsights(
    correctTopics,
    gapTopics,
    unansweredTopics,
  );
  quizHasBeenChecked = true;
  updateExplainButtons();
  quizSubtitle.textContent = `${activeQuiz.subtitle} • Score: ${correctCount}/${activeQuiz.questions.length}`;
  quizInsights.hidden = false;
  quizStrengths.textContent = insights.strengths;
  quizGaps.textContent = insights.gaps;
  quizSubmitButton.disabled = true;
  if (quizExplainHint) {
    quizExplainHint.textContent =
      "Pick any question to open the full answer explanation.";
  }
}

function renderBreadcrumbs() {
  const trail = [{ label: "Home", path: [] }];
  let currentChildren = folders;
  const runningPath = [];

  for (const segment of currentPath) {
    const node = currentChildren.find((item) => item.id === segment);
    if (!node) {
      break;
    }

    runningPath.push(segment);
    trail.push({
      label: node.name,
      path: [...runningPath],
    });
    currentChildren = node.children || [];
  }

  breadcrumbs.replaceChildren();

  trail.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "breadcrumb-button";
    button.textContent = entry.label;
    button.addEventListener("click", () => {
      currentPath = [...entry.path];
      renderFolders();
    });
    breadcrumbs.appendChild(button);

    if (index < trail.length - 1) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      breadcrumbs.appendChild(separator);
    }
  });
}

function renderFolders() {
  const searchQuery = getSearchQuery();
  const currentChildren = getCurrentChildren();
  const currentClassFolder = getCurrentClassFolder();
  const filteredChildren = currentChildren;
  const visibleChildren = searchQuery
    ? filteredChildren.filter((item) =>
        item.name.toLowerCase().includes(searchQuery),
      )
    : filteredChildren;
  folderGrid.replaceChildren();
  renderBreadcrumbs();
  backFolderButton.hidden = currentPath.length === 0;
  emptyState.hidden = visibleChildren.length > 0;
  editCurrentClassButton.hidden = !currentClassFolder;
  editCurrentClassButton.textContent = currentClassFolder
    ? `Edit ${currentClassFolder.name || "Class"}`
    : "Edit Class";
  closeFolderActionMenu();
  if (currentPath.length === 0) {
    folderNameInput.placeholder = "Search classes";
    emptyTitle.textContent = "No classes here yet.";
    emptyCopy.textContent =
      "Create a class folder to start organizing courses, notes, and study context.";
  } else {
    const currentType = getCurrentContainerType();
    folderNameInput.placeholder =
      currentType === "class"
        ? "Search units, lessons, sessions, cram plans, or quizzes"
        : "Search lessons, sessions, cram plans, or quizzes";
    emptyTitle.textContent =
      currentType === "class"
        ? "Nothing in this class yet."
        : currentType === "unit"
          ? "Nothing in this unit yet."
          : "Nothing in this lesson yet.";
    emptyCopy.textContent =
      currentType === "class"
        ? "Add a unit, start a session, open Cram Mode, or build a quiz from this class."
        : currentType === "unit"
          ? "Add a lesson, start a session, open Cram Mode, or build a quiz inside this unit."
          : "Start a session, open Cram Mode, or build a quiz inside this lesson.";
  }

  for (const folder of visibleChildren) {
    const article = document.createElement("article");
    article.className = "folder-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "folder-open-button";
    const isSessionItem = folder.type === "session";
    const isQuizItem = folder.type === "quiz";
    const isClassItem = folder.type === "class";
    const metaText = !isSessionItem
      ? isQuizItem
        ? `${folder.questionCount || 0} questions • ${formatSessionDate(folder.createdAt)}`
        : [
            `${(folder.children || []).length} item${(folder.children || []).length === 1 ? "" : "s"}`,
            isClassItem && folder.testFormat ? folder.testFormat : null,
          ]
            .filter(Boolean)
            .join(" • ")
      : "";
    const sessionSummaryText = isSessionItem
      ? buildSessionCardSentence(folder)
      : isQuizItem
        ? typeof folder.summary === "string" && folder.summary.trim()
          ? folder.summary.trim()
          : "Saved quiz"
        : "";
    const sessionStatsText = isSessionItem ? buildSessionCardStats(folder) : "";

    openButton.innerHTML = `
      <span class="folder-card-icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24">
          ${
            isSessionItem
              ? '<path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5"></path>'
              : isQuizItem
                ? '<path d="M9 2h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 6H7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v2h-2V8h-4v2H9V8zm2-4v2h4V4h-4z"></path>'
                : '<path d="M10 4 12 6h8c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h6z"></path>'
          }
        </svg>
      </span>
      <span class="folder-card-title">${folder.name}</span>
      ${
        isSessionItem || isQuizItem
          ? `<span class="folder-card-summary">${sessionSummaryText}</span>
      <span class="folder-card-session-stats">${isSessionItem ? sessionStatsText : metaText}</span>`
          : `<span class="folder-card-meta">${metaText}</span>`
      }
    `;
    const titleNode = openButton.querySelector(".folder-card-title");
    const metaNode = openButton.querySelector(".folder-card-meta");
    const summaryNode = openButton.querySelector(".folder-card-summary");
    const statsNode = openButton.querySelector(".folder-card-session-stats");
    if (titleNode instanceof HTMLElement) {
      titleNode.dataset.fitText = "true";
    }
    if (metaNode instanceof HTMLElement) {
      if (!isSessionItem) {
        metaNode.dataset.fitText = "true";
      }
    }
    if (summaryNode instanceof HTMLElement) {
      summaryNode.title = sessionSummaryText;
    }
    if (statsNode instanceof HTMLElement) {
      statsNode.dataset.fitText = "true";
    }
    if (isSessionItem) {
      openButton.addEventListener("click", () => {
        openSessionSummary(folder);
      });
    } else if (isQuizItem) {
      openButton.addEventListener("click", () => {
        openSavedQuiz(folder);
      });
    } else {
      openButton.addEventListener("click", () => {
        if (!requireSignedIn("open folders")) {
          return;
        }
        currentPath = [...currentPath, folder.id];
        renderFolders();
      });
    }

    const actionButtons = document.createElement("div");
    actionButtons.className = "folder-card-actions";

    if (isClassItem) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "folder-edit-button";
      editButton.setAttribute("aria-label", `Edit ${folder.name}`);
      editButton.innerHTML = `
        <svg class="icon-svg" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-2.13z"></path>
        </svg>
      `;
      editButton.addEventListener("click", () => {
        openClassEditModal([folder.id]);
      });
      actionButtons.appendChild(editButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "folder-delete-button";
    deleteButton.setAttribute("aria-label", `Delete ${folder.name}`);
    deleteButton.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M16 9v10H8V9h8m-1.5-6H9.5l-1 1H5v2h14V4h-3.5l-1-1z"></path>
      </svg>
    `;
    deleteButton.addEventListener("click", async () => {
      if (!requireSignedIn("delete content")) {
        return;
      }
      const nextChildren = getCurrentChildren().filter(
        (item) => item.id !== folder.id,
      );
      const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
      await persistFolders(nextFolders);
    });

    actionButtons.appendChild(deleteButton);
    article.append(openButton, actionButtons);
    folderGrid.appendChild(article);
  }

  scheduleFitText();
}

function populateClassModalFields(values = {}) {
  classCourseInput.value = values.course || "";
  classTeacherInput.value = values.teacherName || "";
  classDescriptionInput.value = values.description || "";
  classTeacherNotesInput.value = values.teacherNotes || "";
  classTestFormatInput.value = values.testFormat || "";
  classTestExamplesInput.value = formatTestExamplesForField(
    values.testExamples || [],
  );
  classAdditionalNotesInput.value = values.additionalNotes || "";
}

function openClassEditModal(targetPath = getCurrentClassPath()) {
  if (!requireSignedIn("edit class details")) {
    return;
  }

  const classPath = Array.isArray(targetPath) ? targetPath : null;
  const classFolder = classPath ? getFolderAtPath(classPath) : null;
  if (!classFolder || classFolder.type !== "class") {
    return;
  }

  openModal("class", {
    action: "edit",
    targetPath: classPath,
    values: {
      course: classFolder.name || "",
      teacherName: classFolder.teacherName || "",
      description: classFolder.description || "",
      teacherNotes: classFolder.teacherNotes || "",
      testFormat: classFolder.testFormat || "",
      testExamples: classFolder.testExamples || [],
      additionalNotes: classFolder.additionalNotes || "",
    },
  });
}

function openModal(mode, options = {}) {
  if (!requireSignedIn("create content")) {
    return;
  }
  currentModalMode = mode;
  currentModalAction = options.action === "edit" ? "edit" : "create";
  currentModalTargetPath = Array.isArray(options.targetPath)
    ? [...options.targetPath]
    : null;
  classModalBackdrop.hidden = false;
  classFields.hidden = mode === "session";
  sessionFields.hidden = mode !== "session";
  teacherNameField.hidden = mode !== "class";
  teacherNotesField.hidden = mode !== "class";
  testFormatField.hidden = mode !== "class";
  testExamplesField.hidden = mode !== "class";
  nameFieldLabel.textContent =
    mode === "class" ? "Course" : mode === "unit" ? "Unit Name" : "Lesson Name";
  additionalNotesLabel.textContent =
    mode === "class" ? "Additional Notes" : "Notes";
  classCourseInput.placeholder =
    mode === "class"
      ? "AP Biology"
      : mode === "unit"
        ? "Unit 3"
        : "Cell Respiration";
  classDescriptionInput.placeholder =
    mode === "class"
      ? "What this class is about"
      : mode === "unit"
        ? "What this unit covers"
        : "What this lesson focuses on";
  classAdditionalNotesInput.placeholder =
    mode === "class"
      ? "Anything else you want saved"
      : "Extra notes for this folder";
  classModalKicker.textContent =
    currentModalAction === "edit"
      ? "Edit class"
      : mode === "class"
      ? "New class"
      : mode === "unit"
        ? "New unit"
        : mode === "lesson"
          ? "New lesson"
          : "Session setup";
  classModalTitle.textContent =
    currentModalAction === "edit"
      ? "Edit Class"
      : mode === "class"
      ? "Create Class"
      : mode === "unit"
        ? "Create Unit"
        : mode === "lesson"
          ? "Create Lesson"
          : "Start Session";
  saveClassModal.textContent =
    mode === "session"
      ? "Start Session"
      : currentModalAction === "edit"
        ? "Save Changes"
      : mode === "class"
        ? "Save Class"
        : mode === "unit"
          ? "Save Unit"
          : "Save Lesson";
  if (mode === "class") {
    populateClassModalFields(options.values || {});
  } else if (mode !== "session") {
    populateClassModalFields();
  }
  if (mode !== "session") {
    classCourseInput.focus();
  } else {
    sessionNameInput.focus();
  }
}

function closeModal() {
  classModalBackdrop.hidden = true;
  currentModalAction = "create";
  currentModalTargetPath = null;
  classCourseInput.value = "";
  classTeacherInput.value = "";
  classTestFormatInput.value = "";
  classTestExamplesInput.value = "";
  classDescriptionInput.value = "";
  classTeacherNotesInput.value = "";
  classAdditionalNotesInput.value = "";
  sessionNameInput.value = "";
  sessionNotesInput.value = "";
}

async function saveModal() {
  if (!requireSignedIn("save changes")) {
    return;
  }
  if (
    currentModalMode === "class" ||
    currentModalMode === "unit" ||
    currentModalMode === "lesson"
  ) {
    const course = classCourseInput.value.trim();
    if (!course) {
      classCourseInput.focus();
      return;
    }

    const teacherName = classTeacherInput.value.trim();
    const testFormat = classTestFormatInput.value.trim();
    const testExamples = normalizeTestExamples(classTestExamplesInput.value);
    const description = classDescriptionInput.value.trim();
    const teacherNotes = classTeacherNotesInput.value.trim();
    const additionalNotes = classAdditionalNotesInput.value.trim();
    let nextFolder;

    if (currentModalMode === "class") {
      const existingClassFolder =
        currentModalAction === "edit" && currentModalTargetPath
          ? getFolderAtPath(currentModalTargetPath)
          : null;
      const backendResult = await window.overlayApi.saveClassProfile(
        buildBackendClassPayload({
          course,
          dbClassId: existingClassFolder?.dbClassId,
          teacherName,
          description,
          teacherNotes,
          testFormat,
          testExamples,
          additionalNotes,
        }),
      );

      nextFolder = {
        id: existingClassFolder?.id || makeId(),
        type: "class",
        name: course,
        dbClassId: backendResult.classProfile.id,
        teacherName,
        testFormat,
        testExamples,
        description,
        teacherNotes,
        additionalNotes,
        children: existingClassFolder?.children || [],
      };
    } else {
      nextFolder = {
        id: makeId(),
        type: currentModalMode,
        name: course,
        description,
        additionalNotes,
        children: [],
      };
    }

    const nextFolders =
      currentModalMode === "class" &&
      currentModalAction === "edit" &&
      currentModalTargetPath
        ? updateFolderAtPath(currentModalTargetPath, () => nextFolder)
        : replaceChildrenAtPath(currentPath, [...getCurrentChildren(), nextFolder]);
    await persistFolders(nextFolders);
    closeModal();
    return;
  }

  const sessionName = sessionNameInput.value.trim();
  if (!sessionName) {
    sessionNameInput.focus();
    return;
  }

  const classFolder = getCurrentClassFolder();
  const dbClassId = await ensureBackendClassId(classFolder);
  const hierarchyNotes = buildHierarchyContextNotes();
  closeModal();
  await window.overlayApi.startSession({
    classId: dbClassId,
    className: classFolder?.name || "",
    teacherName: classFolder?.teacherName || "",
    testFormat: classFolder?.testFormat || "",
    testExamples: classFolder?.testExamples || [],
    description: classFolder?.description || "",
    teacherNotes: classFolder?.teacherNotes || "",
    additionalNotes: classFolder?.additionalNotes || "",
    currentUnit: buildCurrentUnitPathLabel(),
    hierarchyNotes,
    explorerPath: [...currentPath],
    sessionId: null,
    sessionName,
    sessionNotes: [sessionNotesInput.value.trim(), hierarchyNotes]
      .filter(Boolean)
      .join("\n\n"),
  });
  await window.overlayApi.minimizeNative();
}

function applyThemeState({ shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
}

function applyThemePreference({ themeSource, shouldUseDarkColors }) {
  applyThemeState({ shouldUseDarkColors });

  for (const button of settingsThemeButtons) {
    button.dataset.selected =
      button.dataset.homeTheme === themeSource ? "true" : "false";
  }

  settingsThemeStatus.textContent = `Current preference: ${humanLabel(themeSource, shouldUseDarkColors)}`;
  if (settingsThemeSelect) {
    settingsThemeSelect.value = themeSource;
    syncCustomSettingsDropdown(settingsThemeSelect);
  }
}

function setMode(mode) {
  root.dataset.mode = mode;
}

function attachResizeHandle(handle) {
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

[
  settingsThemeSelect,
  settingsSourceSelect,
  settingsProfileSelect,
  privacyScreenshotSelect,
  privacySyncSelect,
  privacyLocalOnlySelect,
].forEach((select) => {
  initCustomSettingsDropdown(select);
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  if (event.target.closest(".settings-select-wrap")) {
    return;
  }
  for (const controller of customSettingsDropdowns.values()) {
    controller.close();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  for (const controller of customSettingsDropdowns.values()) {
    controller.close();
  }
});

shrinkWindow.addEventListener("click", async () => {
  await window.overlayApi.minimizeToDock();
});

openSettingsButton.addEventListener("click", () => {
  setHomeView(activeHomeView === "settings" ? "dashboard" : "settings");
});

settingsHomeButton.addEventListener("click", () => {
  setHomeView("dashboard");
});

quizThemeToggle.addEventListener("click", async () => {
  if (!requireSignedIn("change appearance")) {
    return;
  }
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemePreference(result);
});

minimizeNative.addEventListener("click", async () => {
  await window.overlayApi.minimizeNative();
});

quizMinimizeNative.addEventListener("click", async () => {
  await window.overlayApi.minimizeNative();
});

cramThemeToggle.addEventListener("click", async () => {
  if (!requireSignedIn("change appearance")) {
    return;
  }
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemePreference(result);
});

cramMinimizeNative.addEventListener("click", async () => {
  await window.overlayApi.minimizeNative();
});

closeWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

compactCloseWindow.addEventListener("click", async () => {
  await window.overlayApi.closeWindow();
});

restoreWindow.addEventListener("click", async () => {
  await window.overlayApi.expandWindow();
});

backFolderButton.addEventListener("click", () => {
  currentPath = currentPath.slice(0, -1);
  renderFolders();
});

newFolderButton.addEventListener("click", () => {
  if (!requireSignedIn("create content")) {
    return;
  }
  if (isFolderActionMenuOpen) {
    closeFolderActionMenu();
  } else {
    openFolderActionMenu();
  }
});

folderNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    folderNameInput.value = "";
    renderFolders();
  }
});

folderNameInput.addEventListener("input", renderFolders);

closeClassModal.addEventListener("click", closeModal);
cancelClassModal.addEventListener("click", closeModal);
saveClassModal.addEventListener("click", saveModal);
classModalBackdrop.addEventListener("click", (event) => {
  if (event.target === classModalBackdrop) {
    closeModal();
  }
});
document.addEventListener("click", (event) => {
  if (!isFolderActionMenuOpen) {
    return;
  }

  if (
    event.target instanceof Node &&
    !newFolderButton.contains(event.target) &&
    !folderActionMenu.contains(event.target)
  ) {
    closeFolderActionMenu();
  }
});
closeSessionSummaryButton.addEventListener("click", closeSessionSummary);
sessionSummaryBackdrop.addEventListener("click", (event) => {
  if (event.target === sessionSummaryBackdrop) {
    closeSessionSummary();
  }
});
closeQuizModalButton.addEventListener("click", closeQuizModal);
quizBackdrop.addEventListener("click", (event) => {
  if (event.target === quizBackdrop) {
    closeQuizModal();
  }
});

editCurrentClassButton?.addEventListener("click", () => {
  openClassEditModal();
});
closeCramModalButton.addEventListener("click", closeCramModal);
cramBackdrop.addEventListener("click", (event) => {
  if (event.target === cramBackdrop) {
    closeCramModal();
  }
});
cramMaterialText.addEventListener("input", updateCramMaterialCount);
cramAdditionalNotes.addEventListener("input", updateCramMaterialCount);
generateCramButton.addEventListener("click", () => {
  void generateCramPlan();
});
backToCramSetupButton.addEventListener("click", () => {
  cramView.hidden = true;
  cramSetupView.hidden = false;
});
regenerateCramButton.addEventListener("click", () => {
  cramView.hidden = true;
  void generateCramPlan();
});
quizGapFocus.addEventListener("input", () => {
  quizGapFocusValue.textContent = `${quizGapFocus.value}%`;
});
quizMaterialFile.addEventListener("change", async () => {
  const file = quizMaterialFile.files?.[0];
  if (!file) {
    uploadedQuizMaterial = "";
    uploadedQuizMaterialSummary = "";
    quizFileName.textContent = "No file selected";
    return;
  }

  try {
    const [result] = await extractStudyMaterialFromFiles([file], "quiz");
    uploadedQuizMaterial = result.content;
    uploadedQuizMaterialSummary = `${result.handler.toUpperCase()} condensed from ${result.originalCharacters.toLocaleString()} to ${result.compressedCharacters.toLocaleString()} chars`;
    quizFileName.textContent = `${file.name} • condensed`;
    quizSourceUploaded.checked = true;
  } catch (error) {
    uploadedQuizMaterial = "";
    uploadedQuizMaterialSummary = "";
    quizFileName.textContent = "File couldn't be condensed";
    console.error("Failed to process quiz material file", error);
  }
});
cramMaterialFile.addEventListener("change", async () => {
  const files = Array.from(cramMaterialFile.files || []);
  if (files.length === 0) {
    uploadedCramMaterials = [];
    cramMaterialUploadError = "";
    cramMaterialUploadSummary = "";
    cramFileName.textContent = "No files selected";
    renderCramUploadRollup();
    updateCramMaterialCount();
    return;
  }

  try {
    const results = await Promise.allSettled(
      files.map((file) => extractStudyMaterialFromFiles([file], "cram")),
    );
    const successfulFiles = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value[0]);
    const failedCount = results.length - successfulFiles.length;
    const totalOriginalCharacters = successfulFiles.reduce(
      (total, file) => total + file.originalCharacters,
      0,
    );
    const totalCompressedCharacters = successfulFiles.reduce(
      (total, file) => total + file.compressedCharacters,
      0,
    );
    const totalTokenSavings = successfulFiles.reduce(
      (total, file) => total + file.estimatedTokenSavings,
      0,
    );

    uploadedCramMaterials = successfulFiles;
    cramMaterialUploadError = failedCount
      ? `Loaded ${successfulFiles.length} file${successfulFiles.length === 1 ? "" : "s"}, but ${failedCount} file${failedCount === 1 ? "" : "s"} couldn't be read cleanly.`
      : "";
    cramMaterialUploadSummary =
      successfulFiles.length > 0
        ? `Condensed ${successfulFiles.length} upload${successfulFiles.length === 1 ? "" : "s"} from ${totalOriginalCharacters.toLocaleString()} to ${totalCompressedCharacters.toLocaleString()} characters, saving about ${totalTokenSavings.toLocaleString()} tokens.`
        : "";
    cramFileName.textContent = getCramUploadSummaryText();
    renderCramUploadRollup();
  } catch (error) {
    uploadedCramMaterials = [];
    cramMaterialUploadError =
      "Could not extract readable text from those files.";
    cramMaterialUploadSummary = "";
    cramFileName.textContent = "Files couldn't be read";
    renderCramUploadRollup();
    console.error("Failed to read Cram Mode material files", error);
  }
  updateCramMaterialCount();
});

for (const button of settingsThemeButtons) {
  button.addEventListener("click", async () => {
    if (!requireSignedIn("change appearance")) {
      return;
    }
    const result = await window.overlayApi.setThemeSource(
      button.dataset.homeTheme,
    );
    applyThemePreference(result);
  });
}

if (settingsThemeSelect) {
  settingsThemeSelect.addEventListener("change", async () => {
    if (!requireSignedIn("change appearance")) {
      return;
    }
    const result = await window.overlayApi.setThemeSource(settingsThemeSelect.value);
    applyThemePreference(result);
  });
}

function closeFolderActionMenu() {
  isFolderActionMenuOpen = false;
  newFolderButton.dataset.open = "false";
  newFolderButton.setAttribute("aria-expanded", "false");
  folderActionMenu.hidden = true;
  folderActionMenu.replaceChildren();
}

function openFolderActionMenu() {
  const actions = getContextualCreateActions();
  folderActionMenu.replaceChildren();

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-action-menu-item";
    button.setAttribute("role", "menuitem");
    button.innerHTML = `
      <span class="folder-action-menu-item-icon" aria-hidden="true">
          <svg class="icon-svg" viewBox="0 0 24 24">
          <path d="${action.icon || MUI_CREATE_ACTION_ICON_PATHS.session}"></path>
        </svg>
      </span>
      <span class="folder-action-menu-item-label">${action.label}</span>
    `;
    button.addEventListener("click", () => {
      closeFolderActionMenu();
      if (action.key === "quiz") {
        openQuizModalForCurrentClass();
      } else if (action.key === "cram") {
        openCramModalForCurrentClass();
      } else {
        openModal(action.key);
      }
    });
    folderActionMenu.appendChild(button);
  });

  isFolderActionMenuOpen = true;
  newFolderButton.dataset.open = "true";
  newFolderButton.setAttribute("aria-expanded", "true");
  folderActionMenu.hidden = false;
}

for (const button of settingsSourceButtons) {
  button.addEventListener("click", async () => {
    if (!requireSignedIn("update preferences")) {
      return;
    }
    const preferences = await window.overlayApi.updatePreferences({
      discoverySource: button.dataset.homeSource,
    });
    applyPreferenceSelections(preferences);
  });
}

if (settingsSourceSelect) {
  settingsSourceSelect.addEventListener("change", async () => {
    if (!requireSignedIn("update preferences")) {
      return;
    }
    if (!settingsSourceSelect.value) {
      return;
    }
    const preferences = await window.overlayApi.updatePreferences({
      discoverySource: settingsSourceSelect.value,
    });
    applyPreferenceSelections(preferences);
  });
}

for (const button of settingsProfileButtons) {
  button.addEventListener("click", async () => {
    if (!requireSignedIn("update preferences")) {
      return;
    }
    const preferences = await window.overlayApi.updatePreferences({
      customerProfile: button.dataset.homeProfile,
    });
    applyPreferenceSelections(preferences);
  });
}

if (settingsProfileSelect) {
  settingsProfileSelect.addEventListener("change", async () => {
    if (!requireSignedIn("update preferences")) {
      return;
    }
    if (!settingsProfileSelect.value) {
      return;
    }
    const preferences = await window.overlayApi.updatePreferences({
      customerProfile: settingsProfileSelect.value,
    });
    applyPreferenceSelections(preferences);
  });
}

for (const button of privacyScreenshotButtons) {
  button.addEventListener("click", async () => {
    if (!requireSignedIn("update privacy settings")) {
      return;
    }
    const settings = await window.overlayApi.updatePrivacySettings({
      screenshotPolicy: button.dataset.screenshotPolicy,
    });
    applyPrivacySettings(settings);
  });
}

if (privacyScreenshotSelect) {
  privacyScreenshotSelect.addEventListener("change", async () => {
    if (!requireSignedIn("update privacy settings")) {
      return;
    }
    const settings = await window.overlayApi.updatePrivacySettings({
      screenshotPolicy: privacyScreenshotSelect.value,
    });
    applyPrivacySettings(settings);
  });
}

for (const button of privacySyncButtons) {
  button.addEventListener("click", async () => {
    if (!requireSignedIn("update privacy settings")) {
      return;
    }
    const settings = await window.overlayApi.updatePrivacySettings({
      syncConsent: button.dataset.syncConsent,
    });
    applyPrivacySettings(settings);
  });
}

if (privacySyncSelect) {
  privacySyncSelect.addEventListener("change", async () => {
    if (!requireSignedIn("update privacy settings")) {
      return;
    }
    const settings = await window.overlayApi.updatePrivacySettings({
      syncConsent: privacySyncSelect.value,
    });
    applyPrivacySettings(settings);
  });
}

if (privacyLocalOnlySelect) {
  privacyLocalOnlySelect.addEventListener("change", async () => {
    if (!requireSignedIn("update privacy settings")) {
      return;
    }
    const settings = await window.overlayApi.updatePrivacySettings({
      localOnly: privacyLocalOnlySelect.value === "true",
    });
    applyPrivacySettings(settings);
  });
}
accountOpenAuthGateButton.addEventListener("click", () => {
  postAuthHomeView = "settings";
  setHomeView("auth");
  setAuthGateStatus("Sign in to continue.", "neutral");
  authGateEmailInput.focus();
});
authGateLoginButton.addEventListener("click", async () => {
  await submitAuthGateRequest("login");
});
authGateRegisterButton.addEventListener("click", async () => {
  await submitAuthGateRequest("register");
});
accountLogoutButton.addEventListener("click", async () => {
  if (!requireSignedIn("log out")) {
    return;
  }
  await window.overlayApi.logoutAccount();
  applyAuthSession(null);
  setPrivacyAccountStatus("Signed out.", "neutral");
});
privacyExportButton.addEventListener("click", async () => {
  if (!requireSignedIn("export account data")) {
    return;
  }
  privacyExportButton.disabled = true;
  setPrivacyAccountStatus("Preparing export...", "neutral");

  try {
    const result = await window.overlayApi.exportAccountData({
      includeContent: true,
    });
    const fileName = `sideclick-export-${new Date().toISOString().slice(0, 10)}.json`;
    triggerJsonDownload(fileName, result.export);
    setPrivacyAccountStatus("Export downloaded.", "success");
  } catch (error) {
    setPrivacyAccountStatus(
      error instanceof Error ? error.message : "Export failed.",
      "danger",
    );
  } finally {
    privacyExportButton.disabled = false;
  }
});
privacyDeleteAccountButton.addEventListener("click", async () => {
  if (!requireSignedIn("delete account data")) {
    return;
  }
  const confirmed = window.confirm(
    "Delete managed backend account data? This cannot be undone.",
  );
  if (!confirmed) {
    return;
  }

  privacyDeleteAccountButton.disabled = true;
  setPrivacyAccountStatus("Queueing account deletion...", "neutral");

  try {
    await window.overlayApi.deleteAccount();
    setPrivacyAccountStatus(
      "Account deletion was queued. Local privacy settings remain on this device.",
      "success",
    );
  } catch (error) {
    setPrivacyAccountStatus(
      error instanceof Error ? error.message : "Account deletion failed.",
      "danger",
    );
  } finally {
    privacyDeleteAccountButton.disabled = false;
  }
});
generateQuizButton.addEventListener("click", async () => {
  await generateQuizForActiveSession();
});
saveQuizButton.addEventListener("click", async () => {
  await saveActiveQuizToExplorer();
});
quizSubmitButton.addEventListener("click", () => {
  gradeQuiz();
});

window.overlayApi.onThemeChanged((payload) => {
  applyThemePreference(payload);
});
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
window.overlayApi.onClassFoldersChanged((nextFolders) => {
  folders = normalizeFolders(Array.isArray(nextFolders) ? nextFolders : []);
  renderFolders();
});

window.addEventListener("DOMContentLoaded", async () => {
  const [storedFolders, preferences, settings, session] = await Promise.all([
    window.overlayApi.getClassFolders(),
    window.overlayApi.getPreferences(),
    window.overlayApi.getPrivacySettings(),
    window.overlayApi.getAuthSession(),
  ]);
  const normalizedFolders = normalizeFolders(storedFolders);
  const shouldPersistNormalized =
    normalizedFolders.length !== storedFolders.length ||
    storedFolders.some(
      (item) => Array.isArray(item.children) && item.children.length > 0,
    );

  if (shouldPersistNormalized) {
    folders = await window.overlayApi.updateClassFolders(normalizedFolders);
  } else {
    folders = normalizedFolders;
  }
  applyThemePreference({
    themeSource: preferences.themeSource || "system",
    shouldUseDarkColors: resolveShouldUseDarkColors(
      preferences.themeSource || "system",
    ),
  });
  applyPreferenceSelections(preferences);
  applyPrivacySettings(settings);
  applyAuthSession(session);
  setPrivacyAccountStatus(
    "Theme changes apply across Home, Chat, Cram Mode, and quiz views.",
  );
  setHomeView("dashboard");
  renderFolders();
  attachResizeHandle(resizeHandle);
  updateCramMaterialCount();
});

window.addEventListener("resize", scheduleFitText);
