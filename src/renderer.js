const root = document.querySelector(".window-shell");
const themeIconToggle = document.querySelector("#theme-icon-toggle");
const shrinkWindow = document.querySelector("#shrink-window");
const stopSessionButton = document.querySelector("#stop-session");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const sessionClassLabel = document.querySelector("#session-class-label");
const sessionNameLabel = document.querySelector("#session-name-label");
const chatThread = document.querySelector("#chat-thread");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const resizeHandle = document.querySelector("#resize-handle");

const ACTION_LABELS = {
  chat: "Ask SideClick",
  explain: "Explain this",
  connect: "Connect to what I know",
  example: "Give me an example",
  flag_confusing: "Flag as confusing",
  already_know: "I already know this",
  add_notes: "Add to my notes",
  summarize_page: "Summarize this page",
  focus_page: "What should I focus on?",
};
const STREAM_CHUNK_SIZE = 3;
const STREAM_INTERVAL_MS = 22;

let currentTone = "light";
let currentSession = null;
let screenshotDataUrl = null;
let screenshotStatusRow = null;

function applyThemeState({ shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
}

function setMode(mode) {
  root.dataset.mode = mode;
}

function addMessage(role, copy, options = {}) {
  const article = document.createElement("article");
  article.className = `chat-message ${role}`;

  const paragraph = document.createElement("p");
  paragraph.className = "chat-message-copy";
  paragraph.textContent = copy;
  article.appendChild(paragraph);

  if (options.meta) {
    const meta = document.createElement("p");
    meta.className = "chat-message-meta";
    meta.textContent = options.meta;
    article.appendChild(meta);
  }

  if (role === "assistant" && options.interactionId) {
    const feedbackRow = document.createElement("div");
    feedbackRow.className = "chat-feedback-row";

    const helpfulButton = document.createElement("button");
    helpfulButton.type = "button";
    helpfulButton.className = "ghost-button feedback-icon-button";
    helpfulButton.textContent = "👍";
    helpfulButton.setAttribute("aria-label", "Helpful");
    helpfulButton.addEventListener("click", async () => {
      await window.overlayApi.submitFeedback({
        interactionId: options.interactionId,
        helped: true,
      });
      feedbackRow.replaceChildren(document.createTextNode("Feedback saved."));
    });

    const notHelpfulButton = document.createElement("button");
    notHelpfulButton.type = "button";
    notHelpfulButton.className = "ghost-button feedback-icon-button";
    notHelpfulButton.textContent = "👎";
    notHelpfulButton.setAttribute("aria-label", "Not helpful");
    notHelpfulButton.addEventListener("click", async () => {
      await window.overlayApi.submitFeedback({
        interactionId: options.interactionId,
        helped: false,
      });
      feedbackRow.replaceChildren(document.createTextNode("Feedback saved."));
    });

    feedbackRow.append(helpfulButton, notHelpfulButton);
    article.appendChild(feedbackRow);
  }

  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  return article;
}

function addIncomingPayloadMessage(text) {
  if (!text) {
    return null;
  }

  const article = document.createElement("article");
  article.className = "chat-message user incoming-payload";

  const codeCopy = document.createElement("p");
  codeCopy.className = "chat-message-copy incoming-payload-text";
  codeCopy.textContent = text;
  article.appendChild(codeCopy);

  const pastedBadge = document.createElement("span");
  pastedBadge.className = "incoming-pasted-badge";
  pastedBadge.textContent = "PASTED";
  article.appendChild(pastedBadge);

  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  return article;
}

function createPendingAssistantMessage(label) {
  const article = document.createElement("article");
  article.className = "chat-message assistant pending";

  const meta = document.createElement("p");
  meta.className = "chat-message-meta";
  meta.textContent = label;

  const paragraph = document.createElement("p");
  paragraph.className = "chat-message-copy";

  const thinking = document.createElement("span");
  thinking.className = "thinking-indicator";
  thinking.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>';
  paragraph.appendChild(thinking);

  article.append(meta, paragraph);
  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;

  return {
    article,
    paragraph,
    meta,
  };
}

async function streamTextToParagraph(paragraph, text) {
  paragraph.textContent = "";

  for (let index = 0; index < text.length; index += STREAM_CHUNK_SIZE) {
    paragraph.textContent += text.slice(index, index + STREAM_CHUNK_SIZE);
    chatThread.scrollTop = chatThread.scrollHeight;
    await new Promise((resolve) => {
      window.setTimeout(resolve, STREAM_INTERVAL_MS);
    });
  }
}

async function resolvePendingAssistantMessage(pendingMessage, result) {
  pendingMessage.article.classList.remove("pending");
  await streamTextToParagraph(pendingMessage.paragraph, result.answer);

  if (result.nextStep) {
    pendingMessage.meta.textContent = `Next: ${result.nextStep}`;
  } else {
    pendingMessage.meta.remove();
  }

  if (result.interactionId) {
    const feedbackRow = document.createElement("div");
    feedbackRow.className = "chat-feedback-row";

    const helpfulButton = document.createElement("button");
    helpfulButton.type = "button";
    helpfulButton.className = "ghost-button feedback-icon-button";
    helpfulButton.textContent = "👍";
    helpfulButton.setAttribute("aria-label", "Helpful");
    helpfulButton.addEventListener("click", async () => {
      await window.overlayApi.submitFeedback({
        interactionId: result.interactionId,
        helped: true,
      });
      feedbackRow.replaceChildren(document.createTextNode("Feedback saved."));
    });

    const notHelpfulButton = document.createElement("button");
    notHelpfulButton.type = "button";
    notHelpfulButton.className = "ghost-button feedback-icon-button";
    notHelpfulButton.textContent = "👎";
    notHelpfulButton.setAttribute("aria-label", "Not helpful");
    notHelpfulButton.addEventListener("click", async () => {
      await window.overlayApi.submitFeedback({
        interactionId: result.interactionId,
        helped: false,
      });
      feedbackRow.replaceChildren(document.createTextNode("Feedback saved."));
    });

    feedbackRow.append(helpfulButton, notHelpfulButton);
    pendingMessage.article.appendChild(feedbackRow);
  }
}

function failPendingAssistantMessage(pendingMessage, errorMessage) {
  pendingMessage.article.classList.remove("pending");
  pendingMessage.article.classList.add("error");
  pendingMessage.paragraph.textContent = errorMessage;
  pendingMessage.meta.textContent = "Request failed";
}

function ensureScreenshotStatusRow() {
  if (screenshotStatusRow) {
    return screenshotStatusRow;
  }

  screenshotStatusRow = document.createElement("div");
  screenshotStatusRow.className = "chat-feedback-row";
  screenshotStatusRow.hidden = true;
  chatForm.before(screenshotStatusRow);
  return screenshotStatusRow;
}

function renderScreenshotStatus() {
  const row = ensureScreenshotStatusRow();
  row.replaceChildren();

  if (!screenshotDataUrl) {
    row.hidden = true;
    return;
  }

  row.hidden = false;

  const status = document.createElement("span");
  status.textContent = "Screenshot attached";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "ghost-button";
  clearButton.textContent = "Remove";
  clearButton.addEventListener("click", () => {
    screenshotDataUrl = null;
    renderScreenshotStatus();
  });

  row.append(status, clearButton);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function runClickFunction(clickFunctionName) {
  if (typeof clickFunctionName !== "string" || !clickFunctionName.trim()) {
    return;
  }

  const normalizedName = clickFunctionName.trim();
  const clickTargets = {
    "theme-icon-toggle": themeIconToggle,
    "shrink-window": shrinkWindow,
    "stop-session": stopSessionButton,
    "close-window": closeWindow,
    "compact-close-window": compactCloseWindow,
    "restore-window": restoreWindow,
    toggleTheme: themeIconToggle,
    minimizeToDock: shrinkWindow,
    stopSession: stopSessionButton,
    closeWindow,
    expandWindow: restoreWindow,
  };

  const target =
    clickTargets[normalizedName] || document.getElementById(normalizedName);
  if (target instanceof HTMLElement) {
    target.click();
  }
}

function normalizeIncomingPayload(payload) {
  const rawActionType =
    typeof payload.actionType === "string"
      ? payload.actionType
      : typeof payload.action_type === "string"
        ? payload.action_type
        : "chat";
  const actionType = rawActionType.trim() || "chat";
  const selectedText =
    typeof payload.selectedText === "string"
      ? payload.selectedText.trim()
      : typeof payload.selected_text === "string"
        ? payload.selected_text.trim()
        : typeof payload.text === "string"
          ? payload.text.trim()
          : "";

  return {
    actionType,
    actionLabel: ACTION_LABELS[actionType] || actionType,
    selectedText,
    surroundingText:
      typeof payload.surroundingText === "string"
        ? payload.surroundingText.trim()
        : typeof payload.surrounding_text === "string"
          ? payload.surrounding_text.trim()
          : null,
    pageTitle:
      typeof payload.pageTitle === "string"
        ? payload.pageTitle.trim()
        : typeof payload.page_title === "string"
          ? payload.page_title.trim()
          : null,
    pageUrl:
      typeof payload.pageUrl === "string"
        ? payload.pageUrl.trim()
        : typeof payload.page_url === "string"
          ? payload.page_url.trim()
          : null,
    userNote:
      typeof payload.userNote === "string"
        ? payload.userNote.trim()
        : typeof payload.user_note === "string"
          ? payload.user_note.trim()
          : null,
    screenshotDataUrl:
      typeof payload.screenshotDataUrl === "string"
        ? payload.screenshotDataUrl
        : typeof payload.screenshot_data_url === "string"
          ? payload.screenshot_data_url
          : null,
    clickFunction:
      typeof payload.click_function === "string"
        ? payload.click_function.trim()
        : typeof payload.clickFunction === "string"
          ? payload.clickFunction.trim()
          : "",
  };
}

function buildAssistPayload(normalizedPayload) {
  const fallbackSelection =
    normalizedPayload.selectedText ||
    normalizedPayload.pageTitle ||
    normalizedPayload.actionLabel;

  return {
    classId: currentSession.classId,
    sessionId: currentSession.sessionId || undefined,
    actionType: normalizedPayload.actionType,
    selectedText: fallbackSelection,
    surroundingText: normalizedPayload.surroundingText,
    pageTitle: normalizedPayload.pageTitle || currentSession.className || null,
    pageUrl: normalizedPayload.pageUrl || null,
    userNote:
      normalizedPayload.userNote ||
      currentSession.sessionNotes ||
      null,
    screenshotDataUrl:
      normalizedPayload.screenshotDataUrl || screenshotDataUrl || null,
  };
}

async function executeAssistRequest(normalizedPayload) {
  if (!currentSession || !currentSession.classId) {
    addMessage(
      "assistant",
      "Start a class session from Home before sending SideClick actions.",
    );
    return;
  }

  addMessage("user", normalizedPayload.actionLabel);
  if (normalizedPayload.actionType !== "chat" && normalizedPayload.selectedText) {
    addIncomingPayloadMessage(normalizedPayload.selectedText);
  }
  const pendingMessage = createPendingAssistantMessage(
    `${normalizedPayload.actionLabel}...`,
  );

  try {
    const result = await window.overlayApi.assist(
      buildAssistPayload(normalizedPayload),
    );

    screenshotDataUrl = null;
    renderScreenshotStatus();
    await resolvePendingAssistantMessage(pendingMessage, result);
  } catch (error) {
    failPendingAssistantMessage(
      pendingMessage,
      error instanceof Error ? error.message : "The assistant request failed.",
    );
  }
}

function handleIncomingPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return;
  }

  const normalizedPayload = normalizeIncomingPayload(payload);
  runClickFunction(normalizedPayload.clickFunction);

  if (!normalizedPayload.selectedText) {
    return;
  }

  void executeAssistRequest(normalizedPayload);
}

