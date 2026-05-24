const root = document.querySelector(".window-shell");
const shrinkWindow = document.querySelector("#shrink-window");
const openSettingsButton = document.querySelector("#open-settings");
const openSettingsIconPath = openSettingsButton?.querySelector("path");
const minimizeNative = document.querySelector("#minimize-native");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const homeDashboardView = document.querySelector("#home-dashboard-view");
const homeAssessmentView = document.querySelector("#home-assessment-view");
const homeCramView = document.querySelector("#home-cram-view");
const homeSettingsView = document.querySelector("#home-settings-view");
const homeUpdateGuideView = document.querySelector("#home-update-guide-view");
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
const editCurrentClassButton = document.querySelector(
  "#edit-current-class-button",
);
const classModalBackdrop = document.querySelector("#class-modal-backdrop");
const classModalKicker = document.querySelector("#class-modal-kicker");
const classModalTitle = document.querySelector("#class-modal-title");
const closeClassModal = document.querySelector("#close-class-modal");
const cancelClassModal = document.querySelector("#cancel-class-modal");
const saveClassModal = document.querySelector("#save-class-modal");
const classFields = document.querySelector("#class-fields");
const sessionFields = document.querySelector("#session-fields");
const assessmentConfigCard = document.querySelector("#assessment-config-card");
const assessmentConfigStatus = document.querySelector(
  "#assessment-config-status",
);
const openAssessmentConfigButton = document.querySelector(
  "#open-assessment-config-button",
);
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
const assessmentBackButton = document.querySelector("#assessment-back-button");
const assessmentBreadcrumbClass = document.querySelector(
  "#assessment-breadcrumb-class",
);
const assessmentTitle = document.querySelector("#assessment-title");
const assessmentLiveSummary = document.querySelector(
  "#assessment-live-summary",
);
const assessmentManagerView = document.querySelector(
  "#assessment-manager-view",
);
const assessmentEmptyState = document.querySelector("#assessment-empty-state");
const assessmentProfileGrid = document.querySelector(
  "#assessment-profile-grid",
);
const assessmentSearchInput = document.querySelector(
  "#assessment-search-input",
);
const assessmentManagerCreateButton = document.querySelector(
  "#assessment-manager-create-button",
);
const assessmentEditorView = document.querySelector("#assessment-editor-view");
const assessmentEditorBackButton = document.querySelector(
  "#assessment-editor-back-button",
);
const assessmentProfileSelect = document.querySelector(
  "#assessment-profile-select",
);
const assessmentProfileName = document.querySelector(
  "#assessment-profile-name",
);
const assessmentNewProfileButton = document.querySelector(
  "#assessment-new-profile-button",
);
const assessmentAnalyzeButton = document.querySelector(
  "#assessment-analyze-button",
);
const assessmentAnalysisStatus = document.querySelector(
  "#assessment-analysis-status",
);
const assessmentPresetGrid = document.querySelector("#assessment-preset-grid");
const assessmentCustomFormat = document.querySelector(
  "#assessment-custom-format",
);
const assessmentMaterialFile = document.querySelector(
  "#assessment-material-file",
);
const assessmentUploadStatus = document.querySelector(
  "#assessment-upload-status",
);
const assessmentUploadRollup = document.querySelector(
  "#assessment-upload-rollup",
);
const assessmentClassMaterialStatus = document.querySelector(
  "#assessment-class-material-status",
);
const assessmentClassMaterialPicker = document.querySelector(
  "#assessment-class-material-picker",
);
const assessmentExampleQuestions = document.querySelector(
  "#assessment-example-questions",
);
const assessmentGradingNotes = document.querySelector(
  "#assessment-grading-notes",
);
const assessmentSummaryPoints = document.querySelector(
  "#assessment-summary-points",
);
const assessmentAnalysisInsights = document.querySelector(
  "#assessment-analysis-insights",
);
const assessmentCancelButton = document.querySelector(
  "#assessment-cancel-button",
);
const assessmentSaveButton = document.querySelector("#assessment-save-button");
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
const homeQuizView = document.querySelector("#home-quiz-view");
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
const quizAssessmentProfileSelect = document.querySelector(
  "#quiz-assessment-profile-select",
);
const quizAssessmentProfileMeta = document.querySelector(
  "#quiz-assessment-profile-meta",
);
const quizClassMaterialStatus = document.querySelector(
  "#quiz-class-material-status",
);
const quizClassMaterialPicker = document.querySelector(
  "#quiz-class-material-picker",
);
const quizQuestionCountInputs = Array.from(
  document.querySelectorAll('input[name="quiz-question-count"]'),
);
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
const quizExplanationToggle = document.querySelector("#quiz-explanation-toggle");
const quizExplanationFollowToggle = document.querySelector(
  "#quiz-explanation-follow-toggle",
);
const quizExplanationPanel = document.querySelector("#quiz-explanation-panel");
const quizExplanationTitle = document.querySelector("#quiz-explanation-title");
const quizExplanationAnswer = document.querySelector(
  "#quiz-explanation-answer",
);
const quizExplanationText = document.querySelector("#quiz-explanation-text");
const saveQuizButton = document.querySelector("#save-quiz-button");
const quizSubmitButton = document.querySelector("#quiz-submit-button");
const cramSessionMeta = document.querySelector("#cram-session-meta");
const cramClassMaterialStatus = document.querySelector(
  "#cram-class-material-status",
);
const cramClassMaterialPicker = document.querySelector(
  "#cram-class-material-picker",
);
const cramExamNameInput = document.querySelector("#cram-exam-name");
const cramTimeAvailableSelect = document.querySelector("#cram-time-available");
const cramAssessmentProfileSelect = document.querySelector(
  "#cram-assessment-profile-select",
);
const cramAssessmentProfileMeta = document.querySelector(
  "#cram-assessment-profile-meta",
);
const cramMaterialFile = document.querySelector("#cram-material-file");
const cramFileName = document.querySelector("#cram-file-name");
const cramUploadRollup = document.querySelector("#cram-upload-rollup");
const cramMaterialText = document.querySelector("#cram-material-text");
const cramAdditionalNotes = document.querySelector("#cram-additional-notes");
const cramMaterialCount = document.querySelector("#cram-material-count");
const cramMaterialStatus = document.querySelector("#cram-material-status");
const generateCramButton = document.querySelector("#generate-cram-button");
const cramPageScreen = document.querySelector(".cram-page-screen");
const classMaterialBackdrop = document.querySelector(
  "#class-material-backdrop",
);
const classMaterialModalTitle = document.querySelector(
  "#class-material-modal-title",
);
const closeClassMaterialModalButton = document.querySelector(
  "#close-class-material-modal",
);
const classMaterialFile = document.querySelector("#class-material-file");
const classMaterialFileStatus = document.querySelector(
  "#class-material-file-status",
);
const classMaterialText = document.querySelector("#class-material-text");
const classMaterialRollup = document.querySelector("#class-material-rollup");
const saveClassMaterialButton = document.querySelector(
  "#save-class-material-button",
);
const classMaterialMeta = document.querySelector("#class-material-meta");
const cramBackButton = document.querySelector("#cram-back-button");
const cramScreenTitle = document.querySelector("#cram-screen-title");
const cramScreenMeta = document.querySelector("#cram-screen-meta");
const cramSetupPanel = document.querySelector("#cram-setup-panel");
const cramActivePanel = document.querySelector("#cram-active-panel");
const cramQuizPanel = document.querySelector("#cram-quiz-panel");
const cramStatus = document.querySelector("#cram-status");
const cramTaskList = document.querySelector("#cram-task-list");
const cramTaskDetail = document.querySelector("#cram-task-detail");
const cramProgressValue = document.querySelector("#cram-progress-value");
const cramProgressCopy = document.querySelector("#cram-progress-copy");
const cramSaveProgressButton = document.querySelector("#cram-save-progress");
const cramQuizBackButton = document.querySelector("#cram-quiz-back-button");
const cramQuizMeta = document.querySelector("#cram-quiz-meta");
const cramQuizMount = document.querySelector("#cram-quiz-mount");
const resizeHandle = document.querySelector("#resize-handle");
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

document.body.dataset.windowMode = root?.dataset.mode || "expanded";
const settingsThemeStatus = document.querySelector("#settings-theme-status");
const settingsSourceStatus = document.querySelector("#settings-source-status");
const settingsProfileStatus = document.querySelector(
  "#settings-profile-status",
);
const settingsThemeSelect = document.querySelector("#settings-theme-select");
const settingsSourceSelect = document.querySelector("#settings-source-select");
const settingsProfileSelect = document.querySelector(
  "#settings-profile-select",
);
const settingsPrivacyStatus = document.querySelector(
  "#settings-privacy-status",
);
const privacyScreenshotStatus = document.querySelector(
  "#privacy-screenshot-status",
);
const privacySyncStatus = document.querySelector("#privacy-sync-status");
const privacyScreenshotSelect = document.querySelector(
  "#privacy-screenshot-select",
);
const privacySyncSelect = document.querySelector("#privacy-sync-select");
const accountAuthStatus = document.querySelector("#account-auth-status");
const accountSignedOutPanel = document.querySelector(
  "#account-signed-out-panel",
);
const accountSignedInPanel = document.querySelector("#account-signed-in-panel");
const accountIdentityDisplay = document.querySelector(
  "#account-identity-display",
);
const accountOpenAuthGateButton = document.querySelector(
  "#account-open-auth-gate-button",
);
const accountLogoutButton = document.querySelector("#account-logout-button");
const privacyExportButton = document.querySelector("#privacy-export-button");
const privacyDeleteAccountButton = document.querySelector(
  "#privacy-delete-account-button",
);
const privacyAccountStatus = document.querySelector("#privacy-account-status");
const settingsUpdateStatus = document.querySelector("#settings-update-status");
const settingsCheckUpdateButton = document.querySelector("#settings-check-update-button");
const settingsActionUpdateButton = document.querySelector("#settings-action-update-button");
const updateGuideBackButton = document.querySelector("#update-guide-back-button");
const settingsUpdateQuarantineCommand = document.querySelector(
  "#settings-update-quarantine-command",
);
const authGateStatus = document.querySelector("#auth-gate-status");
const authGateEmailInput = document.querySelector("#auth-gate-email-input");
const authGatePasswordInput = document.querySelector(
  "#auth-gate-password-input",
);
const authGateDisplayNameInput = document.querySelector(
  "#auth-gate-display-name-input",
);
const authGateLoginButton = document.querySelector("#auth-gate-login-button");
const authGateRegisterButton = document.querySelector(
  "#auth-gate-register-button",
);
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
let selectedQuizClassMaterialKeys = new Set();
let quizClassMaterialSelectionInitialized = false;
let activeQuiz = null;
let quizHasBeenChecked = false;
let quizExplanationFollowScroll = true;
let activeQuizExplanationIndex = null;
let activeCramPlan = null;
let uploadedCramMaterials = [];
let selectedCramClassMaterialKeys = new Set();
let cramClassMaterialSelectionInitialized = false;
let cramMaterialUploadError = "";
let cramMaterialUploadSummary = "";
let isGeneratingCramPlan = false;
let activeQuizContext = "page";
let quizViewModalParent = null;
let quizViewModalNextSibling = null;
let quizReturnPath = [];
let activeCramPath = [];
let activeCramTaskIndex = 0;
let activeCramOverviewPage = 0;
let uploadedCramSetupMaterial = "";
let cramReturnPath = [];
let activeHomeView = "dashboard";
let activeAssessmentClassPath = null;
let activeAssessmentProfiles = [];
let activeAssessmentProfileId = "";
let activeAssessmentSource = null;
let assessmentUploadError = "";
let selectedAssessmentClassMaterialKeys = new Set();
let assessmentClassMaterialSelectionInitialized = false;
let isAnalyzingAssessmentProfile = false;
let activeAssessmentPanel = "manager";
let currentModalAssessmentProfiles = [];
let currentModalActiveAssessmentProfileId = "";
let privacySettings = null;
let authSession = null;
let postAuthHomeView = "dashboard";

function formatErrorMessage(message) {
  if (!message) return "";
  const ipcPrefixRegex = /^Error\s+invoking\s+remote\s+method\s+['"][^'"]+['"]:\s+(?:Error:\s+)?/i;
  let cleanMessage = message.replace(ipcPrefixRegex, "");
  cleanMessage = cleanMessage.replace(/^Error:\s+/i, "");
  cleanMessage = cleanMessage.replace(/already exists\b/g, "already exist");
  return cleanMessage.trim();
}

async function getAiBackendStatus() {
  if (typeof window.overlayApi?.getAiBackendStatus !== "function") {
    return { available: true, message: "" };
  }

  try {
    return await window.overlayApi.getAiBackendStatus();
  } catch {
    return { available: true, message: "" };
  }
}

async function ensureAiFeatureAvailable(onUnavailable) {
  const status = await getAiBackendStatus();
  if (status?.available !== false) {
    return true;
  }

  if (typeof onUnavailable === "function") {
    onUnavailable(
      status.message ||
        "Add OPENAI_API_KEY to .env.backend and restart SideKlick to use AI features on this device.",
    );
  }

  return false;
}

const customSettingsDropdowns = new Map();
const SETTINGS_ICON_PATH =
  "M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z";
const HOME_ICON_PATH = "M12 3 3 10.4V21h6.5v-6h5v6H21V10.4z";
const MUI_CREATE_ACTION_ICON_PATHS = {
  class:
    "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z",

  unit: "M11.99 18.54 4.62 12.8 3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z",

  lesson:
    "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",

  session:
    "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",

  quiz: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5.99 13H12v-2h2.01v2zm1.54-5.07-.9.92c-.65.66-.86 1.16-.86 2.15h-1.8v-.45c0-1 .41-1.91 1.07-2.57l1.24-1.26c.37-.36.58-.86.58-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H9.08c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.26z",
  material:
    "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",

  cram: "M4 4h16v2H4V4zm0 5h10v2H4V9zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-10h2v2h-2V9zm0 10h2v2h-2v-2z",
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
  granted: "On",
  denied: "Off",
};

const ASSESSMENT_PRESETS = [
  {
    id: "mcq",
    title: "Mostly multiple choice",
    format: "Mostly multiple choice with one clearly correct answer",
    cues: "Fast stems, recognitional recall, strong distractors",
  },
  {
    id: "mixed",
    title: "Mixed quiz",
    format: "Mixed multiple choice and short response",
    cues: "Some recall, some explanation, light written justification",
  },
  {
    id: "frq",
    title: "FRQ heavy",
    format: "Short free response and step-by-step explanation",
    cues: "Teacher rewards reasoning, vocabulary, and shown work",
  },
  {
    id: "diagram",
    title: "Diagram and label",
    format: "Diagram labeling, image interpretation, and applied explanation",
    cues: "Visual prompts, identify parts, explain function",
  },
  {
    id: "word-problem",
    title: "Word problem",
    format: "Scenario-based problems with setup and worked steps",
    cues: "Translate the prompt, solve, and explain each move",
  },
  {
    id: "essay",
    title: "Essay / DBQ",
    format: "Long-form argument, compare-contrast, or evidence-backed writing",
    cues: "Claims, evidence, structure, and synthesis matter",
  },
];

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

function getClassAssessmentProfiles(classFolder) {
  return getAssessmentProfileCollectionSummary(classFolder);
}

