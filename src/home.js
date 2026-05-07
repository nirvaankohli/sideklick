const root = document.querySelector(".window-shell");
const shrinkWindow = document.querySelector("#shrink-window");
const openSettingsButton = document.querySelector("#open-settings");
const minimizeNative = document.querySelector("#minimize-native");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const homeDashboardView = document.querySelector("#home-dashboard-view");
const homeSettingsView = document.querySelector("#home-settings-view");
const settingsHomeButton = document.querySelector("#settings-home-button");
const createQuizButton = document.querySelector("#create-quiz");
const backFolderButton = document.querySelector("#back-folder");
const newFolderButton = document.querySelector("#new-folder");
const createFolderButton = document.querySelector("#create-folder");
const folderNameInput = document.querySelector("#folder-name-input");
const folderGrid = document.querySelector("#folder-grid");
const breadcrumbs = document.querySelector("#breadcrumbs");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const classModalBackdrop = document.querySelector("#class-modal-backdrop");
const classModalKicker = document.querySelector("#class-modal-kicker");
const classModalTitle = document.querySelector("#class-modal-title");
const closeClassModal = document.querySelector("#close-class-modal");
const cancelClassModal = document.querySelector("#cancel-class-modal");
const saveClassModal = document.querySelector("#save-class-modal");
const classFields = document.querySelector("#class-fields");
const sessionFields = document.querySelector("#session-fields");
const classCourseInput = document.querySelector("#class-course-input");
const classTeacherInput = document.querySelector("#class-teacher-input");
const classDescriptionInput = document.querySelector("#class-description-input");
const classTeacherNotesInput = document.querySelector("#class-teacher-notes-input");
const classAdditionalNotesInput = document.querySelector("#class-additional-notes-input");
const sessionNameInput = document.querySelector("#session-name-input");
const sessionNotesInput = document.querySelector("#session-notes-input");
const sessionSummaryBackdrop = document.querySelector("#session-summary-backdrop");
const closeSessionSummaryButton = document.querySelector("#close-session-summary");
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
const quizExplanationAnswer = document.querySelector("#quiz-explanation-answer");
const quizExplanationText = document.querySelector("#quiz-explanation-text");
const saveQuizButton = document.querySelector("#save-quiz-button");
const quizSubmitButton = document.querySelector("#quiz-submit-button");
const resizeHandle = document.querySelector("#resize-handle");
const settingsThemeStatus = document.querySelector("#settings-theme-status");
const settingsSourceStatus = document.querySelector("#settings-source-status");
const settingsProfileStatus = document.querySelector("#settings-profile-status");
const settingsPrivacyStatus = document.querySelector("#settings-privacy-status");
const privacyScreenshotStatus = document.querySelector("#privacy-screenshot-status");
const privacySyncStatus = document.querySelector("#privacy-sync-status");
const privacyLocalOnlyToggle = document.querySelector("#privacy-local-only-toggle");
const settingsThemeButtons = Array.from(document.querySelectorAll("[data-home-theme]"));
const settingsSourceButtons = Array.from(document.querySelectorAll("[data-home-source]"));
const settingsProfileButtons = Array.from(document.querySelectorAll("[data-home-profile]"));
const privacyScreenshotButtons = Array.from(document.querySelectorAll("[data-screenshot-policy]"));
const privacySyncButtons = Array.from(document.querySelectorAll("[data-sync-consent]"));

let currentTone = "light";
let folders = [];
let currentPath = [];
let currentModalMode = "class";
let fitTextFrame = null;
let activeQuizClassFolder = null;
let uploadedQuizMaterial = "";
let activeQuiz = null;
let quizHasBeenChecked = false;
let activeHomeView = "dashboard";
let privacySettings = null;

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
  disabled: "Disabled",
};

const syncConsentLabels = {
  unknown: "Ask later",
  granted: "Allowed",
  denied: "Denied",
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
  activeHomeView = nextView === "settings" ? "settings" : "dashboard";
  homeDashboardView.hidden = activeHomeView !== "dashboard";
  homeSettingsView.hidden = activeHomeView !== "settings";
  homeDashboardView.classList.toggle("home-view-active", activeHomeView === "dashboard");
  homeSettingsView.classList.toggle("home-view-active", activeHomeView === "settings");
}