function applySession(session) {
  currentSession = session;
  if (!session) {
    sessionClassLabel.textContent = "No active class";
    sessionNameLabel.textContent = "No active session";
    return;
  }

  sessionClassLabel.textContent = session.className || "Class";
  sessionNameLabel.textContent = session.sessionName || "Session";
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

themeIconToggle.addEventListener("click", async () => {
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemeState(result);
});

shrinkWindow.addEventListener("click", async () => {
  await window.overlayApi.minimizeToDock();
});

stopSessionButton.addEventListener("click", async () => {
  await window.overlayApi.stopSession();
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

chatInput.addEventListener("paste", async (event) => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));

  if (!imageItem) {
    return;
  }

  const file = imageItem.getAsFile();
  if (!file) {
    return;
  }

  event.preventDefault();

  try {
    screenshotDataUrl = await readFileAsDataUrl(file);
    renderScreenshotStatus();
    addMessage(
      "assistant",
      "Screenshot attached. Send your message when you're ready.",
    );
  } catch (error) {
    addMessage(
      "assistant",
      error instanceof Error
        ? error.message
        : "Could not attach the screenshot.",
    );
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) {
    return;
  }

  chatInput.value = "";
  await executeAssistRequest({
    actionType: "chat",
    actionLabel: ACTION_LABELS.chat,
    selectedText: value,
    surroundingText: null,
    pageTitle: currentSession?.className || null,
    pageUrl: null,
    userNote: currentSession?.sessionNotes || null,
    screenshotDataUrl,
    clickFunction: "",
  });
});

window.overlayApi.onThemeChanged(applyThemeState);
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
window.overlayApi.onSessionChanged(applySession);
window.overlayApi.onIncomingPayload(handleIncomingPayload);

window.addEventListener("DOMContentLoaded", async () => {
  const session = await window.overlayApi.getCurrentSession();
  applySession(session);
  attachResizeHandle(resizeHandle);
  renderScreenshotStatus();
});

