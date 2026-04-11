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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function addMessage(role, copy, options = {}) {
  const article = document.createElement("article");
  article.className = `chat-message ${role}`;
  article.innerHTML = `<p class="chat-message-copy">${escapeHtml(copy)}</p>`;

  if (role === "assistant" && options.interactionId) {
    const feedbackRow = document.createElement("div");
    feedbackRow.className = "chat-feedback-row";

    const helpfulButton = document.createElement("button");
    helpfulButton.type = "button";
    helpfulButton.className = "ghost-button";
    helpfulButton.textContent = "Helped";
    helpfulButton.addEventListener("click", async () => {
      await window.overlayApi.submitFeedback({
        interactionId: options.interactionId,
        helped: true,
      });
      feedbackRow.replaceChildren(document.createTextNode("Feedback saved."));
    });

    const notHelpfulButton = document.createElement("button");
    notHelpfulButton.type = "button";
    notHelpfulButton.className = "ghost-button";
    notHelpfulButton.textContent = "Not helpful";
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
    addMessage("assistant", "Screenshot attached. Send your message when you're ready.");
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

  if (!currentSession || !currentSession.classId) {
    addMessage("assistant", "Start a class session from Home before sending a chat request.");
    return;
  }

  addMessage("user", value);
  chatInput.value = "";

  try {
    const result = await window.overlayApi.assist({
      classId: currentSession.classId,
      actionType: "chat",
      selectedText: value,
      surroundingText: null,
      pageTitle: currentSession.className || null,
      pageUrl: null,
      userNote: currentSession.sessionNotes || null,
      screenshotDataUrl,
    });

    screenshotDataUrl = null;
    renderScreenshotStatus();

    addMessage("assistant", result.answer, {
      interactionId: result.interactionId,
    });
  } catch (error) {
    addMessage(
      "assistant",
      error instanceof Error ? error.message : "The assistant request failed.",
    );
  }
});

window.overlayApi.onThemeChanged(applyThemeState);
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
window.overlayApi.onSessionChanged(applySession);

window.addEventListener("DOMContentLoaded", async () => {
  const session = await window.overlayApi.getCurrentSession();
  applySession(session);
  attachResizeHandle(resizeHandle);
  renderScreenshotStatus();
});