function getSelectedClassAssessmentProfile(classFolder, selectedId) {
  const collection = getClassAssessmentProfiles(classFolder);
  return (
    collection.profiles.find((profile) => profile.id === selectedId) ||
    collection.activeProfile
  );
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
    return [
      {
        key: "class",
        label: "Class",
        icon: MUI_CREATE_ACTION_ICON_PATHS.class,
      },
    ];
  }

  if (containerType === "class") {
    return [
      { key: "unit", label: "Unit", icon: MUI_CREATE_ACTION_ICON_PATHS.unit },
      {
        key: "session",
        label: "Session",
        icon: MUI_CREATE_ACTION_ICON_PATHS.session,
      },
      {
        key: "material",
        label: "Class Material",
        icon: MUI_CREATE_ACTION_ICON_PATHS.material,
      },
      {
        key: "cram",
        label: "Cram Mode",
        icon: MUI_CREATE_ACTION_ICON_PATHS.cram,
      },
      { key: "quiz", label: "Quiz", icon: MUI_CREATE_ACTION_ICON_PATHS.quiz },
    ];
  }

  if (containerType === "unit") {
    return [
      {
        key: "lesson",
        label: "Lesson",
        icon: MUI_CREATE_ACTION_ICON_PATHS.lesson,
      },
      {
        key: "session",
        label: "Session",
        icon: MUI_CREATE_ACTION_ICON_PATHS.session,
      },
      {
        key: "material",
        label: "Class Material",
        icon: MUI_CREATE_ACTION_ICON_PATHS.material,
      },
      {
        key: "cram",
        label: "Cram Mode",
        icon: MUI_CREATE_ACTION_ICON_PATHS.cram,
      },
      { key: "quiz", label: "Quiz", icon: MUI_CREATE_ACTION_ICON_PATHS.quiz },
    ];
  }

  return [
    {
      key: "session",
      label: "Session",
      icon: MUI_CREATE_ACTION_ICON_PATHS.session,
    },
    {
      key: "material",
      label: "Class Material",
      icon: MUI_CREATE_ACTION_ICON_PATHS.material,
    },
    {
      key: "cram",
      label: "Cram Mode",
      icon: MUI_CREATE_ACTION_ICON_PATHS.cram,
    },
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
      : nextView === "quiz"
        ? "quiz"
        : nextView === "assessment"
          ? "assessment"
          : nextView === "cram"
            ? "cram"
            : nextView === "update-guide"
              ? "update-guide"
            : nextView === "auth"
              ? "auth"
              : "dashboard";
  homeHeader.textContent =
    activeHomeView === "dashboard"
      ? "Home"
      : activeHomeView === "quiz"
        ? "Quiz"
        : activeHomeView === "assessment"
          ? "Assessment"
          : activeHomeView === "cram"
            ? "Cram Mode"
            : activeHomeView === "settings"
              ? "Settings"
              : activeHomeView === "update-guide"
                ? "Update Guide"
              : "Sign In";
  homeDashboardView.hidden = activeHomeView !== "dashboard";
  homeQuizView.hidden = activeHomeView !== "quiz";
  homeAssessmentView.hidden = activeHomeView !== "assessment";
  homeCramView.hidden = activeHomeView !== "cram";
  homeSettingsView.hidden = activeHomeView !== "settings";
  homeUpdateGuideView.hidden = activeHomeView !== "update-guide";
  homeAuthGateView.hidden = activeHomeView !== "auth";
  homeDashboardView.classList.toggle(
    "home-view-active",
    activeHomeView === "dashboard",
  );
  homeQuizView.classList.toggle("home-view-active", activeHomeView === "quiz");
  homeAssessmentView.classList.toggle(
    "home-view-active",
    activeHomeView === "assessment",
  );
  homeCramView.classList.toggle("home-view-active", activeHomeView === "cram");
  homeSettingsView.classList.toggle(
    "home-view-active",
    activeHomeView === "settings",
  );
  homeUpdateGuideView.classList.toggle(
    "home-view-active",
    activeHomeView === "update-guide",
  );
  homeAuthGateView.classList.toggle(
    "home-view-active",
    activeHomeView === "auth",
  );
  if (activeHomeView !== "settings") {
    for (const controller of customSettingsDropdowns.values()) {
      controller.close();
    }
  }
  if (openSettingsButton) {
    const shouldGoHome =
      activeHomeView === "settings" ||
      activeHomeView === "assessment" ||
      activeHomeView === "update-guide";
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

  const panel = document.createElement("div");
  panel.className = "settings-select-panel";
  menu.appendChild(panel);

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
  if (privacyScreenshotSelect) {
    privacyScreenshotSelect.value = settings.screenshotPolicy;
    syncCustomSettingsDropdown(privacyScreenshotSelect);
  }
  if (privacySyncSelect) {
    privacySyncSelect.value = settings.syncConsent;
    syncCustomSettingsDropdown(privacySyncSelect);
  }
  settingsPrivacyStatus.textContent =
    settings.syncConsent === "denied"
      ? "Telemetry is off. Screenshots still follow your screenshot policy."
      : "Review screenshot and telemetry preferences carefully.";
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
      error instanceof Error ? formatErrorMessage(error.message) : "Authentication failed.",
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

        if (
          child.type === "session" ||
          child.type === "quiz" ||
          child.type === "cram" ||
          child.type === "material" ||
          child.type === "cramPlan"
        ) {
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
        .map((item) =>
          decorateClassFolderWithAssessment({
            ...item,
            children: normalizeChildren(item.children, 1),
          }),
        )
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
  const persisted = await window.overlayApi.updateClassFolders(nextFolders);
  folders = normalizeFolders(persisted);
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

function uniqueStrings(values, limit = Number.POSITIVE_INFINITY) {
  const seen = new Set();
  const output = [];

  for (const value of Array.isArray(values) ? values : []) {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(normalized);
    if (output.length >= limit) {
      break;
    }
  }

  return output;
}

function formatTestExamplesForField(value) {
  return normalizeTestExamples(value).join("\n");
}

function splitSentences(value) {
  return String(value || "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function createEmptyAssessmentAnalysis() {
  return {
    profileName: "",
    testFormat: "",
    conciseSummary: "",
    genericDifferences: [],
    exampleQuestions: [],
    gradingSignals: [],
    wordingPatterns: [],
    likelyQuestionMoves: [],
    quizAdjustments: [],
    cramAdjustments: [],
    sourceMaterialNames: [],
  };
}

function createEmptyAssessmentProfile(name = "Main template") {
  return {
    id: makeId(),
    name,
    presetId: "",
    customFormat: "",
    exampleQuestions: [],
    gradingNotes: "",
    uploads: [],
    analysis: createEmptyAssessmentAnalysis(),
  };
}

function classMaterialHasContent(material) {
  if (!material || typeof material !== "object") {
    return false;
  }

  const pastedText =
    typeof material.text === "string" ? material.text.trim() : "";
  const uploads = normalizeClassMaterialUploads(material.uploads);
  return Boolean(pastedText || uploads.length > 0);
}

function normalizeClassMaterialItem(item = {}) {
  const source = item && typeof item === "object" ? item : {};
  return {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : makeId(),
    type: "material",
    name:
      typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : "Class Material",
    text: typeof source.text === "string" ? source.text : "",
    uploads: normalizeClassMaterialUploads(source.uploads),
    createdAt:
      typeof source.createdAt === "string" && source.createdAt.trim()
        ? source.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof source.updatedAt === "string" && source.updatedAt.trim()
        ? source.updatedAt
        : new Date().toISOString(),
  };
}

function normalizeAssessmentUploads(uploads) {
  if (!Array.isArray(uploads)) {
    return [];
  }

  return uploads
    .filter((upload) => upload && typeof upload === "object")
    .map((upload) => ({
      id:
        typeof upload.id === "string" && upload.id.trim()
          ? upload.id.trim()
          : makeId(),
      name:
        typeof upload.name === "string" ? upload.name.trim() : "Uploaded file",
      handler: typeof upload.handler === "string" ? upload.handler : "text",
      content: typeof upload.content === "string" ? upload.content.trim() : "",
      originalCharacters: Number(upload.originalCharacters) || 0,
      compressedCharacters: Number(upload.compressedCharacters) || 0,
      estimatedTokenSavings: Number(upload.estimatedTokenSavings) || 0,
    }))
    .filter((upload) => upload.content);
}

function normalizeAssessmentProfile(profile) {
  const source = profile && typeof profile === "object" ? profile : {};
  return {
    id:
      typeof source.id === "string" && source.id.trim()
        ? source.id.trim()
        : makeId(),
    name:
      typeof source.name === "string" && source.name.trim()
        ? source.name.trim()
        : "Template",
    presetId:
      typeof source.presetId === "string" && source.presetId.trim()
        ? source.presetId.trim()
        : "",
    customFormat:
      typeof source.customFormat === "string" ? source.customFormat.trim() : "",
    exampleQuestions: normalizeTestExamples(source.exampleQuestions),
    gradingNotes:
      typeof source.gradingNotes === "string" ? source.gradingNotes.trim() : "",
    uploads: normalizeAssessmentUploads(source.uploads),
    analysis: normalizeAssessmentAnalysis(source.analysis),
  };
}

function normalizeAssessmentAnalysis(analysis) {
  const source = analysis && typeof analysis === "object" ? analysis : {};
  return {
    profileName:
      typeof source.profileName === "string" ? source.profileName.trim() : "",
    testFormat:
      typeof source.testFormat === "string" ? source.testFormat.trim() : "",
    conciseSummary:
      typeof source.conciseSummary === "string"
        ? source.conciseSummary.trim()
        : "",
    genericDifferences: uniqueStrings(source.genericDifferences, 6),
    exampleQuestions: normalizeTestExamples(source.exampleQuestions),
    gradingSignals: uniqueStrings(source.gradingSignals, 8),
    wordingPatterns: uniqueStrings(source.wordingPatterns, 8),
    likelyQuestionMoves: uniqueStrings(source.likelyQuestionMoves, 8),
    quizAdjustments: uniqueStrings(source.quizAdjustments, 6),
    cramAdjustments: uniqueStrings(source.cramAdjustments, 6),
    sourceMaterialNames: uniqueStrings(source.sourceMaterialNames, 12),
  };
}

function normalizeAssessmentProfileCollection(source) {
  const objectSource = source && typeof source === "object" ? source : {};
  const rawProfiles = Array.isArray(objectSource.assessmentProfiles)
    ? objectSource.assessmentProfiles
    : objectSource.assessmentProfile
      ? [objectSource.assessmentProfile]
      : [];
  const profiles =
    rawProfiles.length > 0
      ? rawProfiles.map((profile, index) =>
          normalizeAssessmentProfile({
            name:
              typeof profile?.name === "string" && profile.name.trim()
                ? profile.name
                : index === 0
                  ? "Main template"
                  : `Template ${index + 1}`,
            ...profile,
          }),
        )
      : [createEmptyAssessmentProfile()];
  const activeCandidate =
    typeof objectSource.activeAssessmentProfileId === "string"
      ? objectSource.activeAssessmentProfileId.trim()
      : "";
  const activeProfileId = profiles.some(
    (profile) => profile.id === activeCandidate,
  )
    ? activeCandidate
    : profiles[0].id;

  return {
    profiles,
    activeProfileId,
  };
}

function getAssessmentProfileCollectionSummary(source) {
  const collection = normalizeAssessmentProfileCollection(source);
  const activeProfile =
    collection.profiles.find(
      (profile) => profile.id === collection.activeProfileId,
    ) || collection.profiles[0];
  return {
    ...collection,
    activeProfile,
  };
}

function getAssessmentPresetById(presetId) {
  return ASSESSMENT_PRESETS.find((preset) => preset.id === presetId) || null;
}

function getAssessmentFormat(profile) {
  const normalized = normalizeAssessmentProfile(profile);
  if (normalized.analysis.testFormat) {
    return normalized.analysis.testFormat;
  }
  if (normalized.customFormat) {
    return normalized.customFormat;
  }

  return getAssessmentPresetById(normalized.presetId)?.format || "";
}

function extractAssessmentExamplesFromUploads(profile) {
  const normalized = normalizeAssessmentProfile(profile);
  return uniqueStrings(
    normalized.uploads.flatMap((upload) =>
      String(upload.content || "")
        .split(/\n+/)
        .map((line) => line.replace(/^[-*•\s]+/, "").trim())
        .filter((line) => line.length >= 18)
        .slice(0, 2),
    ),
    4,
  );
}

function summarizeAssessmentProfile(profile) {
  const normalized = normalizeAssessmentProfile(profile);
  const preset = getAssessmentPresetById(normalized.presetId);
  const analysis = normalizeAssessmentAnalysis(normalized.analysis);
  const testFormat = getAssessmentFormat(normalized);
  const uploadedExamples = extractAssessmentExamplesFromUploads(normalized);
  const testExamples = uniqueStrings(
    [
      ...analysis.exampleQuestions,
      ...normalized.exampleQuestions,
      ...uploadedExamples,
    ],
    6,
  );
  const summaryPoints = uniqueStrings(
    [
      normalized.name ? `Template: ${normalized.name}` : null,
      analysis.conciseSummary ? `Profile: ${analysis.conciseSummary}` : null,
      testFormat ? `Format: ${testFormat}` : null,
      preset?.cues ? `Signal: ${preset.cues}` : null,
      normalized.gradingNotes
        ? `Grading notes: ${normalized.gradingNotes}`
        : null,
      analysis.genericDifferences[0]
        ? `Difference: ${analysis.genericDifferences[0]}`
        : null,
      normalized.uploads.length > 0
        ? `${normalized.uploads.length} teacher material source${normalized.uploads.length === 1 ? "" : "s"} uploaded`
        : null,
      testExamples[0] ? `Example anchor: ${testExamples[0]}` : null,
    ],
    6,
  );

  return {
    profile: normalized,
    analysis,
    testFormat,
    testExamples,
    summaryPoints,
    statusText:
      summaryPoints[0] ||
      "Upload real test material to build a reusable template.",
  };
}

function decorateClassFolderWithAssessment(folder) {
  const legacyClassMaterial = classMaterialHasContent(folder?.classMaterial)
    ? normalizeClassMaterialItem(folder.classMaterial)
    : null;
  const { classMaterial: legacyClassMaterialField, ...folderWithoutLegacy } =
    folder;
  void legacyClassMaterialField;
  const normalizedChildren = Array.isArray(folder.children)
    ? [...folder.children]
    : [];
  const existingMaterialIndex = normalizedChildren.findIndex(
    (child) => child?.type === "material",
  );
  if (existingMaterialIndex >= 0) {
    normalizedChildren[existingMaterialIndex] = normalizeClassMaterialItem(
      normalizedChildren[existingMaterialIndex],
    );
  } else if (legacyClassMaterial) {
    normalizedChildren.unshift(legacyClassMaterial);
  }
  const collection = getAssessmentProfileCollectionSummary(folder);
  const summary = summarizeAssessmentProfile(collection.activeProfile);
  return {
    ...folderWithoutLegacy,
    children: normalizedChildren,
    assessmentProfiles: collection.profiles,
    activeAssessmentProfileId: collection.activeProfileId,
    assessmentProfile: collection.activeProfile,
    testFormat: summary.testFormat,
    testExamples: summary.testExamples,
  };
}

function getTeacherAssessmentProfilePayload(profile) {
  const summary = summarizeAssessmentProfile(profile);
  return {
    profileId: summary.profile.id,
    profileName:
      summary.analysis.profileName || summary.profile.name || "Template",
    testFormat: summary.testFormat || null,
    conciseSummary: summary.analysis.conciseSummary || null,
    genericDifferences: summary.analysis.genericDifferences,
    exampleQuestions: summary.testExamples,
    gradingSignals: uniqueStrings(
      [
        ...summary.analysis.gradingSignals,
        ...splitSentences(summary.profile.gradingNotes),
      ],
      8,
    ),
    wordingPatterns: summary.analysis.wordingPatterns,
    likelyQuestionMoves: summary.analysis.likelyQuestionMoves,
    quizAdjustments: summary.analysis.quizAdjustments,
    cramAdjustments: summary.analysis.cramAdjustments,
    sourceMaterialNames: uniqueStrings(
      [
        ...summary.analysis.sourceMaterialNames,
        ...summary.profile.uploads.map((upload) => upload.name),
      ],
      12,
    ),
  };
}

function buildBackendClassPayload(values) {
  const assessmentSource = {
    assessmentProfiles: values.assessmentProfiles,
    activeAssessmentProfileId: values.activeAssessmentProfileId,
    assessmentProfile: values.assessmentProfile,
  };
  const assessmentCollection =
    getAssessmentProfileCollectionSummary(assessmentSource);
  const assessmentSummary = summarizeAssessmentProfile(
    assessmentCollection.activeProfile,
  );
  const noteParts = [
    values.description ? `Description: ${values.description}` : null,
    values.additionalNotes
      ? `Additional notes: ${values.additionalNotes}`
      : null,
    assessmentSummary.profile.gradingNotes
      ? `Assessment grading notes: ${assessmentSummary.profile.gradingNotes}`
      : null,
    assessmentSummary.profile.uploads.length > 0
      ? `Teacher materials: ${assessmentSummary.profile.uploads
          .map((upload) => upload.name)
          .join(", ")}`
      : null,
    assessmentSummary.profile.uploads.length > 0
      ? `Assessment evidence:\n${assessmentSummary.profile.uploads
          .map((upload) => `--- ${upload.name} ---\n${upload.content}`)
          .join("\n\n")
          .slice(0, 2800)}`
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
    testFormat: assessmentSummary.testFormat || values.testFormat || null,
    testExamples: uniqueStrings(
      [
        ...assessmentSummary.testExamples,
        ...normalizeTestExamples(values.testExamples),
      ],
      6,
    ),
    keyConcepts: [],
    notes: noteParts.length > 0 ? noteParts.join("\n") : null,
  };
}

function buildClassFolderPayloadForBackend(
  classFolder,
  { currentUnit, hierarchyNotes } = {},
) {
  return buildBackendClassPayload({
    course: classFolder?.name || "",
    dbClassId: classFolder?.dbClassId,
    teacherName: classFolder?.teacherName || "",
    description: classFolder?.description || "",
    teacherNotes: classFolder?.teacherNotes || "",
    assessmentProfiles: classFolder?.assessmentProfiles || [],
    activeAssessmentProfileId: classFolder?.activeAssessmentProfileId || "",
    assessmentProfile:
      classFolder?.assessmentProfile || createEmptyAssessmentProfile(),
    testFormat: classFolder?.testFormat || "",
    testExamples: classFolder?.testExamples || [],
    additionalNotes: classFolder?.additionalNotes || "",
    currentUnit: currentUnit ?? null,
    hierarchyNotes: hierarchyNotes ?? null,
  });
}

async function ensureBackendClassId(classFolder) {
  if (!classFolder) {
    throw new Error("No class folder selected.");
  }

  if (classFolder.dbClassId) {
    return classFolder.dbClassId;
  }

  const result = await window.overlayApi.saveClassProfile(
    buildClassFolderPayloadForBackend(classFolder, {
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

function getAssessmentDraft() {
  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId,
  });
  return normalizeAssessmentProfile(collection.activeProfile);
}

function setAssessmentPanel(panel) {
  activeAssessmentPanel = panel === "editor" ? "editor" : "manager";
  if (assessmentManagerView) {
    assessmentManagerView.hidden = activeAssessmentPanel !== "manager";
  }
  if (assessmentEditorView) {
    assessmentEditorView.hidden = activeAssessmentPanel !== "editor";
  }
}

function setAssessmentDraft(nextProfile) {
  const normalizedProfile = normalizeAssessmentProfile(nextProfile);
  activeAssessmentProfiles = activeAssessmentProfiles.map((profile) =>
    profile.id === normalizedProfile.id ? normalizedProfile : profile,
  );
  if (
    !activeAssessmentProfiles.some(
      (profile) => profile.id === normalizedProfile.id,
    )
  ) {
    activeAssessmentProfiles = [...activeAssessmentProfiles, normalizedProfile];
  }
  activeAssessmentProfileId = normalizedProfile.id;
  renderAssessmentProfileSelector();
  renderAssessmentPresetGrid();
  renderAssessmentUploadRollup();
  renderAssessmentSummary();
}

function setAssessmentProfileCollection(collection) {
  const normalized = getAssessmentProfileCollectionSummary(collection);
  activeAssessmentProfiles = normalized.profiles;
  activeAssessmentProfileId = normalized.activeProfileId;
  if (assessmentProfileSelect) {
    assessmentProfileSelect.value = activeAssessmentProfileId;
  }
  const activeProfile = getAssessmentDraft();
  if (assessmentProfileName) {
    assessmentProfileName.value = activeProfile.name || "";
  }
  if (assessmentCustomFormat) {
    assessmentCustomFormat.value = activeProfile.customFormat || "";
  }
  if (assessmentExampleQuestions) {
    assessmentExampleQuestions.value = formatTestExamplesForField(
      activeProfile.exampleQuestions,
    );
  }
  if (assessmentGradingNotes) {
    assessmentGradingNotes.value = activeProfile.gradingNotes || "";
  }
  renderAssessmentProfileSelector();
  renderAssessmentPresetGrid();
  renderAssessmentUploadRollup();
  renderAssessmentClassMaterialPicker();
  renderAssessmentManager();
  renderAssessmentSummary();
}

function getAssessmentSearchQuery() {
  return (assessmentSearchInput?.value || "").trim().toLowerCase();
}

function renderAssessmentManager() {
  if (!assessmentProfileGrid || !assessmentEmptyState) {
    return;
  }

  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId,
  });
  const searchQuery = getAssessmentSearchQuery();
  const savedProfiles = collection.profiles.filter(
    (profile) =>
      profile.uploads.length > 0 ||
      profile.gradingNotes ||
      profile.customFormat ||
      profile.exampleQuestions.length > 0 ||
      profile.analysis.conciseSummary ||
      profile.analysis.genericDifferences.length > 0,
  );
  const visibleProfiles = searchQuery
    ? savedProfiles.filter((profile) =>
        (profile.name || "").toLowerCase().includes(searchQuery),
      )
    : savedProfiles;

  assessmentProfileGrid.replaceChildren();
  assessmentEmptyState.hidden = visibleProfiles.length > 0;

  const currentClassFolder = activeAssessmentClassPath
    ? getFolderAtPath(activeAssessmentClassPath)
    : null;
  const classLabel = currentClassFolder?.name || "Class";
  if (assessmentBreadcrumbClass) {
    assessmentBreadcrumbClass.textContent = classLabel;
  }

  visibleProfiles.forEach((profile, index) => {
    const summary = summarizeAssessmentProfile(profile);
    const article = document.createElement("article");
    article.className = "folder-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "folder-open-button";
    const metaText =
      summary.analysis.conciseSummary || summary.testFormat || "Ready to edit.";
    const uploadCount = profile.uploads.length;
    const statsText = `${uploadCount} file${uploadCount === 1 ? "" : "s"} uploaded`;
    const safeProfileName = escapeHtml(profile.name || `Template ${index + 1}`);
    const safeMetaText = escapeHtml(metaText);
    const safeStatsText = escapeHtml(statsText);

    openButton.innerHTML = `
      <span class="folder-card-icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24">
          <path d="M9 2h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 6H7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v2h-2V8h-4v2H9V8zm2-4v2h4V4h-4z"></path>
        </svg>
      </span>
      <span class="folder-card-title">${safeProfileName}</span>
      <span class="folder-card-summary">${safeMetaText}</span>
      <span class="folder-card-session-stats">${safeStatsText}</span>
    `;
    openButton.addEventListener("click", () => {
      switchActiveAssessmentProfile(profile.id);
      setAssessmentPanel("editor");
    });

    const actionButtons = document.createElement("div");
    actionButtons.className = "folder-card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "folder-edit-button";
    editButton.setAttribute("aria-label", `Edit ${profile.name || "template"}`);
    editButton.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M14.06 9.02 15.48 10.44 6.92 19H5.5v-1.42l8.56-8.56ZM17.66 3c-.26 0-.51.1-.71.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34A.987.987 0 0 0 17.66 3ZM3.5 20.5h4.04l11.02-11.02-4.04-4.04L3.5 16.46V20.5Z"></path>
      </svg>
    `;
    editButton.addEventListener("click", () => {
      switchActiveAssessmentProfile(profile.id);
      setAssessmentPanel("editor");
    });
    actionButtons.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "folder-delete-button";
    deleteButton.setAttribute(
      "aria-label",
      `Delete ${profile.name || "template"}`,
    );
    deleteButton.innerHTML = `
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M16 9v10H8V9h8m-1.5-6H9.5l-1 1H5v2h14V4h-3.5l-1-1z"></path>
      </svg>
    `;
    deleteButton.addEventListener("click", async () => {
      activeAssessmentProfiles = activeAssessmentProfiles.filter(
        (p) => p.id !== profile.id,
      );
      if (activeAssessmentProfileId === profile.id) {
        activeAssessmentProfileId = activeAssessmentProfiles[0]?.id || "";
      }
      renderAssessmentManager();
      await saveAssessmentProfile();
    });
    actionButtons.appendChild(deleteButton);

    article.append(openButton, actionButtons);
    assessmentProfileGrid.appendChild(article);
  });

  scheduleFitText();
}

function renderAssessmentProfileSelector() {
  if (!assessmentProfileSelect) {
    return;
  }

  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId,
  });
  assessmentProfileSelect.replaceChildren();

  collection.profiles.forEach((profile, index) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name || `Template ${index + 1}`;
    assessmentProfileSelect.appendChild(option);
  });

  assessmentProfileSelect.value = collection.activeProfileId;
}

function renderAssessmentPresetGrid() {
  if (!assessmentPresetGrid) {
    return;
  }

  const draft = getAssessmentDraft();
  assessmentPresetGrid.replaceChildren();

  ASSESSMENT_PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "assessment-preset-button";
    button.dataset.selected = draft.presetId === preset.id ? "true" : "false";
    button.innerHTML = `
      <span class="assessment-preset-title">${preset.title}</span>
      <span class="assessment-preset-copy">${preset.cues}</span>
    `;
    button.addEventListener("click", () => {
      setAssessmentDraft({
        ...draft,
        presetId: preset.id,
      });
    });
    assessmentPresetGrid.appendChild(button);
  });
}

function renderAssessmentUploadRollup() {
  if (!assessmentUploadRollup) {
    return;
  }

  const draft = getAssessmentDraft();
  assessmentUploadRollup.replaceChildren();
  assessmentUploadStatus.textContent = assessmentUploadError
    ? assessmentUploadError
    : draft.uploads.length > 0
      ? `${draft.uploads.length} file${draft.uploads.length === 1 ? "" : "s"} added.`
      : "No files yet.";

  draft.uploads.forEach((upload) => {
    const chip = document.createElement("article");
    chip.className = "assessment-upload-chip";
    const safeUploadName = escapeHtml(upload.name || "file");
    const safeUploadHandler = escapeHtml(String(upload.handler || "text").toUpperCase());
    chip.innerHTML = `
      <div class="assessment-upload-chip-copy">
        <strong>${safeUploadName}</strong>
        <span>${safeUploadHandler} • ${upload.compressedCharacters.toLocaleString()} chars</span>
      </div>
    `;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-button assessment-chip-remove";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      const nextDraft = getAssessmentDraft();
      nextDraft.uploads = nextDraft.uploads.filter(
        (item) => item.id !== upload.id,
      );
      setAssessmentDraft(nextDraft);
    });

    chip.appendChild(removeButton);
    assessmentUploadRollup.appendChild(chip);
  });
}

function renderAssessmentSummary() {
  const draft = getAssessmentDraft();
  const summary = summarizeAssessmentProfile(draft);
  const selectedClassMaterialCount = getClassMaterialAssessmentSources().length;
  const currentClassFolder = activeAssessmentClassPath
    ? getFolderAtPath(activeAssessmentClassPath)
    : null;
  const currentClassLabel =
    activeAssessmentSource === "modal"
      ? classCourseInput.value.trim() || "New class"
      : currentClassFolder?.name || "Class";

  if (assessmentLiveSummary && activeAssessmentPanel === "editor") {
    assessmentLiveSummary.textContent = summary.statusText;
  }

  if (assessmentTitle) {
    assessmentTitle.textContent = `${currentClassLabel} assessment formats`;
  }

  if (assessmentBreadcrumbClass) {
    assessmentBreadcrumbClass.textContent = currentClassLabel;
  }

  if (assessmentSummaryPoints) {
    assessmentSummaryPoints.replaceChildren();
    summary.summaryPoints.forEach((point) => {
      const item = document.createElement("p");
      item.className = "assessment-summary-point";
      item.textContent = point;
      assessmentSummaryPoints.appendChild(item);
    });

    if (summary.summaryPoints.length === 0) {
      const item = document.createElement("p");
      item.className = "assessment-summary-point is-empty";
      item.textContent =
        "Process a template and its configured format will appear here.";
      assessmentSummaryPoints.appendChild(item);
    }
  }

  if (assessmentAnalysisStatus) {
    assessmentAnalysisStatus.textContent = isAnalyzingAssessmentProfile
      ? "Processing..."
      : summary.analysis.conciseSummary ||
        (draft.uploads.length > 0 || selectedClassMaterialCount > 0
          ? "Ready to save."
          : "Upload material or select class material.");
  }

  if (assessmentSaveButton) {
    assessmentSaveButton.disabled = isAnalyzingAssessmentProfile;
    assessmentSaveButton.textContent = isAnalyzingAssessmentProfile
      ? "Processing..."
      : "Save & Process";
  }

  if (assessmentAnalyzeButton) {
    assessmentAnalyzeButton.disabled = isAnalyzingAssessmentProfile;
    assessmentAnalyzeButton.textContent = isAnalyzingAssessmentProfile
      ? "Processing..."
      : "Process Template";
  }

  if (assessmentAnalysisInsights) {
    const sections = [
      {
        label: "Format differences",
        values: summary.analysis.genericDifferences,
      },
      {
        label: "Grading cues",
        values: summary.analysis.gradingSignals,
      },
      {
        label: "Question wording",
        values: summary.analysis.wordingPatterns,
      },
      {
        label: "Quiz should match",
        values: summary.analysis.quizAdjustments,
      },
      {
        label: "Cram should match",
        values: summary.analysis.cramAdjustments,
      },
    ].filter((section) => section.values.length > 0);

    assessmentAnalysisInsights.replaceChildren();

    sections.forEach((section) => {
      const block = document.createElement("section");
      block.className = "assessment-analysis-block";
      const title = document.createElement("p");
      title.className = "assessment-analysis-label";
      title.textContent = section.label;
      block.appendChild(title);

      section.values.forEach((value) => {
        const item = document.createElement("p");
        item.className = "assessment-summary-point";
        item.textContent = value;
        block.appendChild(item);
      });
      assessmentAnalysisInsights.appendChild(block);
    });
  }
}

function updateAssessmentConfigCallout() {
  if (!assessmentConfigStatus || !openAssessmentConfigButton) {
    return;
  }

  if (currentModalMode !== "class") {
    openAssessmentConfigButton.disabled = true;
    assessmentConfigStatus.textContent =
      "Assessment profiles are available for classes.";
    return;
  }

  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: currentModalAssessmentProfiles,
    activeAssessmentProfileId: currentModalActiveAssessmentProfileId,
  });
  const summary = summarizeAssessmentProfile(collection.activeProfile);
  openAssessmentConfigButton.disabled = false;
  assessmentConfigStatus.textContent = summary.statusText;
}

function openAssessmentProfileForClassPath(classPath) {
  const resolvedPath = Array.isArray(classPath)
    ? classPath
    : getCurrentClassPath();
  const classFolder = resolvedPath ? getFolderAtPath(resolvedPath) : null;
  if (!classFolder || classFolder.type !== "class") {
    return;
  }

  activeAssessmentSource = "class";
  activeAssessmentClassPath = [...resolvedPath];
  assessmentUploadError = "";
  selectedAssessmentClassMaterialKeys = new Set();
  assessmentClassMaterialSelectionInitialized = false;
  if (assessmentMaterialFile) {
    assessmentMaterialFile.value = "";
  }
  setAssessmentProfileCollection(classFolder);
  setAssessmentPanel("manager");
  setHomeView("assessment");
}

function openAssessmentProfileFromModalDraft() {
  if (currentModalMode !== "class") {
    return;
  }

  const classPath =
    currentModalAction === "edit" && Array.isArray(currentModalTargetPath)
      ? [...currentModalTargetPath]
      : null;
  activeAssessmentSource = classPath ? "class" : "modal";
  activeAssessmentClassPath = classPath;
  assessmentUploadError = "";
  selectedAssessmentClassMaterialKeys = new Set();
  assessmentClassMaterialSelectionInitialized = false;
  if (assessmentMaterialFile) {
    assessmentMaterialFile.value = "";
  }
  classModalBackdrop.hidden = true;
  setAssessmentProfileCollection({
    assessmentProfiles: currentModalAssessmentProfiles,
    activeAssessmentProfileId: currentModalActiveAssessmentProfileId,
  });
  setAssessmentPanel("manager");
  setHomeView("assessment");
}

function closeAssessmentProfileView() {
  const shouldRestoreModal = activeAssessmentSource === "modal";
  activeAssessmentClassPath = null;
  activeAssessmentProfiles = [];
  activeAssessmentProfileId = "";
  activeAssessmentSource = null;
  assessmentUploadError = "";
  selectedAssessmentClassMaterialKeys = new Set();
  assessmentClassMaterialSelectionInitialized = false;
  isAnalyzingAssessmentProfile = false;
  activeAssessmentPanel = "manager";
  if (assessmentMaterialFile) {
    assessmentMaterialFile.value = "";
  }
  setHomeView("dashboard");
  if (shouldRestoreModal) {
    classModalBackdrop.hidden = false;
    updateAssessmentConfigCallout();
  }
}

function syncAssessmentDraftFromInputs() {
  const draft = getAssessmentDraft();
  draft.name = assessmentProfileName?.value.trim() || draft.name;
  draft.customFormat =
    assessmentCustomFormat?.value.trim() || draft.customFormat;
  draft.exampleQuestions = assessmentExampleQuestions
    ? normalizeTestExamples(assessmentExampleQuestions.value)
    : draft.exampleQuestions;
  draft.gradingNotes =
    assessmentGradingNotes?.value.trim() ?? draft.gradingNotes;
  setAssessmentDraft(draft);
}

function switchActiveAssessmentProfile(profileId) {
  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId: profileId,
  });
  activeAssessmentProfileId = collection.activeProfileId;
  const draft = getAssessmentDraft();
  if (assessmentProfileName) {
    assessmentProfileName.value = draft.name || "";
  }
  if (assessmentCustomFormat) {
    assessmentCustomFormat.value = draft.customFormat || "";
  }
  if (assessmentExampleQuestions) {
    assessmentExampleQuestions.value = formatTestExamplesForField(
      draft.exampleQuestions,
    );
  }
  if (assessmentGradingNotes) {
    assessmentGradingNotes.value = draft.gradingNotes || "";
  }
  renderAssessmentProfileSelector();
  renderAssessmentPresetGrid();
  renderAssessmentUploadRollup();
  renderAssessmentClassMaterialPicker();
  renderAssessmentSummary();
}

function createNewAssessmentProfile() {
  const collection = getAssessmentProfileCollectionSummary({
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId,
  });
  const hasOnlyPlaceholder =
    collection.profiles.length === 1 &&
    collection.profiles[0].uploads.length === 0 &&
    !collection.profiles[0].gradingNotes &&
    !collection.profiles[0].customFormat &&
    collection.profiles[0].exampleQuestions.length === 0 &&
    !collection.profiles[0].analysis.conciseSummary;
  const nextProfile = createEmptyAssessmentProfile(
    `Template ${hasOnlyPlaceholder ? 1 : collection.profiles.length + 1}`,
  );
  activeAssessmentProfiles = hasOnlyPlaceholder
    ? [nextProfile]
    : [...collection.profiles, nextProfile];
  switchActiveAssessmentProfile(nextProfile.id);
  setAssessmentPanel("editor");
}

async function analyzeActiveAssessmentProfile() {
  const canUseAi = await ensureAiFeatureAvailable((message) => {
    assessmentUploadError = message;
    renderAssessmentSummary();
  });
  if (!canUseAi) {
    return;
  }

  const draft = getAssessmentDraft();
  const classMaterialSources = getClassMaterialAssessmentSources();
  const uploadedMaterials = [
    ...draft.uploads.map((upload) => ({
      name: upload.name,
      content: upload.content,
      handler: upload.handler,
    })),
    ...classMaterialSources,
  ].slice(0, 12);
  if (uploadedMaterials.length === 0) {
    assessmentUploadError =
      "Upload material or select class material before processing.";
    renderAssessmentSummary();
    return;
  }

  isAnalyzingAssessmentProfile = true;
  assessmentUploadError = "";
  renderAssessmentSummary();

  try {
    const classFolder = activeAssessmentClassPath
      ? getFolderAtPath(activeAssessmentClassPath)
      : null;
    const classId = classFolder?.dbClassId || undefined;
    const preset = getAssessmentPresetById(draft.presetId);
    const analysis = await window.overlayApi.analyzeAssessmentProfile({
      classId,
      profileName: draft.name || null,
      presetLabel: preset?.title || null,
      customFormat: draft.customFormat || null,
      exampleQuestions: draft.exampleQuestions,
      gradingNotes: draft.gradingNotes || null,
      uploadedMaterials,
    });

    setAssessmentDraft({
      ...draft,
      analysis: normalizeAssessmentAnalysis(analysis),
    });
  } catch (error) {
    assessmentUploadError =
      error instanceof Error
        ? formatErrorMessage(error.message)
        : "Could not process this template right now.";
    renderAssessmentSummary();
  } finally {
    isAnalyzingAssessmentProfile = false;
    renderAssessmentSummary();
  }
}

async function saveAssessmentProfile() {
  if (activeAssessmentSource === "modal") {
    const collection = getAssessmentProfileCollectionSummary({
      assessmentProfiles: activeAssessmentProfiles,
      activeAssessmentProfileId,
    });
    currentModalAssessmentProfiles = collection.profiles;
    currentModalActiveAssessmentProfileId = collection.activeProfileId;
    closeAssessmentProfileView();
    return;
  }

  if (!activeAssessmentClassPath) {
    return;
  }

  const classFolder = getFolderAtPath(activeAssessmentClassPath);
  if (!classFolder || classFolder.type !== "class") {
    return;
  }

  const nextClassFolder = decorateClassFolderWithAssessment({
    ...classFolder,
    assessmentProfiles: activeAssessmentProfiles,
    activeAssessmentProfileId,
  });

  let syncedClassFolder = nextClassFolder;

  try {
    const backendResult = await window.overlayApi.saveClassProfile(
      buildClassFolderPayloadForBackend(nextClassFolder, {
        currentUnit:
          currentPath[0] === classFolder.id
            ? buildCurrentUnitPathLabel()
            : null,
        hierarchyNotes:
          currentPath[0] === classFolder.id
            ? buildHierarchyContextNotes()
            : null,
      }),
    );
    syncedClassFolder = {
      ...nextClassFolder,
      dbClassId: backendResult.classProfile.id,
    };
  } catch (error) {
    console.error("Failed to sync assessment profile", error);
  }

  const nextFolders = updateFolderAtPath(
    activeAssessmentClassPath,
    () => syncedClassFolder,
  );
  await persistFolders(nextFolders);
  setAssessmentProfileCollection(syncedClassFolder);
  setAssessmentPanel("manager");
}

async function saveAndProcessAssessmentProfile() {
  syncAssessmentDraftFromInputs();
  const draft = getAssessmentDraft();
  if (
    draft.uploads.length > 0 ||
    getClassMaterialAssessmentSources().length > 0
  ) {
    await analyzeActiveAssessmentProfile();
  }
  await saveAssessmentProfile();
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
  const summaryText =
    typeof session.summary === "string" && session.summary.trim()
      ? extractMarkdownText(session.summary)
      : "";
  const summarySentence =
    summaryText
      ? summaryText.split(/(?<=[.!?])\s+/)[0]
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
  const segments = rawText.match(
    /[A-Za-z0-9][A-Za-z0-9 ,.:;'"()/%&!?+\-]{5,}/g,
  );
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

function openSessionSummary(session) {
  if (!requireSignedIn("view saved sessions")) {
    return;
  }
  sessionSummaryTitle.textContent = session.name || "Session Summary";
  sessionSummaryMeta.textContent = `${Number.isFinite(session.requestCount) ? session.requestCount : 0} request${session.requestCount === 1 ? "" : "s"} • Ended ${formatSessionDate(session.endedAt)}${Array.isArray(session.keyTopics) && session.keyTopics.length > 0 ? ` • ${session.keyTopics.slice(0, 3).join(", ")}` : ""}`;
  sessionSummaryText.innerHTML = renderMarkdown(
    typeof session.summary === "string" && session.summary.trim()
      ? session.summary.trim()
      : "No summary was saved for this session.",
  );
  sessionSummaryBackdrop.hidden = false;
}

function closeSessionSummary() {
  sessionSummaryBackdrop.hidden = true;
}

function resetQuizModalState() {
  activeQuiz = null;
  uploadedQuizMaterial = "";
  uploadedQuizMaterialSummary = "";
  selectedQuizClassMaterialKeys = new Set();
  quizClassMaterialSelectionInitialized = false;
  quizHasBeenChecked = false;
  quizSetupView.hidden = false;
  quizView.hidden = true;
  quizQuestions.replaceChildren();
  quizSubtitle.textContent = "";
  quizMaterialText.value = "";
  quizMaterialFile.value = "";
  quizFileName.textContent = "No file selected";
  quizSourceSummary.checked = true;
  quizSourceNotes.checked = true;
  quizSourceTopics.checked = true;
  quizSourceUploaded.checked = true;
  if (quizAssessmentProfileSelect) {
    quizAssessmentProfileSelect.value = "";
  }
  if (quizAssessmentProfileMeta) {
    quizAssessmentProfileMeta.textContent = "Generic quiz mode.";
  }
  quizGapFocus.value = "50";
  quizGapFocusValue.textContent = "50%";
  quizSubmitButton.textContent = "Check Answers";
  quizSubmitButton.disabled = false;
  saveQuizButton.hidden = true;
  setQuizExplanationFollowScroll(true);
  setQuizExplanationSidebarOpen(false);
  quizExplanationTitle.textContent = "Pick a question";
  quizExplanationAnswer.textContent = "";
  quizExplanationText.textContent = "";
  quizInsights.hidden = true;
  quizStrengths.textContent = "";
  quizGaps.textContent = "";
  if (quizExplainHint) {
    quizExplainHint.textContent =
      "Answer explanations unlock after you check answers.";
  }
  if (quizExplanationToggle) {
    quizExplanationToggle.hidden = true;
    quizExplanationToggle.disabled = true;
  }
  if (quizExplanationFollowToggle) {
    quizExplanationFollowToggle.hidden = true;
    quizExplanationFollowToggle.disabled = true;
  }
  renderQuizClassMaterialPicker();
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

function renderClassAssessmentProfileSelect(
  selectElement,
  classFolder,
  emptyLabel,
) {
  if (!selectElement) {
    return;
  }

  const collection = getClassAssessmentProfiles(classFolder);
  selectElement.replaceChildren();

  const genericOption = document.createElement("option");
  genericOption.value = "";
  genericOption.textContent = emptyLabel;
  selectElement.appendChild(genericOption);

  collection.profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name || "Teacher style";
    selectElement.appendChild(option);
  });

  selectElement.value = collection.activeProfileId || "";
}

function updateQuizAssessmentProfileMeta() {
  if (!quizAssessmentProfileMeta || !activeQuizClassFolder) {
    return;
  }

  const selectedProfile = getSelectedClassAssessmentProfile(
    activeQuizClassFolder,
    quizAssessmentProfileSelect?.value || "",
  );

  if (!quizAssessmentProfileSelect?.value) {
    quizAssessmentProfileMeta.textContent = "Generic quiz mode.";
    return;
  }

  const summary = summarizeAssessmentProfile(selectedProfile);
  quizAssessmentProfileMeta.textContent =
    summary.analysis.conciseSummary ||
    summary.testFormat ||
    "Use this saved teacher format.";
}

/* ── Class material modal ─────────────────────────────────── */

let classMaterialUploads = [];

function normalizeClassMaterialUploads(uploads) {
  if (!Array.isArray(uploads)) {
    return [];
  }

  return uploads
    .filter((upload) => upload && typeof upload === "object")
    .map((upload) => {
      const content =
        typeof upload.content === "string"
          ? upload.content.trim()
          : typeof upload.extractedText === "string"
            ? upload.extractedText.trim()
            : "";

      return {
        name: typeof upload.name === "string" ? upload.name.trim() : "file",
        content,
        handler: typeof upload.handler === "string" ? upload.handler : "text",
        originalCharacters: Number(upload.originalCharacters) || content.length,
        compressedCharacters:
          Number(upload.compressedCharacters) || content.length,
        estimatedTokenSavings: Number(upload.estimatedTokenSavings) || 0,
        addedAt:
          typeof upload.addedAt === "string" && upload.addedAt.trim()
            ? upload.addedAt
            : new Date().toISOString(),
      };
    })
    .filter((upload) => upload.content);
}

function getClassMaterialUploadStatusText(uploadCount) {
  return uploadCount === 0
    ? "No files yet"
    : `${uploadCount} file${uploadCount === 1 ? "" : "s"} loaded`;
}

function getClassMaterialItemForClassFolder(classFolder) {
  if (!classFolder || typeof classFolder !== "object") {
    return null;
  }

  const childMaterial = Array.isArray(classFolder.children)
    ? classFolder.children.find((child) => child?.type === "material")
    : null;
  if (childMaterial) {
    return normalizeClassMaterialItem(childMaterial);
  }

  if (classMaterialHasContent(classFolder.classMaterial)) {
    return normalizeClassMaterialItem(classFolder.classMaterial);
  }

  return null;
}

function getClassMaterialItemForCurrentClass() {
  const classFolder = getCurrentClassFolder();
  if (!classFolder) {
    return null;
  }

  return getClassMaterialItemForClassFolder(classFolder);
}

function getClassMaterialForClassFolder(classFolder) {
  const materialItem = getClassMaterialItemForClassFolder(classFolder);
  return materialItem
    ? {
        text: materialItem.text,
        uploads: materialItem.uploads,
      }
    : { text: "", uploads: [] };
}

function getClassMaterialForCurrentClass() {
  return getClassMaterialForClassFolder(getCurrentClassFolder());
}

function getClassMaterialText() {
  const material = getClassMaterialForCurrentClass();
  if (!material) {
    return "";
  }

  const uploadedText = material.uploads
    .map((upload) => upload.content || "")
    .filter(Boolean)
    .join("\n\n");
  const pastedText = material.text.trim();
  return [uploadedText, pastedText].filter(Boolean).join("\n\n");
}

function buildClassMaterialReferenceKey(sourceType, name, stableId) {
  return `${sourceType}:${stableId || name}`;
}

function getClassMaterialReferenceOptions(
  classFolder = getCurrentClassFolder(),
) {
  const material = getClassMaterialForClassFolder(classFolder);
  const options = material.uploads.map((upload, index) => ({
    key: buildClassMaterialReferenceKey(
      "upload",
      upload.name,
      upload.addedAt || `${upload.name}-${index}`,
    ),
    name: upload.name,
    content: upload.content,
    handler: upload.handler || "text",
    meta: `${(upload.handler || "text").toUpperCase()} • ${upload.content.length.toLocaleString()} chars`,
  }));
  const pastedText = material.text.trim();
  if (pastedText) {
    options.push({
      key: buildClassMaterialReferenceKey(
        "notes",
        "Class Material Notes",
        "notes",
      ),
      name: "Class Material Notes",
      content: pastedText,
      handler: "text",
      meta: `${pastedText.length.toLocaleString()} chars`,
    });
  }

  return options;
}

function syncClassMaterialSelection(
  selectionSet,
  options,
  shouldInitializeAll,
) {
  const validKeys = new Set(options.map((option) => option.key));
  const nextSelection = new Set(
    [...selectionSet].filter((key) => validKeys.has(key)),
  );
  if (shouldInitializeAll) {
    options.forEach((option) => nextSelection.add(option.key));
  }
  return nextSelection;
}

function getSelectedClassMaterialSources(
  selectionSet,
  classFolder = getCurrentClassFolder(),
) {
  const options = getClassMaterialReferenceOptions(classFolder);
  const activeKeys =
    selectionSet instanceof Set
      ? selectionSet
      : new Set(options.map((option) => option.key));
  return options
    .filter((option) => activeKeys.has(option.key))
    .map(({ name, content, handler }) => ({
      name,
      content,
      handler,
    }));
}

function formatSelectedClassMaterialText(
  selectionSet,
  classFolder = getCurrentClassFolder(),
) {
  return getSelectedClassMaterialSources(selectionSet, classFolder)
    .map((source) => `--- ${source.name} ---\n${source.content}`)
    .join("\n\n");
}

function renderClassMaterialReferencePicker({
  container,
  statusElement,
  options,
  selectionSet,
  onToggle,
}) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (options.length === 0) {
    if (statusElement) {
      statusElement.textContent = "None saved yet.";
    }
    return;
  }

  if (statusElement) {
    statusElement.textContent = `${selectionSet.size}/${options.length} selected`;
  }

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "material-reference-option";
    label.classList.toggle("is-selected", selectionSet.has(option.key));

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "material-reference-input";
    input.checked = selectionSet.has(option.key);
    input.addEventListener("change", () => {
      onToggle(option.key, input.checked);
    });

    const check = document.createElement("span");
    check.className = "material-reference-check";
    check.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "material-reference-option-copy";

    const title = document.createElement("span");
    title.className = "material-reference-option-title";
    title.textContent = option.name;

    const meta = document.createElement("span");
    meta.className = "material-reference-option-meta";
    meta.textContent = option.meta || "Saved class material";

    copy.append(title, meta);
    label.append(input, check, copy);
    container.appendChild(label);
  });
}

function getClassMaterialAssessmentSources(
  selectionSet = selectedAssessmentClassMaterialKeys,
  classFolder = activeAssessmentSource === "class" && activeAssessmentClassPath
    ? getFolderAtPath(activeAssessmentClassPath)
    : null,
) {
  return getSelectedClassMaterialSources(selectionSet, classFolder);
}

function renderQuizClassMaterialPicker() {
  const options = getClassMaterialReferenceOptions(activeQuizClassFolder);
  selectedQuizClassMaterialKeys = syncClassMaterialSelection(
    selectedQuizClassMaterialKeys,
    options,
    !quizClassMaterialSelectionInitialized,
  );
  quizClassMaterialSelectionInitialized = true;
  renderClassMaterialReferencePicker({
    container: quizClassMaterialPicker,
    statusElement: quizClassMaterialStatus,
    options,
    selectionSet: selectedQuizClassMaterialKeys,
    onToggle(key, isChecked) {
      if (isChecked) {
        selectedQuizClassMaterialKeys.add(key);
      } else {
        selectedQuizClassMaterialKeys.delete(key);
      }
      renderQuizClassMaterialPicker();
    },
  });
}

function renderCramClassMaterialPicker() {
  const classFolder = getCurrentClassFolder();
  const options = getClassMaterialReferenceOptions(classFolder);
  selectedCramClassMaterialKeys = syncClassMaterialSelection(
    selectedCramClassMaterialKeys,
    options,
    !cramClassMaterialSelectionInitialized,
  );
  cramClassMaterialSelectionInitialized = true;
  renderClassMaterialReferencePicker({
    container: cramClassMaterialPicker,
    statusElement: cramClassMaterialStatus,
    options,
    selectionSet: selectedCramClassMaterialKeys,
    onToggle(key, isChecked) {
      if (isChecked) {
        selectedCramClassMaterialKeys.add(key);
      } else {
        selectedCramClassMaterialKeys.delete(key);
      }
      renderCramClassMaterialPicker();
    },
  });
}

function updateCramAssessmentProfileMeta(classFolder) {
  if (!cramAssessmentProfileMeta) {
    return;
  }

  if (!cramAssessmentProfileSelect?.value) {
    cramAssessmentProfileMeta.textContent = "Generic cram plan.";
    return;
  }

  const selectedProfile = getSelectedClassAssessmentProfile(
    classFolder,
    cramAssessmentProfileSelect.value,
  );
  const summary = summarizeAssessmentProfile(selectedProfile);
  cramAssessmentProfileMeta.textContent =
    summary.analysis.conciseSummary ||
    summary.testFormat ||
    "Use this saved teacher format.";
}

function getCombinedUploadedCramMaterial() {
  return uploadedCramMaterials
    .map(({ name, content }) => `--- ${name} ---\n${content}`)
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
    moreChip.className =
      "cram-upload-rollup-chip cram-upload-rollup-chip-muted";
    moreChip.textContent = `+${uploadedCramMaterials.length - 4} more`;
    cramUploadRollup.appendChild(moreChip);
  }
}

function timeAvailableToMinutes(value) {
  if (value === "30 minutes") {
    return 30;
  }
  if (value === "2 hours") {
    return 120;
  }
  if (value === "All night") {
    return 240;
  }
  return 60;
}

function buildCramDeadlineFromAvailability(value) {
  const minutes = timeAvailableToMinutes(value);
  const deadline = new Date(Date.now() + minutes * 60 * 1000);
  deadline.setSeconds(0, 0);
  return deadline.toISOString().slice(0, 16);
}

function updateCramMaterialCount() {
  const pastedLength = cramMaterialText?.value.trim().length || 0;
  const uploadedLength = uploadedCramMaterials.reduce(
    (total, file) => total + file.content.length,
    0,
  );
  const selectedClassMaterialLength = getSelectedClassMaterialSources(
    selectedCramClassMaterialKeys,
    getCurrentClassFolder(),
  ).reduce((total, source) => total + source.content.length, 0);
  const selectedClassMaterialCount = getSelectedClassMaterialSources(
    selectedCramClassMaterialKeys,
    getCurrentClassFolder(),
  ).length;
  const combinedLength =
    pastedLength + uploadedLength + selectedClassMaterialLength;
  const approxTokens = Math.ceil(combinedLength / 4);
  const hasUploadedMaterial = uploadedCramMaterials.length > 0;
  const hasSelectedClassMaterial = selectedClassMaterialCount > 0;
  const hasUploadError = Boolean(cramMaterialUploadError);
  const overLimit =
    combinedLength > cramConstraintsConfig.maxMaterialCharacters;

  if (cramMaterialCount) {
    cramMaterialCount.textContent = `Approx ${approxTokens.toLocaleString()} tokens loaded`;
  }
  if (cramMaterialStatus) {
    cramMaterialStatus.textContent = hasUploadError
      ? cramMaterialUploadError
      : overLimit
        ? `Too much material. Keep under ${cramConstraintsConfig.maxMaterialCharacters.toLocaleString()} chars.`
        : cramMaterialUploadSummary
          ? cramMaterialUploadSummary
          : hasSelectedClassMaterial
            ? `${selectedClassMaterialCount} class source${selectedClassMaterialCount === 1 ? "" : "s"} selected.`
            : hasUploadedMaterial
              ? `${uploadedCramMaterials.length} file${uploadedCramMaterials.length === 1 ? "" : "s"} loaded.`
              : "Paste or upload material.";
    cramMaterialStatus.dataset.tone =
      hasUploadError || overLimit ? "danger" : "neutral";
  }
  if (generateCramButton) {
    generateCramButton.disabled = isGeneratingCramPlan;
  }

  return { approxTokens };
}

function renderAssessmentClassMaterialPicker() {
  const classFolder = activeAssessmentClassPath
    ? getFolderAtPath(activeAssessmentClassPath)
    : null;
  const options = getClassMaterialReferenceOptions(classFolder);
  selectedAssessmentClassMaterialKeys = syncClassMaterialSelection(
    selectedAssessmentClassMaterialKeys,
    options,
    !assessmentClassMaterialSelectionInitialized,
  );
  assessmentClassMaterialSelectionInitialized = true;
  renderClassMaterialReferencePicker({
    container: assessmentClassMaterialPicker,
    statusElement: assessmentClassMaterialStatus,
    options,
    selectionSet: selectedAssessmentClassMaterialKeys,
    onToggle(key, isChecked) {
      if (isChecked) {
        selectedAssessmentClassMaterialKeys.add(key);
      } else {
        selectedAssessmentClassMaterialKeys.delete(key);
      }
      renderAssessmentClassMaterialPicker();
    },
  });
}

function openClassMaterialModal() {
  const classFolder = getCurrentClassFolder();
  if (!classFolder) {
    return;
  }

  const material = getClassMaterialForCurrentClass();
  classMaterialUploads = [...material.uploads];
  classMaterialModalTitle.textContent = `${classFolder.name || "Class"} Material`;
  classMaterialText.value = material.text;
  classMaterialFile.value = "";
  classMaterialFileStatus.textContent = getClassMaterialUploadStatusText(
    classMaterialUploads.length,
  );
  renderClassMaterialRollup();
  classMaterialBackdrop.hidden = false;
}

function closeClassMaterialModal() {
  classMaterialBackdrop.hidden = true;
  classMaterialUploads = [];
}

function renderClassMaterialRollup() {
  classMaterialRollup.replaceChildren();
  if (classMaterialUploads.length === 0) {
    return;
  }

  for (const upload of classMaterialUploads) {
    const chip = document.createElement("span");
    chip.className = "assessment-upload-rollup-chip";
    const safeUploadName = escapeHtml(upload.name || "file");
    chip.innerHTML = `
      <span class="assessment-upload-rollup-chip-name">${safeUploadName}</span>
      <button class="assessment-upload-rollup-chip-remove" type="button" aria-label="Remove ${safeUploadName}">&times;</button>
    `;
    chip
      .querySelector(".assessment-upload-rollup-chip-remove")
      .addEventListener("click", () => {
        classMaterialUploads = classMaterialUploads.filter((u) => u !== upload);
        classMaterialFileStatus.textContent = getClassMaterialUploadStatusText(
          classMaterialUploads.length,
        );
        renderClassMaterialRollup();
      });
    classMaterialRollup.appendChild(chip);
  }
}

async function handleClassMaterialFileUpload(files) {
  if (!files || files.length === 0) {
    return;
  }

  classMaterialFileStatus.textContent = "Processing...";
  saveClassMaterialButton.disabled = true;

  try {
    const results = await Promise.allSettled(
      Array.from(files).map((file) =>
        extractStudyMaterialFromFiles([file], "quiz"),
      ),
    );
    const successfulFiles = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value[0])
      .filter((result) => result?.content)
      .map((result) => ({
        name: result.name || "file",
        content: result.content,
        handler: result.handler || "text",
        originalCharacters:
          Number(result.originalCharacters) || result.content.length,
        compressedCharacters:
          Number(result.compressedCharacters) || result.content.length,
        estimatedTokenSavings: Number(result.estimatedTokenSavings) || 0,
        addedAt: new Date().toISOString(),
      }));
    const failedCount = results.length - successfulFiles.length;
    classMaterialUploads = [...classMaterialUploads, ...successfulFiles];
    classMaterialFileStatus.textContent =
      failedCount > 0
        ? successfulFiles.length > 0
          ? `Loaded ${successfulFiles.length} file${successfulFiles.length === 1 ? "" : "s"}, but ${failedCount} could not be read.`
          : "No files loaded. Try another file."
        : getClassMaterialUploadStatusText(classMaterialUploads.length);
    renderClassMaterialRollup();
  } catch {
    classMaterialFileStatus.textContent = "Upload failed. Try again.";
  } finally {
    saveClassMaterialButton.disabled = false;
    classMaterialFile.value = "";
  }
}

async function saveClassMaterial() {
  const classPath = getCurrentClassPath();
  if (!classPath) {
    return;
  }

  saveClassMaterialButton.disabled = true;
  saveClassMaterialButton.textContent = "Saving...";

  try {
    const currentMaterialItem = getClassMaterialItemForCurrentClass();
    const timestamp = new Date().toISOString();
    const nextFolders = updateFolderAtPath(classPath, (item) => {
      const nextMaterialItem = normalizeClassMaterialItem({
        ...currentMaterialItem,
        text: classMaterialText.value.trim(),
        uploads: classMaterialUploads,
        updatedAt: timestamp,
        createdAt: currentMaterialItem?.createdAt || timestamp,
      });
      const nextChildren = Array.isArray(item.children)
        ? [...item.children]
        : [];
      const existingIndex = nextChildren.findIndex(
        (child) => child?.type === "material",
      );
      if (existingIndex >= 0) {
        nextChildren[existingIndex] = nextMaterialItem;
      } else {
        nextChildren.unshift(nextMaterialItem);
      }

      const { classMaterial: legacyClassMaterial, ...rest } = item;
      void legacyClassMaterial;
      return {
        ...rest,
        children: nextChildren,
      };
    });
    await persistFolders(nextFolders);
    closeClassMaterialModal();
  } finally {
    saveClassMaterialButton.disabled = false;
    saveClassMaterialButton.textContent = "Save Material";
  }
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
  quizReturnPath = [...currentPath];
  activeQuizContext = "page";
  resetQuizModalState();
  const assessmentSummary = summarizeAssessmentProfile(
    currentClassFolder.assessmentProfile,
  );
  quizModalTitle.textContent = `Quiz: ${currentClassFolder.name || "Class"}`;
  quizSessionMeta.textContent = assessmentSummary.testFormat
    ? `Teacher style: ${assessmentSummary.testFormat}. Pick sessions or add material below.`
    : "Pick any saved sessions from this view, or leave them unchecked to build from broader class context.";
  renderQuizSessionPicker(getCurrentClassSessions());
  renderClassAssessmentProfileSelect(
    quizAssessmentProfileSelect,
    currentClassFolder,
    "Generic practice",
  );
  updateQuizAssessmentProfileMeta();
  setHomeView("quiz");
}

function closeQuizModal() {
  restoreQuizViewToModal();
  currentPath = [...quizReturnPath];
  setHomeView("dashboard");
  renderFolders();
  activeQuizClassFolder = null;
  activeQuiz = null;
  quizHasBeenChecked = false;
  activeQuizContext = "page";
  quizQuestions.parentElement?.classList.remove("has-explanation");
}

function resetCramSetupState() {
  uploadedCramMaterials = [];
  activeCramPlan = null;
  activeCramTaskIndex = 0;
  selectedCramClassMaterialKeys = new Set();
  cramClassMaterialSelectionInitialized = false;
  cramMaterialUploadError = "";
  cramMaterialUploadSummary = "";
  if (cramExamNameInput) {
    cramExamNameInput.value = "";
  }
  if (cramTimeAvailableSelect) {
    cramTimeAvailableSelect.value = "1 hour";
  }
  if (cramAssessmentProfileSelect) {
    cramAssessmentProfileSelect.value = "";
  }
  if (cramAssessmentProfileMeta) {
    cramAssessmentProfileMeta.textContent = "Generic cram plan.";
  }
  if (cramMaterialText) {
    cramMaterialText.value = "";
  }
  if (cramMaterialFile) {
    cramMaterialFile.value = "";
  }
  if (cramFileName) {
    cramFileName.textContent = "No files selected";
  }
  if (cramAdditionalNotes) {
    cramAdditionalNotes.value = "";
  }
  cramStatus.textContent = "";
  cramSetupPanel.hidden = false;
  cramActivePanel.hidden = true;
  cramQuizPanel.hidden = true;
  if (cramPageScreen) {
    cramPageScreen.dataset.cramState = "setup";
  }
  activeCramOverviewPage = 0;
  cramScreenTitle.textContent = "Cram Mode";
  cramScreenMeta.textContent = "";
  renderCramUploadRollup();
  renderCramClassMaterialPicker();
  updateCramMaterialCount();
}

function openCramSetupForCurrentClass() {
  if (!requireSignedIn("create a cram plan")) {
    return;
  }

  const currentClassFolder = getCurrentClassFolder();
  if (!currentClassFolder || currentClassFolder.type !== "class") {
    return;
  }

  activeQuizClassFolder = currentClassFolder;
  activeCramPath = [...currentPath];
  cramReturnPath = [...currentPath];
  resetCramSetupState();
  renderClassAssessmentProfileSelect(
    cramAssessmentProfileSelect,
    currentClassFolder,
    "Generic cram plan",
  );
  cramScreenMeta.textContent = currentClassFolder.name || "Class";
  updateCramAssessmentProfileMeta(currentClassFolder);
  setHomeView("cram");
}

function openSavedCramPlan(plan) {
  if (!requireSignedIn("open cram plans")) {
    return;
  }
  activeQuizClassFolder = getCurrentClassFolder();
  activeCramPlan = plan;
  activeCramTaskIndex = -1;
  activeCramPath = [...currentPath, plan.id];
  cramReturnPath = [...currentPath];
  restoreQuizViewToModal();
  activeQuizContext = "page";
  renderCramPlan(plan);
  setHomeView("cram");
  void hydrateMissingCramQuizzes();
}

function getCramProgress(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [];
  if (tasks.length === 0) {
    return { done: 0, total: 0, percent: 0 };
  }
  const done = tasks.filter((task) => task.status === "done").length;
  return {
    done,
    total: tasks.length,
    percent: Math.round((done / tasks.length) * 100),
  };
}

function getNextCramTask(plan) {
  return (plan?.tasks || []).find((task) => task.status !== "done") || null;
}

function formatCramDeadline(value) {
  if (!value) {
    return "No deadline";
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

function priorityLabel(priority) {
  if (priority === "quick-win") {
    return "Quick win";
  }
  if (priority === "if-time") {
    return "If time";
  }
  return "Must review";
}

function statusLabel(status) {
  if (status === "done") {
    return "Done";
  }
  if (status === "reviewing") {
    return "Reviewing";
  }
  if (status === "quiz") {
    return "Quiz";
  }
  return "Not started";
}

function buildCramProgress(plan) {
  const progress = getCramProgress(plan);
  return {
    ...progress,
    nextTaskTitle: getNextCramTask(plan)?.title || "Plan complete",
  };
}

function clampCramTaskIndex(plan, index) {
  const total = Array.isArray(plan?.tasks) ? plan.tasks.length : 0;
  if (total === 0) {
    return -1;
  }
  if (!Number.isFinite(index)) {
    return -1;
  }
  return Math.min(Math.max(index, -1), total - 1);
}

function getRecommendedCramTaskIndex(plan) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [];
  if (tasks.length === 0) {
    return -1;
  }

  const nextUndoneIndex = tasks.findIndex((task) => task.status !== "done");
  if (nextUndoneIndex >= 0) {
    return nextUndoneIndex;
  }

  return 0;
}

function scrollCramViewToTop() {
  if (cramTaskDetail instanceof HTMLElement) {
    cramTaskDetail.scrollTop = 0;
  }
  if (cramPageScreen instanceof HTMLElement) {
    cramPageScreen.scrollTop = 0;
  }
  if (document.scrollingElement instanceof HTMLElement) {
    document.scrollingElement.scrollTop = 0;
  }
  window.scrollTo(0, 0);
}

function openCramOverview() {
  activeCramTaskIndex = -1;
  activeCramOverviewPage = 0;
  if (activeCramPlan) {
    renderCramPlan(activeCramPlan);
    scrollCramViewToTop();
  }
}

function openCramOverviewPage(page) {
  activeCramTaskIndex = -1;
  activeCramOverviewPage = Math.max(0, Math.min(page, 1));
  if (activeCramPlan) {
    renderCramPlan(activeCramPlan);
    scrollCramViewToTop();
  }
}

function openCramTask(index) {
  if (!activeCramPlan) {
    return;
  }
  activeCramTaskIndex = clampCramTaskIndex(activeCramPlan, index);
  renderCramPlan(activeCramPlan);
  scrollCramViewToTop();
}

function openNextCramStep() {
  if (!activeCramPlan) {
    return;
  }

  if (activeCramTaskIndex < 0) {
    if (activeCramOverviewPage === 0) {
      openCramOverviewPage(1);
      return;
    }
    openCramTask(getRecommendedCramTaskIndex(activeCramPlan));
    return;
  }

  if (activeCramTaskIndex >= (activeCramPlan.tasks?.length || 0) - 1) {
    openCramOverview();
    return;
  }

  openCramTask(activeCramTaskIndex + 1);
}

function openPreviousCramStep() {
  if (!activeCramPlan) {
    return;
  }
  if (activeCramTaskIndex <= 0) {
    if (activeCramTaskIndex < 0) {
      openCramOverviewPage(Math.max(0, activeCramOverviewPage - 1));
    } else {
      openCramOverviewPage(1);
    }
    return;
  }
  openCramTask(activeCramTaskIndex - 1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(source) {
  const codeSpans = [];
  const withCodePlaceholders = String(source ?? "").replace(
    /`([^`]+)`/g,
    (_match, code) => {
      const placeholder = `@@CODE${codeSpans.length}@@`;
      codeSpans.push(`<code>${escapeHtml(code)}</code>`);
      return placeholder;
    },
  );

  const rendered = escapeHtml(withCodePlaceholders)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return rendered.replace(/@@CODE(\d+)@@/g, (_match, indexText) => {
    return codeSpans[Number(indexText)] || "";
  });
}

function renderMarkdown(source) {
  const normalized = String(source ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "";
  }

  const lines = normalized.split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listType = null;
  let listItems = [];
  let blockquoteLines = [];
  let inCodeFence = false;
  let codeFenceLanguage = "";
  let codeFenceLines = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }

    blocks.push(
      `<${listType}>${listItems
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join("")}</${listType}>`,
    );
    listType = null;
    listItems = [];
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length === 0) {
      return;
    }

    blocks.push(
      `<blockquote>${blockquoteLines
        .map((line) => `<p>${renderInlineMarkdown(line)}</p>`)
        .join("")}</blockquote>`,
    );
    blockquoteLines = [];
  };

  const flushCodeFence = () => {
    blocks.push(
      `<pre><code${codeFenceLanguage ? ` data-language="${escapeHtml(codeFenceLanguage)}"` : ""}>${escapeHtml(codeFenceLines.join("\n"))}</code></pre>`,
    );
    inCodeFence = false;
    codeFenceLanguage = "";
    codeFenceLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (inCodeFence) {
      if (trimmed.startsWith("```")) {
        flushCodeFence();
      } else {
        codeFenceLines.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      flushBlockquote();
      inCodeFence = true;
      codeFenceLanguage = trimmed.slice(3).trim();
      codeFenceLines = [];
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = headingMatch[1].length;
      blocks.push(
        `<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`,
      );
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      blocks.push("<hr>");
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushBlockquote();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushBlockquote();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(orderedMatch[1]);
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushBlockquote();
  if (inCodeFence) {
    flushCodeFence();
  }

  return blocks.join("");
}

function extractMarkdownText(source) {
  const scratch = document.createElement("div");
  scratch.innerHTML = renderMarkdown(source);
  return scratch.textContent.replace(/\s+/g, " ").trim();
}

function renderInlineCramText(value) {
  return renderInlineMarkdown(value);
}

function renderCramTakeaways(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `
    <ul class="cram-list">
      ${items
        .map(
          (item) =>
            `<li class="cram-list-item">${renderInlineCramText(item)}</li>`,
        )
        .join("")}
    </ul>
  `;
}

function renderCramStudyGuide(task) {
  if (!task) {
    return "";
  }

  const topic = task.topic || task.title || "this topic";
  const takeawayA =
    Array.isArray(task.keyTakeaways) && task.keyTakeaways[0]
      ? task.keyTakeaways[0]
      : `Explain ${topic} without looking at your notes.`;
  const takeawayB =
    Array.isArray(task.keyTakeaways) && task.keyTakeaways[1]
      ? task.keyTakeaways[1]
      : `Work one clean example that shows how ${topic} appears on an exam.`;

  return `
    <div class="cram-study-guide-markdown">
      <p class="cram-study-guide-intro">
        Use this section to learn the rule, the method, and one reproducible example.
      </p>
      <ul class="cram-study-guide-points">
        <li><strong>Rule:</strong> Understand ${escapeHtml(topic)} in plain language and why it matters on tests.</li>
        <li><strong>Method:</strong> For questions on ${escapeHtml(topic)}, follow the standard process step-by-step.</li>
        <li><strong>Key point:</strong> ${renderInlineCramText(takeawayA)}</li>
        <li><strong>Example:</strong> ${renderInlineCramText(takeawayB)}</li>
      </ul>
    </div>
  `;
}

function renderCramPlan(plan) {
  activeCramPlan = plan;
  activeCramTaskIndex = clampCramTaskIndex(plan, activeCramTaskIndex);
  cramSetupPanel.hidden = true;
  cramActivePanel.hidden = false;
  cramQuizPanel.hidden = true;
  if (cramPageScreen) {
    cramPageScreen.dataset.cramState = "guide";
  }
  cramScreenTitle.textContent = "Study Guide";
  cramScreenMeta.textContent = [
    plan.name || "Cram Plan",
    formatCramDeadline(plan.deadline),
    `${plan.availableMinutes || 0} min`,
  ].join(" - ");

  const progress = getCramProgress(plan);
  cramProgressValue.textContent = `${progress.done}/${progress.total} done`;
  cramProgressCopy.textContent = `${progress.total} sections · ${plan.availableMinutes || 0} min · ${getNextCramTask(plan)?.title || "Review complete"}`;
  cramTaskList.replaceChildren();

  const timelineNodes = 1 + (plan.tasks?.length || 0);
  cramTaskList.style.gridTemplateColumns = `repeat(${timelineNodes}, minmax(0, 1fr))`;

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className =
    "cram-task-button cram-task-timeline-button cram-task-start-button";
  startButton.dataset.active = activeCramTaskIndex < 0 ? "true" : "false";
  startButton.dataset.tooltip =
    "Overview of your generated guide. Start here, then move through each numbered checkpoint.";
  startButton.title = "Overview of your generated guide.";
  startButton.setAttribute("aria-label", "Start. Overview of your generated guide.");
  startButton.innerHTML = `
    <span class="cram-task-timeline-label">Start</span>
  `;
  startButton.addEventListener("click", () => {
    openCramOverview();
  });
  cramTaskList.appendChild(startButton);

  (plan.tasks || []).forEach((task, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cram-task-button cram-task-timeline-button";
    button.dataset.active = index === activeCramTaskIndex ? "true" : "false";
    button.dataset.status = task.status || "not-started";
    button.dataset.hasQuiz = task.quizEnabled ? "true" : "false";
    button.dataset.tooltip = `${task.title}: ${task.body || task.quizPreview?.description || task.topic}`;
    button.title = task.title;
    button.setAttribute("aria-label", `${index + 1}. ${task.title}. ${task.body || task.topic}`);
    button.innerHTML = `
      <span class="cram-task-timeline-label">${index + 1}</span>
    `;
    button.addEventListener("click", () => {
      openCramTask(index);
    });
    cramTaskList.appendChild(button);
  });

  renderCramTaskDetail(
    activeCramTaskIndex >= 0 ? plan.tasks?.[activeCramTaskIndex] : null,
  );
}

function renderCramTaskDetail(task) {
  cramTaskDetail.replaceChildren();
  if (!activeCramPlan) {
    cramTaskDetail.textContent = "No study guide loaded.";
    return;
  }

  if (!task) {
    const recommendedTask =
      activeCramPlan.tasks?.[getRecommendedCramTaskIndex(activeCramPlan)] || null;
    const progress = getCramProgress(activeCramPlan);
    const summaryText =
      activeCramPlan.summary ||
      "Your guide is ready. Move through the timeline, study one section at a time, and use the quiz checkpoints to test recall.";
    const sourceText = "Built from your selected study material.";
    const sections = Array.isArray(activeCramPlan.tasks) ? activeCramPlan.tasks : [];
    const highlights = sections.slice(0, 3);

    if (activeCramOverviewPage === 0) {
      cramTaskDetail.innerHTML = `
      <div class="cram-guide-overview cram-guide-overview-centered">
        <div class="cram-overview-hero">
          <p class="cram-guide-kicker">Study guide ready</p>
          <h3 class="cram-guide-hero-title">Your study guide is generated.</h3>
            <p class="cram-guide-summary">${renderInlineCramText(summaryText)}</p>
            <div class="cram-overview-meta-row">
              <span class="cram-overview-meta-pill">${progress.total} sections</span>
              <span class="cram-overview-meta-pill">${activeCramPlan.availableMinutes || 0} min</span>
              <span class="cram-overview-meta-pill">${renderInlineCramText(recommendedTask?.title || "Review complete")}</span>
            </div>
          </div>
          <div class="cram-overview-summary">
            <div class="cram-overview-summary-row">
              <span class="cram-overview-label">First move</span>
              <div class="cram-overview-summary-copy">
                <strong>${renderInlineCramText(recommendedTask?.title || "Review complete")}</strong>
                <p class="panel-help">${
                  renderInlineCramText(
                    recommendedTask?.body ||
                      "Every section is complete. Reopen any numbered step from the timeline to review it again.",
                  )
                }</p>
              </div>
            </div>
            <div class="cram-overview-summary-row">
              <span class="cram-overview-label">Plan</span>
              <p class="panel-help">${renderInlineCramText(sourceText)}</p>
            </div>
          </div>
          <div class="cram-task-actions cram-task-actions-inline">
            <button id="cram-overview-next" class="continue-button" type="button">See coverage</button>
          </div>
        </div>
      `;

      cramTaskDetail
        .querySelector("#cram-overview-next")
        ?.addEventListener("click", () => {
          openNextCramStep();
        });
      return;
    }

    cramTaskDetail.innerHTML = `
      <div class="cram-guide-overview cram-guide-overview-secondary">
        <div class="cram-overview-hero">
          <p class="cram-guide-kicker">What this guide covers</p>
          <h3 class="cram-guide-hero-title cram-guide-hero-title-secondary">What you'll work through</h3>
          <p class="cram-guide-summary">
            This guide moves from the core ideas into the highest-yield checkpoints, then finishes with quicker review items and quiz checks.
          </p>
        </div>
        <ol class="cram-coverage-list">
          ${highlights
            .map(
              (item, index) => `
            <li class="cram-coverage-item">
              <span class="cram-coverage-step">0${index + 1}</span>
              <div class="cram-coverage-copy">
                <strong>${renderInlineCramText(item.title)}</strong>
                <p class="panel-help">${renderInlineCramText(item.body)}</p>
              </div>
            </li>
          `,
            )
            .join("")}
        </ol>
        ${
          recommendedTask
            ? `
          <div class="cram-coverage-focus">
            <span class="cram-overview-label">Start with</span>
            <div class="cram-coverage-focus-copy">
              <strong>${renderInlineCramText(recommendedTask.title)}</strong>
              ${renderCramTakeaways(recommendedTask.keyTakeaways || [])}
            </div>
          </div>
        `
            : ""
        }
        <div class="cram-task-actions cram-task-actions-grid cram-overview-actions-grid">
          <button id="cram-overview-back" class="ghost-button" type="button">Back</button>
          <button id="cram-overview-next" class="continue-button" type="button">Begin section 1</button>
        </div>
      </div>
    `;

    cramTaskDetail
      .querySelector("#cram-overview-back")
      ?.addEventListener("click", () => {
        openPreviousCramStep();
      });
    cramTaskDetail
      .querySelector("#cram-overview-next")
      ?.addEventListener("click", () => {
        openNextCramStep();
      });
    return;
  }

  const scoreText = task.lastScore
    ? `Last quiz: ${task.lastScore.correct}/${task.lastScore.total}`
    : "Quiz not taken yet";
  const sourceText = "Built from your selected study material.";
  const quizPreview = task.quizPreview || {
    title: `${task.topic} quiz preview`,
    description:
      "Open the saved checkpoint for this section and test recall before moving on.",
    questionCount: 3,
  };
  const totalTasks = activeCramPlan.tasks?.length || 0;
  const isLastTask = activeCramTaskIndex >= totalTasks - 1;
  const quizStatus =
    task.quizStatus ||
    (task.quizEnabled ? (task.quizId ? "ready" : "preparing") : "not-needed");
  const checkpointStatusText =
    quizStatus === "failed"
      ? "Unavailable"
      : task.quizId
        ? "Saved checkpoint"
        : "Preparing checkpoint";
  const checkpointActionText =
    quizStatus === "failed"
      ? "Not ready"
      : task.quizId
        ? "Open saved quiz"
        : "Building quiz";
  const checkpointDetailText =
    quizStatus === "failed"
      ? "This guide section could not finish its quiz build."
      : task.quizId
        ? scoreText
        : "This checkpoint was requested when the guide was created and is still being prepared.";

  cramTaskDetail.innerHTML = `
    <div class="cram-task-detail-header">
      <div>
        <p class="cram-task-page-kicker">Section ${activeCramTaskIndex + 1} of ${totalTasks}</p>
        <h3 class="cram-task-detail-title">${renderInlineCramText(task.title)}</h3>
        <p class="panel-help">${renderInlineCramText(task.topic)} - ${task.estimatedMinutes || 0} min</p>
      </div>
      <span class="cram-priority">${priorityLabel(task.priority)}</span>
    </div>
    <p class="cram-task-source">${renderInlineCramText(sourceText)}</p>
    <div class="cram-study-guide-layout">
      <div class="cram-study-guide-main">
        <p class="cram-study-guide-label">Study guide</p>
        ${renderCramStudyGuide(task)}
        <section class="cram-study-guide-card cram-study-guide-takeaways-card">
          <p class="cram-study-guide-label">Key takeaways</p>
          ${renderCramTakeaways(task.keyTakeaways)}
        </section>
      </div>
      <aside class="cram-study-guide-aside">
        <section class="cram-study-guide-section">
          <p class="cram-study-guide-label">Study focus</p>
          <p class="cram-task-body">${renderInlineCramText(task.body)}</p>
        </section>
        <section class="cram-study-guide-section">
          <p class="cram-study-guide-label">Vocab to know</p>
          ${renderCramTakeaways(task.vocabToKnow)}
        </section>
      </aside>
    </div>
    ${
      task.quizEnabled
        ? `
      <button id="cram-task-quiz" class="cram-quiz-preview" type="button">
        <span class="cram-quiz-preview-header">
          <span class="cram-quiz-preview-kicker">Checkpoint</span>
          <span class="cram-quiz-preview-meta">${quizPreview.questionCount || 3} questions · ${checkpointStatusText}</span>
        </span>
        <span class="cram-quiz-preview-title">${renderInlineCramText(quizPreview.title)}</span>
        <span class="cram-quiz-preview-copy">${renderInlineCramText(quizPreview.description)}</span>
        <span class="cram-quiz-preview-grid">
          <span class="cram-quiz-preview-stat">
            <span class="cram-quiz-preview-stat-label">Topic</span>
            <strong>${renderInlineCramText(task.topic)}</strong>
          </span>
          <span class="cram-quiz-preview-stat">
            <span class="cram-quiz-preview-stat-label">Questions</span>
            <strong>${quizPreview.questionCount || 3}</strong>
          </span>
          <span class="cram-quiz-preview-stat">
            <span class="cram-quiz-preview-stat-label">Status</span>
            <strong>${renderInlineCramText(checkpointStatusText)}</strong>
          </span>
        </span>
        <span class="cram-quiz-preview-surface">
          <span class="quiz-results-bar cram-quiz-preview-bar">
            <span>
              <span class="material-reference-label">Saved quiz</span>
              <strong class="cram-quiz-preview-surface-title">${renderInlineCramText(task.topic)}</strong>
            </span>
            <span class="quiz-gap-value">${checkpointActionText}</span>
          </span>
          <span class="quiz-insights cram-quiz-preview-insights">
            <span class="quiz-insight-card cram-quiz-preview-panel">
              <strong>What you'll check</strong>
              <small>${renderInlineCramText(task.keyTakeaways?.[0] || task.body)}</small>
            </span>
            <span class="quiz-insight-card cram-quiz-preview-panel">
              <strong>${
                quizStatus === "failed"
                  ? "Checkpoint unavailable"
                  : task.quizId
                    ? "Saved checkpoint"
                    : "Checkpoint preparing"
              }</strong>
              <small>${renderInlineCramText(checkpointDetailText)}</small>
            </span>
          </span>
          <span class="cram-quiz-preview-footer">Open this checkpoint after you can explain the section without looking.</span>
        </span>
      </button>
    `
        : `
      <div class="cram-quiz-checkpoint">
        <div>
          <strong>No quiz needed here</strong>
          <p class="panel-help">Keep this section as a quick reference and move on once it feels solid.</p>
        </div>
      </div>
    `
    }
    <div class="cram-task-actions cram-task-actions-grid">
      <button id="cram-step-back" class="ghost-button" type="button">${
        activeCramTaskIndex === 0 ? "Overview" : "Previous"
      }</button>
      <button id="cram-mark-reviewing" class="ghost-button" type="button">Reviewing</button>
      <button id="cram-mark-done" class="ghost-button" type="button">Done</button>
      <button id="cram-step-next" class="continue-button" type="button">${
        isLastTask ? "Finish Guide" : "Next"
      }</button>
    </div>
  `;

  cramTaskDetail
    .querySelector("#cram-step-back")
    ?.addEventListener("click", () => {
      openPreviousCramStep();
    });
  cramTaskDetail
    .querySelector("#cram-step-next")
    ?.addEventListener("click", () => {
      openNextCramStep();
    });
  cramTaskDetail
    .querySelector("#cram-mark-reviewing")
    ?.addEventListener("click", async () => {
      await updateActiveCramTask({ status: "reviewing" });
    });
  cramTaskDetail
    .querySelector("#cram-mark-done")
    ?.addEventListener("click", async () => {
      await updateActiveCramTask({ status: "done" });
    });
  cramTaskDetail
    .querySelector("#cram-task-quiz")
    ?.addEventListener("click", async () => {
      await launchCramTaskQuiz(task);
    });
}

function buildCramPlanEntry(response, values) {
  const tasks = response.tasks.map((task) => ({
    ...task,
    body: task.body || task.title,
    keyTakeaways:
      Array.isArray(task.keyTakeaways) && task.keyTakeaways.length > 0
        ? task.keyTakeaways
        : [`Review ${task.topic}.`, "Turn this into active recall before moving on."],
    vocabToKnow:
      Array.isArray(task.vocabToKnow) && task.vocabToKnow.length > 0
        ? task.vocabToKnow
        : [
            task.topic || "core idea",
            `Key idea from ${task.topic || task.title || "this section"}`,
          ],
    status: task.status || "not-started",
    quizEnabled: task.quizEnabled !== false,
    quizPreview:
      task.quizEnabled === false
        ? null
        : {
            title:
              task.quizPreview?.title || `${task.topic} quiz preview`,
            description:
              task.quizPreview?.description ||
              "Open the saved checkpoint for this study section and test recall before moving on.",
            questionCount: task.quizPreview?.questionCount || 3,
          },
    quizId: task.quizId || null,
    quizStatus:
      task.quizEnabled === false ? "not-needed" : task.quizId ? "ready" : "preparing",
    lastScore: task.lastScore || null,
  }));
  const plan = {
    id: makeId(),
    type: "cramPlan",
    name: values.name || "Cram Plan",
    createdAt: new Date().toISOString(),
    deadline: values.deadline,
    availableMinutes: values.availableMinutes,
    sourceSummary: response.sourceSummary || response.summary,
    summary: response.summary,
    estimatedTotalMinutes: response.estimatedTotalMinutes,
    recommendedFirstTask: response.recommendedFirstTask,
    sessionIds: values.sessionIds,
    uploadedMaterial: values.uploadedMaterial,
    currentUnit: values.currentUnit,
    gapFocus: values.gapFocus,
    tasks,
    progress: buildCramProgress({ tasks }),
    linkedQuizIds: [],
  };
  plan.progress = buildCramProgress(plan);
  return plan;
}

async function generateCramPlanForCurrentClass() {
  if (!requireSignedIn("generate cram plans")) {
    return;
  }

  const canUseAi = await ensureAiFeatureAvailable((message) => {
    cramStatus.textContent = message;
  });
  if (!canUseAi) {
    return;
  }

  const classFolder = getCurrentClassFolder();
  if (!classFolder) {
    return;
  }

  const examName = cramExamNameInput?.value.trim() || "";
  if (!examName) {
    cramExamNameInput?.focus();
    return;
  }

  const dbClassId = await ensureBackendClassId(classFolder);
  const pastedMaterial = cramMaterialText?.value.trim() || "";
  const selectedClassMaterial = formatSelectedClassMaterialText(
    selectedCramClassMaterialKeys,
    classFolder,
  );
  const uploadedMaterial = [
    selectedClassMaterial,
    getCombinedUploadedCramMaterial().trim(),
    pastedMaterial,
  ]
    .filter(Boolean)
    .join("\n\n");
  const materialValidation = validateCramMaterialPayload(uploadedMaterial);
  if (!materialValidation.ok) {
    if (cramMaterialStatus) {
      cramMaterialStatus.dataset.tone = "danger";
      cramMaterialStatus.textContent = materialValidation.message;
    }
    cramMaterialText?.focus();
    return;
  }

  const selectedAssessmentProfile = cramAssessmentProfileSelect?.value
    ? getSelectedClassAssessmentProfile(
        classFolder,
        cramAssessmentProfileSelect.value,
      )
    : null;
  const sessionIds = getCurrentClassSessions()
    .map((session) => Number(session.dbSessionId))
    .filter((value) => Number.isFinite(value));
  const availableMinutes = timeAvailableToMinutes(
    cramTimeAvailableSelect?.value || "1 hour",
  );
  const values = {
    name: examName,
    deadline: buildCramDeadlineFromAvailability(
      cramTimeAvailableSelect?.value || "1 hour",
    ),
    availableMinutes,
    uploadedMaterial: materialValidation.normalizedMaterial,
    currentUnit: buildCurrentUnitPathLabel(),
    additionalNotes: cramAdditionalNotes?.value.trim() || null,
    gapFocus: 50,
    sessionIds,
  };

  if (generateCramButton) {
    generateCramButton.disabled = true;
    generateCramButton.textContent = "Generating...";
  }
  cramStatus.textContent = "Building plan...";

  try {
    const response = await window.overlayApi.generateCramPlanFromSessions({
      classId: dbClassId,
      sessionIds,
      examName,
      deadline: values.deadline,
      availableMinutes: values.availableMinutes,
      uploadedMaterial: values.uploadedMaterial,
      additionalNotes: values.additionalNotes,
      currentUnit: values.currentUnit,
      gapFocus: values.gapFocus,
      teacherAssessmentProfile: selectedAssessmentProfile
        ? getTeacherAssessmentProfilePayload(selectedAssessmentProfile)
        : null,
    });
    let plan = buildCramPlanEntry(response, values);
    cramStatus.textContent = "Building guide and quiz checkpoints...";
    plan = await prebuildCramTaskQuizzes(plan, dbClassId, activeCramPath);
    const nextChildren = [plan, ...getCurrentClassItems()];
    const nextFolders = replaceChildrenAtPath(activeCramPath, nextChildren);
    await persistFolders(nextFolders);
    activeCramTaskIndex = -1;
    activeCramOverviewPage = 0;
    activeCramPath = [...activeCramPath, plan.id];
    activeCramPlan = plan;
    renderCramPlan(plan);
  } catch (error) {
    cramStatus.textContent =
      error instanceof Error ? formatErrorMessage(error.message) : "Cram plan failed.";
  } finally {
    if (generateCramButton) {
      generateCramButton.disabled = false;
      generateCramButton.textContent = "Generate Plan";
    }
  }
}

function showQuizExplanation(question, index) {
  if (!question || !quizHasBeenChecked) {
    return;
  }

  if (
    activeQuizExplanationIndex === index &&
    quizExplanationPanel &&
    !quizExplanationPanel.hidden
  ) {
    activeQuizExplanationIndex = null;
    setQuizExplanationSidebarOpen(false);
    return;
  }

  activeQuizExplanationIndex = index;
  setQuizExplanationSidebarOpen(true);
  quizExplanationTitle.textContent = `Question ${index + 1}`;
  quizExplanationAnswer.textContent = `Correct answer: ${question.options[question.correctIndex]}`;
  quizExplanationText.textContent = question.explanation;
  updateExplainButtons();
}

function setQuizExplanationFollowScroll(isEnabled) {
  quizExplanationFollowScroll = Boolean(isEnabled);
  quizExplanationPanel.classList.toggle(
    "is-follow-scroll-off",
    !quizExplanationFollowScroll,
  );

  if (!quizExplanationFollowToggle) {
    return;
  }

  quizExplanationFollowToggle.textContent = quizExplanationFollowScroll
    ? "Follow Scroll: On"
    : "Follow Scroll: Off";
  quizExplanationFollowToggle.setAttribute(
    "aria-pressed",
    quizExplanationFollowScroll ? "true" : "false",
  );
}

function setQuizExplanationSidebarOpen(isOpen) {
  quizExplanationPanel.hidden = !isOpen;
  quizQuestions.parentElement?.classList.toggle("has-explanation", isOpen);

  if (!isOpen) {
    activeQuizExplanationIndex = null;
  }

  if (!quizExplanationToggle) {
    updateExplainButtons();
    return;
  }

  quizExplanationToggle.textContent = isOpen
    ? "Hide Explanation"
    : "Show Explanation";
  quizExplanationToggle.setAttribute("aria-pressed", isOpen ? "true" : "false");
  updateExplainButtons();
}

function loadQuizIntoView(quiz, options = {}) {
  activeQuiz = quiz;
  quizHasBeenChecked = false;
  activeQuizExplanationIndex = null;
  setQuizExplanationFollowScroll(true);
  quizSubtitle.textContent = quiz.subtitle;
  renderQuizQuestions(quiz);
  quizSetupView.hidden = true;
  quizView.hidden = false;
  quizSubmitButton.disabled = Boolean(options.readOnly);
  quizSubmitButton.hidden = Boolean(options.readOnly);
  saveQuizButton.hidden = Boolean(options.hideSave);
  setQuizExplanationSidebarOpen(false);
  if (quizExplanationToggle) {
    quizExplanationToggle.hidden = true;
    quizExplanationToggle.disabled = true;
  }
  if (quizExplanationFollowToggle) {
    quizExplanationFollowToggle.hidden = true;
    quizExplanationFollowToggle.disabled = true;
  }
}

function updateExplainButtons() {
  quizQuestions.querySelectorAll(".quiz-explain-button").forEach((button) => {
    const buttonIndex = Number(button.dataset.questionIndex);
    const isActive =
      quizHasBeenChecked &&
      activeQuizExplanationIndex === buttonIndex &&
      !quizExplanationPanel.hidden;
    button.disabled = !quizHasBeenChecked;
    button.classList.toggle("is-locked", !quizHasBeenChecked);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.textContent = isActive ? "Hide Answer" : "Explain Answer";
  });
}

function openSavedQuiz(quizItem) {
  if (!requireSignedIn("open saved quizzes")) {
    return;
  }
  if (quizItem.status === "processing" || quizItem.status === "failed") {
    return;
  }
  restoreQuizViewToModal();
  activeQuizContext = "page";
  activeQuizClassFolder = getCurrentClassFolder();
  quizReturnPath = [...currentPath];
  resetQuizModalState();
  quizModalTitle.textContent = quizItem.name || "Saved Quiz";
  quizSessionMeta.textContent = `${quizItem.questionCount || 0} questions • Saved ${formatSessionDate(quizItem.createdAt)}`;
  loadQuizIntoView(quizItem.quizData, {
    readOnly: false,
    hideSave: true,
  });
  setHomeView("quiz");
}

function buildProcessingQuizEntry(options = {}) {
  return {
    id: makeId(),
    type: "quiz",
    name: options.name || "Quiz - Processing",
    status: "processing",
    createdAt: new Date().toISOString(),
    questionCount: 0,
    summary: options.summary || "Generating quiz",
    quizData: null,
  };
}

async function addQuizEntryToExplorer(entry, targetPath = currentPath) {
  const targetNode = getFolderAtPath(targetPath);
  const targetChildren = targetNode ? targetNode.children || [] : folders;
  const nextChildren = [entry, ...targetChildren];
  const nextFolders = replaceChildrenAtPath(targetPath, nextChildren);
  await persistFolders(nextFolders);
}

async function updateQuizEntryInExplorer(
  entryId,
  transform,
  targetPath = currentPath,
) {
  const targetNode = getFolderAtPath(targetPath);
  const targetChildren = targetNode ? targetNode.children || [] : folders;
  const nextChildren = targetChildren.map((item) =>
    item.id === entryId ? transform(item) : item,
  );
  const nextFolders = replaceChildrenAtPath(targetPath, nextChildren);
  await persistFolders(nextFolders);
}

async function saveActiveQuizToExplorer() {
  if (!requireSignedIn("save quizzes")) {
    return;
  }
  if (!activeQuiz || !activeQuizClassFolder) {
    return;
  }

  await saveQuizToExplorer(activeQuiz, currentPath);
  saveQuizButton.hidden = true;
}

async function saveQuizToExplorer(quiz, targetPath) {
  const nextQuizEntry = {
    id: makeId(),
    type: "quiz",
    name: quiz.title || "Saved Quiz",
    createdAt: new Date().toISOString(),
    questionCount: quiz.questions.length,
    summary: quiz.subtitle,
    quizData: quiz,
  };

  saveQuizButton.hidden = true;
  const targetNode = getFolderAtPath(targetPath);
  const targetChildren = targetNode ? targetNode.children || [] : folders;
  const nextChildren = [nextQuizEntry, ...targetChildren];
  const nextFolders = replaceChildrenAtPath(targetPath, nextChildren);
  await persistFolders(nextFolders);
  return nextQuizEntry;
}

function getQuizEntryFromPath(targetPath, quizId) {
  if (!quizId) {
    return null;
  }
  const targetNode = getFolderAtPath(targetPath);
  const targetChildren = targetNode ? targetNode.children || [] : folders;
  return (
    targetChildren.find(
      (item) => item?.type === "quiz" && item.id === quizId && item.quizData,
    ) || null
  );
}

function restoreQuizViewToModal() {
  if (!quizViewModalParent || quizView.parentElement === quizViewModalParent) {
    return;
  }
  quizViewModalParent.insertBefore(quizView, quizViewModalNextSibling);
}

function mountQuizViewInCram() {
  if (!quizViewModalParent) {
    quizViewModalParent = quizView.parentElement;
    quizViewModalNextSibling = quizView.nextSibling;
  }
  cramQuizMount.appendChild(quizView);
  activeQuizContext = "cram";
}

function prepareCramQuizLoadingState(task) {
  activeQuiz = null;
  quizHasBeenChecked = false;
  setQuizExplanationFollowScroll(true);
  quizSetupView.hidden = true;
  quizView.hidden = false;
  quizInsights.hidden = true;
  setQuizExplanationSidebarOpen(false);
  quizSubtitle.textContent = `Building a checkpoint for ${task.title}...`;
  if (quizExplainHint) {
    quizExplainHint.textContent = "Generating questions for this section.";
  }
  if (quizExplanationToggle) {
    quizExplanationToggle.hidden = true;
    quizExplanationToggle.disabled = true;
  }
  if (quizExplanationFollowToggle) {
    quizExplanationFollowToggle.hidden = true;
    quizExplanationFollowToggle.disabled = true;
  }
  saveQuizButton.hidden = true;
  quizQuestions.replaceChildren();

  const loadingCard = document.createElement("article");
  loadingCard.className = "quiz-question-card quiz-question-card-loading";
  loadingCard.innerHTML = `
    <div class="quiz-loading-copy">
      <p class="panel-label">Generating</p>
      <h3 class="quiz-question-title">Preparing your embedded checkpoint</h3>
      <p class="panel-help">We’re turning this cram section into a focused quiz right now.</p>
    </div>
  `;
  quizQuestions.appendChild(loadingCard);
}

function openSavedCramQuiz(task, quizEntry) {
  cramQuizMeta.textContent = `Quiz for ${task.title}`;
  cramActivePanel.hidden = true;
  cramQuizPanel.hidden = false;
  if (cramPageScreen) {
    cramPageScreen.dataset.cramState = "quiz";
  }
  mountQuizViewInCram();
  loadQuizIntoView(quizEntry.quizData, {
    readOnly: false,
    hideSave: true,
  });
}

async function buildSavedQuizForCramTask(plan, task, classId, targetPath) {
  const quizMaterial = [
    plan.sourceSummary,
    task.title,
    task.topic,
    plan.uploadedMaterial,
  ]
    .filter(Boolean)
    .join("\n\n");
  const titleHint = task.topic || task.quizPreview?.title || task.title || null;

  const processingEntry = buildProcessingQuizEntry({
    name: `${task.title} Quiz - Processing`,
    summary: `Preparing a saved checkpoint for ${task.title}.`,
  });

  await addQuizEntryToExplorer(processingEntry, targetPath);

  try {
    const quiz = await window.overlayApi.generateQuiz({
      classId,
      sessionIds: plan.sessionIds || [],
      includeSessionSummary: true,
      includeSessionNotes: false,
      includeKeyTopics: true,
      includeUploadedMaterial: true,
      uploadedMaterial: quizMaterial || null,
      titleHint,
      gapFocus: plan.gapFocus || 50,
    }, "quiz.generate.cram");

    await updateQuizEntryInExplorer(
      processingEntry.id,
      (item) => ({
        ...item,
        name: quiz.title || `${task.title} Quiz`,
        status: "ready",
        completedAt: new Date().toISOString(),
        questionCount: quiz.questions.length,
        summary: quiz.subtitle,
        quizData: quiz,
      }),
      targetPath,
    );

    return {
      ...processingEntry,
      name: quiz.title || `${task.title} Quiz`,
      status: "ready",
      questionCount: quiz.questions.length,
      summary: quiz.subtitle,
      quizData: quiz,
    };
  } catch (error) {
    await updateQuizEntryInExplorer(
      processingEntry.id,
      (item) => ({
        ...item,
        name: `${task.title} Quiz - Failed`,
        status: "failed",
        completedAt: new Date().toISOString(),
        summary:
          error instanceof Error
            ? formatErrorMessage(error.message)
            : "Quiz generation failed. Try again.",
      }),
      targetPath,
    );
    throw error;
  }
}

async function prebuildCramTaskQuizzes(plan, classId, targetPath) {
  const tasks = Array.isArray(plan?.tasks) ? plan.tasks : [];
  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (!task?.quizEnabled || task.quizId) {
      continue;
    }

    try {
      const savedQuiz = await buildSavedQuizForCramTask(
        plan,
        task,
        classId,
        targetPath,
      );
      plan.linkedQuizIds = [
        ...new Set([...(plan.linkedQuizIds || []), savedQuiz.id]),
      ];
      plan.tasks = plan.tasks.map((candidate, candidateIndex) =>
        candidateIndex === index
          ? { ...candidate, quizId: savedQuiz.id, quizStatus: "ready" }
          : candidate,
      );
    } catch {
      plan.tasks = plan.tasks.map((candidate, candidateIndex) =>
        candidateIndex === index
          ? { ...candidate, quizStatus: "failed" }
          : candidate,
      );
    }
  }

  plan.progress = buildCramProgress(plan);
  return plan;
}

async function hydrateMissingCramQuizzes() {
  if (!activeCramPlan || !activeQuizClassFolder) {
    return;
  }

  const needsBackfill = (activeCramPlan.tasks || []).some(
    (task) => task?.quizEnabled && !task.quizId && task.quizStatus !== "failed",
  );
  if (!needsBackfill) {
    return;
  }

  try {
    const classId = await ensureBackendClassId(activeQuizClassFolder);
    cramStatus.textContent = "Preparing saved checkpoints for this guide...";
    activeCramPlan = await prebuildCramTaskQuizzes(
      activeCramPlan,
      classId,
      activeCramPath.slice(0, -1),
    );
    await saveActiveCramPlanLocally();
    renderCramPlan(activeCramPlan);
  } catch {
    cramStatus.textContent = "Some saved checkpoints are still unavailable.";
  }
}

function saveActiveCramPlanLocally() {
  if (!activeCramPlan) {
    return Promise.resolve();
  }
  activeCramPlan.progress = buildCramProgress(activeCramPlan);
  const parentPath = activeCramPath.slice(0, -1);
  const planId = activeCramPath[activeCramPath.length - 1];
  const parentNode = getFolderAtPath(parentPath);
  const siblingFolders = parentNode ? parentNode.children || [] : folders;
  const nextChildren = siblingFolders.map((item) =>
    item.id === planId ? activeCramPlan : item,
  );
  const nextFolders = replaceChildrenAtPath(parentPath, nextChildren);
  return persistFolders(nextFolders);
}

async function updateActiveCramTask(patch) {
  if (!activeCramPlan?.tasks?.[activeCramTaskIndex]) {
    return;
  }
  activeCramPlan.tasks = activeCramPlan.tasks.map((task, index) =>
    index === activeCramTaskIndex ? { ...task, ...patch } : task,
  );
  activeCramPlan.progress = buildCramProgress(activeCramPlan);
  await saveActiveCramPlanLocally();
  renderCramPlan(activeCramPlan);
}

async function launchCramTaskQuiz(task) {
  if (!activeCramPlan || !task?.quizEnabled) {
    return;
  }
  const quizEntry = getQuizEntryFromPath(activeCramPath.slice(0, -1), task.quizId);
  if (quizEntry?.quizData) {
    openSavedCramQuiz(task, quizEntry);
    return;
  }
  cramStatus.textContent =
    task.quizStatus === "failed"
      ? "This section's saved checkpoint is unavailable."
      : "This section's checkpoint is still being prepared.";
  if (task.quizStatus !== "failed") {
    cramQuizMeta.textContent = `Quiz for ${task.title}`;
    cramActivePanel.hidden = true;
    cramQuizPanel.hidden = false;
    if (cramPageScreen) {
      cramPageScreen.dataset.cramState = "quiz";
    }
    mountQuizViewInCram();
    prepareCramQuizLoadingState(task);
    quizSubmitButton.hidden = true;
  }
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
    statusDot.textContent = String(index + 1);
    statusDot.setAttribute("aria-label", `Question ${index + 1}`);

    const prompt = document.createElement("h3");
    prompt.className = "quiz-question-title";
    prompt.textContent = question.prompt;

    const explainButton = document.createElement("button");
    explainButton.type = "button";
    explainButton.className = "ghost-button quiz-explain-button";
    explainButton.dataset.questionIndex = String(index);
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

      const letter = document.createElement("span");
      letter.className = "quiz-option-letter";
      letter.setAttribute("aria-hidden", "true");
      letter.textContent = String.fromCharCode(65 + optionIndex);

      const text = document.createElement("span");
      text.className = "quiz-option-copy";
      text.textContent = option;

      label.append(input, letter, text);
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

function getSelectedQuizQuestionCount() {
  const selected = quizQuestionCountInputs.find((input) => input.checked);
  const parsed = selected ? Number(selected.value) : 5;
  return [3, 5, 8].includes(parsed) ? parsed : 5;
}

async function generateQuizForActiveSession() {
  if (!requireSignedIn("generate quizzes")) {
    return;
  }
  if (!activeQuizClassFolder) {
    return;
  }

  const canUseAi = await ensureAiFeatureAvailable((message) => {
    quizSessionMeta.textContent = message;
  });
  if (!canUseAi) {
    return;
  }

  const pastedMaterial = quizMaterialText.value.trim();
  const classMatl = formatSelectedClassMaterialText(
    selectedQuizClassMaterialKeys,
    activeQuizClassFolder,
  );
  const uploadedMaterial = [classMatl, uploadedQuizMaterial, pastedMaterial]
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
    questionCount: getSelectedQuizQuestionCount(),
    teacherAssessmentProfile: quizAssessmentProfileSelect?.value
      ? getTeacherAssessmentProfilePayload(
          getSelectedClassAssessmentProfile(
            activeQuizClassFolder,
            quizAssessmentProfileSelect.value,
          ),
        )
      : null,
  };

  const targetPath = [...currentPath];
  const processingEntry = buildProcessingQuizEntry();

  generateQuizButton.disabled = true;
  generateQuizButton.textContent = "Generating...";

  try {
    await addQuizEntryToExplorer(processingEntry, targetPath);
    const quiz = await window.overlayApi.generateQuiz(payload);
    await updateQuizEntryInExplorer(
      processingEntry.id,
      (item) => ({
        ...item,
        name: quiz.title || "Saved Quiz",
        status: "ready",
        completedAt: new Date().toISOString(),
        questionCount: quiz.questions.length,
        summary: quiz.subtitle,
        quizData: quiz,
      }),
      targetPath,
    );
    loadQuizIntoView(quiz, {
      readOnly: false,
      hideSave: true,
    });
  } catch (error) {
    await updateQuizEntryInExplorer(
      processingEntry.id,
      (item) => ({
        ...item,
        name: "Quiz - Failed",
        status: "failed",
        completedAt: new Date().toISOString(),
        summary:
          error instanceof Error
            ? formatErrorMessage(error.message)
            : "Quiz generation failed. Try again.",
      }),
      targetPath,
    );
    quizSessionMeta.textContent =
      error instanceof Error ? formatErrorMessage(error.message) : "Quiz generation failed.";
  } finally {
    generateQuizButton.disabled = false;
    generateQuizButton.textContent = "Generate Quiz";
  }
}

async function gradeQuiz() {
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
  if (quizExplanationToggle) {
    quizExplanationToggle.hidden = false;
    quizExplanationToggle.disabled = false;
  }
  if (quizExplanationFollowToggle) {
    quizExplanationFollowToggle.hidden = false;
    quizExplanationFollowToggle.disabled = false;
  }
  if (activeQuizContext === "cram" && activeCramPlan) {
    await updateActiveCramTask({
      status: "done",
      lastScore: {
        correct: correctCount,
        total: activeQuiz.questions.length,
      },
    });
    cramQuizPanel.hidden = false;
    cramActivePanel.hidden = true;
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
        ? "Search units, lessons, materials, sessions, cram plans, or quizzes"
        : "Search lessons, materials, sessions, cram plans, or quizzes";
    emptyTitle.textContent =
      currentType === "class"
        ? "Nothing in this class yet."
        : currentType === "unit"
          ? "Nothing in this unit yet."
          : "Nothing in this lesson yet.";
    emptyCopy.textContent =
      currentType === "class"
        ? "Use the + button to add units, sessions, material, quizzes, or cram plans."
        : currentType === "unit"
          ? "Add a lesson, session, material, quiz, or cram plan inside this unit."
          : "Start a session, add material, build a quiz, or make a cram plan.";
  }

  for (const folder of visibleChildren) {
    const article = document.createElement("article");
    article.className = "folder-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "folder-open-button";
    const isSessionItem = folder.type === "session";
    const isQuizItem = folder.type === "quiz";
    const isCramItem = folder.type === "cram" || folder.type === "cramPlan";
    const isCramPlanItem = folder.type === "cramPlan";
    const isMaterialItem = folder.type === "material";
    const isClassItem = folder.type === "class";
    const isProcessingQuiz = isQuizItem && folder.status === "processing";
    const isFailedQuiz = isQuizItem && folder.status === "failed";
    const isProcessingCram =
      folder.type === "cram" && folder.status === "processing";
    const isFailedCram = folder.type === "cram" && folder.status === "failed";
    const isProcessingStudyItem = isProcessingQuiz || isProcessingCram;
    const isFailedStudyItem = isFailedQuiz || isFailedCram;
    article.classList.toggle("folder-card-processing", isProcessingStudyItem);
    article.classList.toggle("folder-card-failed", isFailedStudyItem);
    const materialUploadCount = Array.isArray(folder.uploads)
      ? folder.uploads.length
      : 0;
    const materialSnippet = isMaterialItem
      ? String(folder.text || "")
          .replace(/\s+/g, " ")
          .trim()
      : "";
    const cramProgress = isCramPlanItem ? getCramProgress(folder) : null;
    const nextCramTask = isCramPlanItem ? getNextCramTask(folder) : null;
    const metaText = !isSessionItem
      ? isQuizItem
        ? isProcessingQuiz
          ? `Started ${formatSessionDate(folder.createdAt)}`
          : isFailedQuiz
            ? `Failed ${formatSessionDate(folder.completedAt || folder.createdAt)}`
            : `${folder.questionCount || 0} questions • ${formatSessionDate(folder.createdAt)}`
        : isCramItem
          ? isProcessingCram
            ? `Started ${formatSessionDate(folder.createdAt)}`
            : isFailedCram
              ? `Failed ${formatSessionDate(folder.completedAt || folder.createdAt)}`
              : isCramPlanItem
                ? `${cramProgress.percent}% complete • ${formatCramDeadline(folder.deadline)}`
                : `Cram plan • ${formatSessionDate(folder.createdAt)}`
          : isMaterialItem
            ? [
                `${materialUploadCount} upload${materialUploadCount === 1 ? "" : "s"}`,
                folder.updatedAt ? formatSessionDate(folder.updatedAt) : null,
              ]
                .filter(Boolean)
                .join(" • ")
            : [
                `${(folder.children || []).length} item${(folder.children || []).length === 1 ? "" : "s"}`,
                isClassItem && folder.testFormat ? folder.testFormat : null,
              ]
                .filter(Boolean)
                .join(" • ")
      : "";
    const sessionSummaryText = isSessionItem
      ? buildSessionCardSentence(folder)
      : isMaterialItem
        ? materialSnippet ||
          (materialUploadCount > 0
            ? "Shared uploaded material for quizzes, cram plans, and assessments."
            : "Shared class material for quizzes, cram plans, and assessments.")
        : isQuizItem
          ? isProcessingQuiz
            ? '<span class="quiz-processing-label">Building quiz<span class="jumping-dots" aria-hidden="true"><span></span><span></span><span></span></span></span>'
            : typeof folder.summary === "string" && folder.summary.trim()
              ? folder.summary.trim()
              : "Saved quiz"
          : isCramItem
            ? isProcessingCram
              ? '<span class="quiz-processing-label">Building cram plan<span class="jumping-dots" aria-hidden="true"><span></span><span></span><span></span></span></span>'
              : typeof folder.summary === "string" && folder.summary.trim()
                ? folder.summary.trim()
                : nextCramTask
                  ? `Next: ${nextCramTask.title}`
                  : "Saved cram plan"
            : "";
    const sessionStatsText = isSessionItem ? buildSessionCardStats(folder) : "";
    const safeFolderName = escapeHtml(folder.name || "");
    const safeSessionSummaryText = escapeHtml(sessionSummaryText || "");
    const safeMetaText = escapeHtml(metaText || "");

    openButton.innerHTML = `
      <span class="folder-card-icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24">
          ${
            isSessionItem
              ? '<path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5"></path>'
              : isQuizItem
                ? '<path d="M9 2h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 6H7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v2h-2V8h-4v2H9V8zm2-4v2h4V4h-4z"></path>'
                : isCramItem
                  ? `<path d="${MUI_CREATE_ACTION_ICON_PATHS.cram}"></path>`
                  : isMaterialItem
                    ? `<path d="${MUI_CREATE_ACTION_ICON_PATHS.material}"></path>`
                    : '<path d="M10 4 12 6h8c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h6z"></path>'
          }
        </svg>
      </span>
      <span class="folder-card-title">${safeFolderName}</span>
      ${
        isSessionItem || isQuizItem || isMaterialItem
          ? `<span class="folder-card-summary">${isSessionItem ? "" : safeSessionSummaryText}</span>
      <span class="folder-card-session-stats">${isSessionItem ? escapeHtml(sessionStatsText || "") : safeMetaText}</span>`
          : `<span class="folder-card-meta">${safeMetaText}</span>`
      }
    `;
    const titleNode = openButton.querySelector(".folder-card-title");
    const metaNode = openButton.querySelector(".folder-card-meta");
    const summaryNode = openButton.querySelector(".folder-card-summary");
    const statsNode = openButton.querySelector(".folder-card-session-stats");
    if (titleNode instanceof HTMLElement) {
      titleNode.dataset.fitText = "true";
      if (isProcessingStudyItem) {
        titleNode.innerHTML = `${isProcessingCram ? "Cram Plan" : "Quiz"} - Processing<span class="jumping-dots" aria-hidden="true"><span></span><span></span><span></span></span>`;
        titleNode.classList.add("folder-card-title-processing");
      }
    }
    if (metaNode instanceof HTMLElement) {
      if (!isSessionItem) {
        metaNode.dataset.fitText = "true";
      }
    }
    if (summaryNode instanceof HTMLElement) {
      if (isSessionItem) {
        summaryNode.textContent = sessionSummaryText;
      }
      summaryNode.title = sessionSummaryText;
    }
    if (statsNode instanceof HTMLElement) {
      statsNode.dataset.fitText = "true";
    }
    if (isSessionItem) {
      openButton.addEventListener("click", () => {
        openSessionSummary(folder);
      });
    } else if (isMaterialItem) {
      openButton.addEventListener("click", () => {
        openClassMaterialModal();
      });
    } else if (isQuizItem) {
      openButton.addEventListener("click", () => {
        openSavedQuiz(folder);
      });
    } else if (isCramPlanItem) {
      openButton.addEventListener("click", () => {
        openSavedCramPlan(folder);
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
          <path d="M14.06 9.02 15.48 10.44 6.92 19H5.5v-1.42l8.56-8.56ZM17.66 3c-.26 0-.51.1-.71.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34A.987.987 0 0 0 17.66 3ZM3.5 20.5h4.04l11.02-11.02-4.04-4.04L3.5 16.46V20.5Z"></path>
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
    assessmentProfiles: classFolder.assessmentProfiles || [],
    activeAssessmentProfileId: classFolder.activeAssessmentProfileId || "",
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
  if (mode === "class") {
    const collection = getAssessmentProfileCollectionSummary({
      assessmentProfiles: options.assessmentProfiles || [],
      activeAssessmentProfileId: options.activeAssessmentProfileId || "",
      assessmentProfile: options.assessmentProfile || null,
    });
    currentModalAssessmentProfiles = collection.profiles;
    currentModalActiveAssessmentProfileId = collection.activeProfileId;
  } else {
    currentModalAssessmentProfiles = [];
    currentModalActiveAssessmentProfileId = "";
  }
  classModalBackdrop.hidden = false;
  classFields.hidden = mode === "session";
  sessionFields.hidden = mode !== "session";
  assessmentConfigCard.hidden = mode !== "class";
  teacherNameField.hidden = mode !== "class";
  teacherNotesField.hidden = mode !== "class";
  testFormatField.hidden = true;
  testExamplesField.hidden = true;
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
  updateAssessmentConfigCallout();
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
  currentModalAssessmentProfiles = [];
  currentModalActiveAssessmentProfileId = "";
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
    const description = classDescriptionInput.value.trim();
    const teacherNotes = classTeacherNotesInput.value.trim();
    const additionalNotes = classAdditionalNotesInput.value.trim();
    let nextFolder;

    if (currentModalMode === "class") {
      const existingClassFolder =
        currentModalAction === "edit" && currentModalTargetPath
          ? getFolderAtPath(currentModalTargetPath)
          : null;
      const assessmentCollection = getAssessmentProfileCollectionSummary({
        assessmentProfiles: currentModalAssessmentProfiles,
        activeAssessmentProfileId: currentModalActiveAssessmentProfileId,
      });
      const activeAssessmentProfile = assessmentCollection.activeProfile;
      const assessmentSummary = summarizeAssessmentProfile(
        activeAssessmentProfile,
      );
      const backendResult = await window.overlayApi.saveClassProfile(
        buildBackendClassPayload({
          course,
          dbClassId: existingClassFolder?.dbClassId,
          teacherName,
          description,
          teacherNotes,
          assessmentProfiles: assessmentCollection.profiles,
          activeAssessmentProfileId: assessmentCollection.activeProfileId,
          assessmentProfile: activeAssessmentProfile,
          testFormat: assessmentSummary.testFormat,
          testExamples: assessmentSummary.testExamples,
          additionalNotes,
        }),
      );

      nextFolder = {
        id: existingClassFolder?.id || makeId(),
        type: "class",
        name: course,
        dbClassId: backendResult.classProfile.id,
        assessmentProfiles: assessmentCollection.profiles,
        activeAssessmentProfileId: assessmentCollection.activeProfileId,
        assessmentProfile: activeAssessmentProfile,
        teacherName,
        testFormat: assessmentSummary.testFormat,
        testExamples: assessmentSummary.testExamples,
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
        : replaceChildrenAtPath(currentPath, [
            ...getCurrentChildren(),
            nextFolder,
          ]);
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
  document.body.dataset.windowMode = mode;
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
  setHomeView(
    activeHomeView === "settings" ||
      activeHomeView === "assessment" ||
      activeHomeView === "update-guide"
      ? "dashboard"
      : "settings",
  );
});

settingsHomeButton.addEventListener("click", () => {
  setHomeView("dashboard");
});

updateGuideBackButton?.addEventListener("click", () => {
  setHomeView("settings");
});

quizThemeToggle?.addEventListener("click", async () => {
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

quizMinimizeNative?.addEventListener("click", async () => {
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

closeClassMaterialModalButton?.addEventListener(
  "click",
  closeClassMaterialModal,
);
classMaterialBackdrop?.addEventListener("click", (event) => {
  if (event.target === classMaterialBackdrop) {
    closeClassMaterialModal();
  }
});
classMaterialFile?.addEventListener("change", () => {
  void handleClassMaterialFileUpload(classMaterialFile.files);
});
saveClassMaterialButton?.addEventListener("click", () => {
  void saveClassMaterial();
});

editCurrentClassButton?.addEventListener("click", () => {
  openClassEditModal();
});
openAssessmentConfigButton?.addEventListener("click", () => {
  if (currentModalMode === "class") {
    openAssessmentProfileFromModalDraft();
  }
});
assessmentBackButton?.addEventListener("click", closeAssessmentProfileView);
assessmentBreadcrumbClass?.addEventListener("click", closeAssessmentProfileView);
assessmentCancelButton?.addEventListener("click", closeAssessmentProfileView);
assessmentEditorBackButton?.addEventListener("click", () => {
  renderAssessmentManager();
  setAssessmentPanel("manager");
});
assessmentManagerCreateButton?.addEventListener(
  "click",
  createNewAssessmentProfile,
);
assessmentSaveButton?.addEventListener("click", () => {
  void saveAndProcessAssessmentProfile();
});
assessmentProfileSelect?.addEventListener("change", () => {
  switchActiveAssessmentProfile(assessmentProfileSelect.value);
});
assessmentProfileName?.addEventListener("input", syncAssessmentDraftFromInputs);
assessmentAnalyzeButton?.addEventListener("click", () => {
  void analyzeActiveAssessmentProfile();
});
assessmentCustomFormat?.addEventListener(
  "input",
  syncAssessmentDraftFromInputs,
);
assessmentExampleQuestions?.addEventListener(
  "input",
  syncAssessmentDraftFromInputs,
);
assessmentGradingNotes?.addEventListener(
  "input",
  syncAssessmentDraftFromInputs,
);
assessmentSearchInput?.addEventListener("input", renderAssessmentManager);
assessmentMaterialFile?.addEventListener("change", async () => {
  const files = Array.from(assessmentMaterialFile.files || []);
  if (files.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    files.map((file) => extractStudyMaterialFromFiles([file], "quiz")),
  );
  const successfulFiles = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value[0])
    .map((upload) => ({
      ...upload,
      id: makeId(),
    }));
  const failedCount = results.length - successfulFiles.length;
  const nextDraft = getAssessmentDraft();
  nextDraft.uploads = [...nextDraft.uploads, ...successfulFiles];
  assessmentUploadError = failedCount
    ? `Loaded ${successfulFiles.length} file${successfulFiles.length === 1 ? "" : "s"}, but ${failedCount} could not be read.`
    : "";
  setAssessmentDraft(nextDraft);
  assessmentMaterialFile.value = "";
});
quizAssessmentProfileSelect?.addEventListener("change", () => {
  updateQuizAssessmentProfileMeta();
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
    const result = await window.overlayApi.setThemeSource(
      settingsThemeSelect.value,
    );
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
        openCramSetupForCurrentClass();
      } else if (action.key === "material") {
        openClassMaterialModal();
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
      error instanceof Error ? formatErrorMessage(error.message) : "Export failed.",
      "danger",
    );
  } finally {
    privacyExportButton.disabled = false;
  }
});
cramAssessmentProfileSelect?.addEventListener("change", () => {
  const currentClassFolder = getCurrentClassFolder();
  if (currentClassFolder) {
    updateCramAssessmentProfileMeta(currentClassFolder);
  }
});
cramMaterialText?.addEventListener("input", () => {
  updateCramMaterialCount();
  if (cramStatus) {
    cramStatus.textContent = "";
  }
});
cramAdditionalNotes?.addEventListener("input", () => {
  if (cramStatus) {
    cramStatus.textContent = "";
  }
});
cramMaterialFile?.addEventListener("change", async () => {
  const files = Array.from(cramMaterialFile.files || []);
  if (files.length === 0) {
    uploadedCramMaterials = [];
    cramMaterialUploadError = "";
    cramMaterialUploadSummary = "";
    if (cramFileName) {
      cramFileName.textContent = "No files selected";
    }
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
    if (cramFileName) {
      cramFileName.textContent = getCramUploadSummaryText();
    }
    renderCramUploadRollup();
  } catch (error) {
    uploadedCramMaterials = [];
    cramMaterialUploadError =
      "Could not extract readable text from those files.";
    cramMaterialUploadSummary = "";
    if (cramFileName) {
      cramFileName.textContent = "Files couldn't be read";
    }
    renderCramUploadRollup();
    console.error("Failed to read Cram Mode material files", error);
  }
  updateCramMaterialCount();
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
      error instanceof Error ? formatErrorMessage(error.message) : "Account deletion failed.",
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
generateCramButton?.addEventListener("click", async () => {
  if (activeHomeView !== "cram") {
    return;
  }
  await generateCramPlanForCurrentClass();
});
cramBackButton?.addEventListener("click", () => {
  restoreQuizViewToModal();
  activeQuizContext = "page";
  currentPath = [...cramReturnPath];
  setHomeView("dashboard");
  renderFolders();
});
cramQuizBackButton?.addEventListener("click", () => {
  cramQuizPanel.hidden = true;
  cramActivePanel.hidden = false;
  if (cramPageScreen) {
    cramPageScreen.dataset.cramState = "guide";
  }
  renderCramPlan(activeCramPlan);
});
cramSaveProgressButton?.addEventListener("click", async () => {
  await saveActiveCramPlanLocally();
});
quizSubmitButton.addEventListener("click", async () => {
  await gradeQuiz();
});
quizExplanationToggle?.addEventListener("click", () => {
  const isOpen = !quizExplanationPanel.hidden;
  setQuizExplanationSidebarOpen(!isOpen);
});
quizExplanationFollowToggle?.addEventListener("click", () => {
  setQuizExplanationFollowScroll(!quizExplanationFollowScroll);
});
let updateDownloadUrl = "";
const SIDEKLICK_MAC_QUARANTINE_FIX_COMMAND =
  "sudo xattr -rd com.apple.quarantine /Applications/SideKlick.app/";
const isMacClient = navigator.platform.toLowerCase().includes("mac");
let hasShownUpdateAvailableNotice = false;

if (settingsUpdateQuarantineCommand) {
  settingsUpdateQuarantineCommand.textContent =
    SIDEKLICK_MAC_QUARANTINE_FIX_COMMAND;
}

function handleUpdateStatus(info) {
  if (!settingsUpdateStatus) return;

  const currentVersion = info.version || "0.1.0";
  
  switch (info.status) {
    case "idle":
      settingsUpdateStatus.textContent = `Current version: v${currentVersion}`;
      settingsUpdateStatus.dataset.tone = "neutral";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
      break;
    case "checking":
      settingsUpdateStatus.textContent = "Checking for updates...";
      settingsUpdateStatus.dataset.tone = "neutral";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = true;
      break;
    case "up-to-date":
      settingsUpdateStatus.textContent = `Up to date (v${currentVersion})`;
      settingsUpdateStatus.dataset.tone = "success";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
      break;
    case "available":
      settingsUpdateStatus.textContent = `Update ${info.version} available. Downloading...`;
      settingsUpdateStatus.dataset.tone = "neutral";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = true;
      break;
    case "downloading":
      settingsUpdateStatus.textContent = `Downloading update: ${Math.round(info.progress || 0)}%`;
      settingsUpdateStatus.dataset.tone = "neutral";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = true;
      break;
    case "downloaded":
      settingsUpdateStatus.textContent = `Update downloaded and ready to install!`;
      settingsUpdateStatus.dataset.tone = "success";
      if (settingsActionUpdateButton) {
        settingsActionUpdateButton.textContent = "Restart";
        settingsActionUpdateButton.hidden = false;
      }
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = true;
      break;
    case "manual-available":
      settingsUpdateStatus.textContent = `New version ${info.version} is available.`;
      settingsUpdateStatus.dataset.tone = "success";
      if (settingsActionUpdateButton) {
        settingsActionUpdateButton.textContent = isMacClient
          ? "Download DMG"
          : "Download";
        settingsActionUpdateButton.hidden = false;
      }
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
      updateDownloadUrl = info.url;
      if (!hasShownUpdateAvailableNotice) {
        hasShownUpdateAvailableNotice = true;
        try {
          new window.Notification("SideKlick update available", {
            body: "Open Settings to download and install the new version.",
          });
        } catch (_error) {
          // notifications can be unavailable in some environments
        }
      }
      break;
    case "error":
      settingsUpdateStatus.textContent = info.message ? `Update error: ${info.message}` : "Failed to check for updates.";
      settingsUpdateStatus.dataset.tone = "danger";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
      break;
    default:
      settingsUpdateStatus.textContent = `Current version: v${currentVersion}`;
      settingsUpdateStatus.dataset.tone = "neutral";
      if (settingsActionUpdateButton) settingsActionUpdateButton.hidden = true;
      if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
  }
}

settingsCheckUpdateButton?.addEventListener("click", async () => {
  try {
    if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = true;
    if (settingsUpdateStatus) {
      settingsUpdateStatus.textContent = "Checking for updates...";
      settingsUpdateStatus.dataset.tone = "neutral";
    }
    await window.overlayApi.checkForUpdates();
  } catch (error) {
    console.error("[updater] failed to check updates", error);
    if (settingsUpdateStatus) {
      settingsUpdateStatus.textContent = "Failed to initiate update check.";
      settingsUpdateStatus.dataset.tone = "danger";
    }
    if (settingsCheckUpdateButton) settingsCheckUpdateButton.disabled = false;
  }
});

settingsActionUpdateButton?.addEventListener("click", async () => {
  if (settingsActionUpdateButton.textContent === "Restart") {
    await window.overlayApi.quitAndInstallUpdate();
  } else if (
    (settingsActionUpdateButton.textContent === "Download" ||
      settingsActionUpdateButton.textContent === "Download DMG") &&
    updateDownloadUrl
  ) {
    await window.overlayApi.openExternalUpdateUrl(updateDownloadUrl);
    if (isMacClient) {
      setHomeView("update-guide");
    }
  }
});


window.overlayApi.onThemeChanged((payload) => {
  applyThemePreference(payload);
});
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
window.overlayApi.onClassFoldersChanged((nextFolders) => {
  folders = normalizeFolders(Array.isArray(nextFolders) ? nextFolders : []);
  renderFolders();
});
if (typeof window.overlayApi.onAuthSessionChanged === "function") {
  window.overlayApi.onAuthSessionChanged((nextSession) => {
    applyAuthSession(nextSession);
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const [storedFolders, preferences, settings] = await Promise.all([
    window.overlayApi.getClassFolders(),
    window.overlayApi.getPreferences(),
    window.overlayApi.getPrivacySettings(),
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
  applyAuthSession(null);
  setPrivacyAccountStatus(
    "Theme changes apply across Home, Chat, Cram Mode, and quiz views.",
  );
  setHomeView("dashboard");
  renderFolders();
  attachResizeHandle(resizeHandle);

  void window.overlayApi
    .getAuthSession()
    .then((session) => {
      applyAuthSession(session);
    })
    .catch(() => {
      applyAuthSession(null);
    });

  // Set up auto-updater bindings and get initial status
  if (typeof window.overlayApi.onUpdateStatusChanged === "function") {
    window.overlayApi.onUpdateStatusChanged((statusPayload) => {
      handleUpdateStatus(statusPayload);
    });

    try {
      const initialStatus = await window.overlayApi.getUpdateStatus();
      if (initialStatus) {
        handleUpdateStatus(initialStatus);
      }
    } catch (e) {
      console.warn("[updater] failed to load initial status", e);
    }
  }
});

window.addEventListener("resize", scheduleFitText);