function applyPrivacySettings(settings) {
  privacySettings = settings;

  for (const button of privacyScreenshotButtons) {
    button.dataset.selected =
      button.dataset.screenshotPolicy === settings.screenshotPolicy ? "true" : "false";
  }

  for (const button of privacySyncButtons) {
    button.dataset.selected =
      button.dataset.syncConsent === settings.syncConsent ? "true" : "false";
  }

  privacyLocalOnlyToggle.checked = Boolean(settings.localOnlyMode);
  privacyScreenshotStatus.textContent = screenshotPolicyLabels[settings.screenshotPolicy];
  privacySyncStatus.textContent = syncConsentLabels[settings.syncConsent];
  settingsPrivacyStatus.textContent = settings.localOnlyMode
    ? "Local-only mode is on with conservative defaults."
    : "Review capture and sync preferences carefully.";
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
}

function normalizeFolders(source) {
  return source
    .filter((item) => item.type === "class")
    .map((item) => ({
      ...item,
      children: Array.isArray(item.children)
        ? item.children.filter((child) =>
            child && (child.type === "session" || child.type === "quiz"))
        : [],
    }));
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
        children: nextChildren
      };
    }

    return {
      ...item,
      children: replaceChildrenAtPath(rest, nextChildren, item.children || [])
    };
  });
}

async function persistFolders(nextFolders) {
  folders = await window.overlayApi.updateClassFolders(nextFolders);
  renderFolders();
}

function buildBackendClassPayload(values) {
  const noteParts = [
    values.description ? `Description: ${values.description}` : null,
    values.additionalNotes ? `Additional notes: ${values.additionalNotes}` : null,
  ].filter(Boolean);
  const teacherFocusParts = [
    values.teacherName ? `Teacher: ${values.teacherName}` : null,
    values.teacherNotes ? `Focus: ${values.teacherNotes}` : null,
  ].filter(Boolean);

  return {
    className: values.course,
    subject: values.course,
    currentUnit: null,
    teacherFocus: teacherFocusParts.length > 0 ? teacherFocusParts.join(" | ") : null,
    keyConcepts: [],
    notes: noteParts.length > 0 ? noteParts.join("\n") : null
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
      teacherName: classFolder.teacherName || "",
      description: classFolder.description || "",
      teacherNotes: classFolder.teacherNotes || "",
      additionalNotes: classFolder.additionalNotes || ""
    })
  );

  const parentPath = currentPath.slice(0, -1);
  const parentNode = getFolderAtPath(parentPath);
  const siblingFolders = parentNode ? parentNode.children || [] : folders;
  const nextChildren = siblingFolders.map((item) =>
    item.id === classFolder.id
      ? {
        ...item,
        dbClassId: result.classProfile.id
      }
      : item
  );
  const nextFolders = replaceChildrenAtPath(parentPath, nextChildren);
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
  const summarySentence = typeof session.summary === "string" && session.summary.trim()
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

async function readQuizMaterialFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

function openSessionSummary(session) {
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
    quizExplainHint.textContent = "Answer explanations unlock after you check answers.";
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
  const strengths = correctTopics.length > 0
    ? `You showed strength on ${joinTopics(correctTopics.slice(0, 3))}.`
    : "No clear strengths yet because nothing was answered correctly.";

  const gapParts = [];
  if (gapTopics.length > 0) {
    gapParts.push(`Review ${joinTopics(gapTopics.slice(0, 3))}`);
  }
  if (unansweredTopics.length > 0) {
    gapParts.push(`come back to ${joinTopics(unansweredTopics.slice(0, 2))}`);
  }

  const gaps = gapParts.length > 0
    ? `${gapParts.join(", and ")}.`
    : "No major gaps showed up in this round.";

  return { strengths, gaps };
}

function renderQuizSessionPicker(sessions) {
  quizSessionPicker.replaceChildren();

  if (sessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quiz-picker-empty";
    empty.textContent = "No saved sessions selected. The quiz will use class context and any uploaded material.";
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
  const currentClassFolder = getFolderAtPath(currentPath);
  if (!currentClassFolder || currentClassFolder.type !== "class") {
    return;
  }

  activeQuizClassFolder = currentClassFolder;
  resetQuizModalState();
  quizModalTitle.textContent = `Quiz: ${currentClassFolder.name || "Class"}`;
  quizSessionMeta.textContent = "Pick any saved sessions to include, or leave them all unchecked to build from broader class context.";
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
  activeQuizClassFolder = getFolderAtPath(currentPath);
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
  if (!activeQuizClassFolder) {
    return;
  }

  const pastedMaterial = quizMaterialText.value.trim();
  const uploadedMaterial = [uploadedQuizMaterial, pastedMaterial]
    .filter(Boolean)
    .join("\n\n");
  const selectedSessionIds = Array.from(
    quizSessionPicker.querySelectorAll('input[type="checkbox"]:checked'),
  ).map((input) => Number(input.value)).filter((value) => Number.isFinite(value));

  const payload = {
    classId: activeQuizClassFolder.dbClassId,
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

  quizQuestions.querySelectorAll(".quiz-question-card").forEach((card, index) => {
    const question = activeQuiz.questions[index];
    const selected = card.querySelector(`input[name="quiz-question-${index}"]:checked`);
    const feedback = card.querySelector(".quiz-feedback");
    const statusDot = card.querySelector(".quiz-question-status");
    const selectedIndex = selected ? Number(selected.value) : -1;
    const topic = summarizeQuestionTopic(question);

    card.querySelectorAll(".quiz-option").forEach((optionNode, optionIndex) => {
      optionNode.classList.toggle("correct", optionIndex === question.correctIndex);
      optionNode.classList.toggle(
        "incorrect",
        selectedIndex === optionIndex && optionIndex !== question.correctIndex,
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
    feedback.textContent = selectedIndex === question.correctIndex
      ? "Correct."
      : `Correct answer: ${question.options[question.correctIndex]}`;
    if (statusDot) {
      statusDot.dataset.result = card.dataset.result;
      statusDot.title = card.dataset.result;
    }
  });

  const insights = buildQuizInsights(correctTopics, gapTopics, unansweredTopics);
  quizHasBeenChecked = true;
  updateExplainButtons();
  quizSubtitle.textContent = `${activeQuiz.subtitle} • Score: ${correctCount}/${activeQuiz.questions.length}`;
  quizInsights.hidden = false;
  quizStrengths.textContent = insights.strengths;
  quizGaps.textContent = insights.gaps;
  quizSubmitButton.disabled = true;
  if (quizExplainHint) {
    quizExplainHint.textContent = "Pick any question to open the full answer explanation.";
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
      path: [...runningPath]
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
  const filteredChildren = currentChildren;
  const visibleChildren = searchQuery
    ? filteredChildren.filter((item) => item.name.toLowerCase().includes(searchQuery))
    : filteredChildren;
  folderGrid.replaceChildren();
  renderBreadcrumbs();
  backFolderButton.disabled = currentPath.length === 0;
  createQuizButton.hidden = !isInsideClass();
  emptyState.hidden = visibleChildren.length > 0;
  folderNameInput.placeholder = isInsideClass() ? "Search sessions" : "Search classes";
  createFolderButton.textContent = isInsideClass() ? "Start Session" : "Create Class";
  newFolderButton.textContent = isInsideClass() ? "Start Session" : "Create Class";
  emptyTitle.textContent = isInsideClass() ? "No saved sessions here." : "No classes here yet.";
  emptyCopy.textContent = isInsideClass()
    ? "Stopped sessions stay here so you can see what you named them and keep track of your study history."
    : "Create a class folder to start organizing courses, notes, and study context.";

  for (const folder of visibleChildren) {
    const article = document.createElement("article");
    article.className = "folder-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "folder-open-button";
    const isSessionItem = folder.type === "session";
    const isQuizItem = folder.type === "quiz";
    const metaText = !isSessionItem
      ? isQuizItem
        ? `${folder.questionCount || 0} questions • ${formatSessionDate(folder.createdAt)}`
        : `${(folder.children || []).length} item${(folder.children || []).length === 1 ? "" : "s"}`
      : "";
    const sessionSummaryText = isSessionItem
      ? buildSessionCardSentence(folder)
      : isQuizItem
        ? (typeof folder.summary === "string" && folder.summary.trim()
            ? folder.summary.trim()
            : "Saved quiz")
        : "";
    const sessionStatsText = isSessionItem ? buildSessionCardStats(folder) : "";

    openButton.innerHTML = `
      <span class="folder-card-icon" aria-hidden="true">
        <svg class="icon-svg" viewBox="0 0 24 24">
          ${isSessionItem
            ? '<path d="M7 2h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h4.5"></path>'
            : isQuizItem
              ? '<path d="M9 2h6a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 6H7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h-2v2h-2V8h-4v2H9V8zm2-4v2h4V4h-4z"></path>'
              : '<path d="M10 4 12 6h8c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h6z"></path>'}
        </svg>
      </span>
      <span class="folder-card-title">${folder.name}</span>
      ${(isSessionItem || isQuizItem)
        ? `<span class="folder-card-summary">${sessionSummaryText}</span>
      <span class="folder-card-session-stats">${isSessionItem ? sessionStatsText : metaText}</span>`
        : `<span class="folder-card-meta">${metaText}</span>`}
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
        currentPath = [...currentPath, folder.id];
        renderFolders();
      });
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
      const nextChildren = getCurrentChildren().filter((item) => item.id !== folder.id);
      const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
      await persistFolders(nextFolders);
    });

    article.append(openButton, deleteButton);
    folderGrid.appendChild(article);
  }

  scheduleFitText();
}

function openModal(mode) {
  currentModalMode = mode;
  classModalBackdrop.hidden = false;
  classFields.hidden = mode !== "class";
  sessionFields.hidden = mode !== "session";
  classModalKicker.textContent = mode === "class" ? "New class" : "Session setup";
  classModalTitle.textContent = mode === "class" ? "Create Class" : "Start Session";
  saveClassModal.textContent = mode === "class" ? "Save Class" : "Start Session";
  if (mode === "class") {
    classCourseInput.focus();
  } else {
    sessionNameInput.focus();
  }
}

function closeModal() {
  classModalBackdrop.hidden = true;
  classCourseInput.value = "";
  classTeacherInput.value = "";
  classDescriptionInput.value = "";
  classTeacherNotesInput.value = "";
  classAdditionalNotesInput.value = "";
  sessionNameInput.value = "";
  sessionNotesInput.value = "";
}

async function saveModal() {
  if (currentModalMode === "class") {
    const course = classCourseInput.value.trim();
    if (!course) {
      classCourseInput.focus();
      return;
    }

    const teacherName = classTeacherInput.value.trim();
    const description = classDescriptionInput.value.trim();
    const teacherNotes = classTeacherNotesInput.value.trim();
    const additionalNotes = classAdditionalNotesInput.value.trim();
    const backendResult = await window.overlayApi.saveClassProfile(
      buildBackendClassPayload({
        course,
        teacherName,
        description,
        teacherNotes,
        additionalNotes
      })
    );

    const nextFolder = {
      id: makeId(),
      type: "class",
      name: course,
      dbClassId: backendResult.classProfile.id,
      teacherName,
      description,
      teacherNotes,
      additionalNotes,
      children: []
    };
    const nextChildren = [...getCurrentChildren(), nextFolder];
    const nextFolders = replaceChildrenAtPath(currentPath, nextChildren);
    await persistFolders(nextFolders);
    closeModal();
    return;
  }

  const sessionName = sessionNameInput.value.trim();
  if (!sessionName) {
    sessionNameInput.focus();
    return;
  }

  const classFolder = getFolderAtPath(currentPath);
  const dbClassId = await ensureBackendClassId(classFolder);
  closeModal();
  await window.overlayApi.startSession({
    classId: dbClassId,
    className: classFolder?.name || "",
    teacherName: classFolder?.teacherName || "",
    description: classFolder?.description || "",
    teacherNotes: classFolder?.teacherNotes || "",
    additionalNotes: classFolder?.additionalNotes || "",
    sessionId: null,
    sessionName,
    sessionNotes: sessionNotesInput.value.trim(),
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

  settingsThemeStatus.textContent =
    `Current preference: ${humanLabel(themeSource, shouldUseDarkColors)}`;
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

shrinkWindow.addEventListener("click", async () => {
  await window.overlayApi.minimizeToDock();
});

openSettingsButton.addEventListener("click", () => {
  setHomeView("settings");
});

settingsHomeButton.addEventListener("click", () => {
  setHomeView("dashboard");
});

quizThemeToggle.addEventListener("click", async () => {
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
  openModal(isInsideClass() ? "session" : "class");
});

createFolderButton.addEventListener("click", () => {
  openModal(isInsideClass() ? "session" : "class");
});
createQuizButton.addEventListener("click", () => {
  openQuizModalForCurrentClass();
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
quizGapFocus.addEventListener("input", () => {
  quizGapFocusValue.textContent = `${quizGapFocus.value}%`;
});
quizMaterialFile.addEventListener("change", async () => {
  const file = quizMaterialFile.files?.[0];
  if (!file) {
    uploadedQuizMaterial = "";
    quizFileName.textContent = "No file selected";
    return;
  }

  uploadedQuizMaterial = await readQuizMaterialFile(file);
  quizFileName.textContent = file.name;
  quizSourceUploaded.checked = true;
});

for (const button of settingsThemeButtons) {
  button.addEventListener("click", async () => {
    const result = await window.overlayApi.setThemeSource(button.dataset.homeTheme);
    applyThemePreference(result);
  });
}

for (const button of settingsSourceButtons) {
  button.addEventListener("click", async () => {
    const preferences = await window.overlayApi.updatePreferences({
      discoverySource: button.dataset.homeSource,
    });
    applyPreferenceSelections(preferences);
  });
}

for (const button of settingsProfileButtons) {
  button.addEventListener("click", async () => {
    const preferences = await window.overlayApi.updatePreferences({
      customerProfile: button.dataset.homeProfile,
    });
    applyPreferenceSelections(preferences);
  });
}

for (const button of privacyScreenshotButtons) {
  button.addEventListener("click", async () => {
    const settings = await window.overlayApi.updatePrivacySettings({
      screenshotPolicy: button.dataset.screenshotPolicy,
    });
    applyPrivacySettings(settings);
  });
}

for (const button of privacySyncButtons) {
  button.addEventListener("click", async () => {
    const settings = await window.overlayApi.updatePrivacySettings({
      syncConsent: button.dataset.syncConsent,
    });
    applyPrivacySettings(settings);
  });
}

privacyLocalOnlyToggle.addEventListener("change", async () => {
  const settings = await window.overlayApi.updatePrivacySettings({
    localOnlyMode: privacyLocalOnlyToggle.checked,
  });
  applyPrivacySettings(settings);
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
  const [storedFolders, preferences, settings] = await Promise.all([
    window.overlayApi.getClassFolders(),
    window.overlayApi.getPreferences(),
    window.overlayApi.getPrivacySettings(),
  ]);
  const normalizedFolders = normalizeFolders(storedFolders);
  const shouldPersistNormalized =
    normalizedFolders.length !== storedFolders.length ||
    storedFolders.some((item) => Array.isArray(item.children) && item.children.length > 0);

  if (shouldPersistNormalized) {
    folders = await window.overlayApi.updateClassFolders(normalizedFolders);
  } else {
    folders = normalizedFolders;
  }
  applyThemePreference({
    themeSource: preferences.themeSource || "system",
    shouldUseDarkColors: resolveShouldUseDarkColors(preferences.themeSource || "system"),
  });
  applyPreferenceSelections(preferences);
  applyPrivacySettings(settings);
  setHomeView("dashboard");
  renderFolders();
  attachResizeHandle(resizeHandle);
});

window.addEventListener("resize", scheduleFitText);
