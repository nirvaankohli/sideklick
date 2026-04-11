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
const requestList = document.querySelector("#request-list");
const requestSummary = document.querySelector("#request-summary");
const clearResolvedRequestsButton = document.querySelector(
  "#clear-resolved-requests",
);

let currentTone = "light";
let incomingRequestCount = 0;
const incomingRequests = [];

function applyThemeState({ shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
}

function setMode(mode) {
  root.dataset.mode = mode;
}

function addMessage(role, copy) {
  const article = document.createElement("article");
  article.className = `chat-message ${role}`;
  const paragraph = document.createElement("p");
  paragraph.className = "chat-message-copy";
  paragraph.textContent = copy;
  article.appendChild(paragraph);
  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
}

function addIncomingPayloadMessage(text, clickFunctionName) {
  if (text) {
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
  }

  if (clickFunctionName) {
    addMessage("user", clickFunctionName);
  }

  chatThread.scrollTop = chatThread.scrollHeight;
}

function formatRequestPreview(text) {
  if (!text) {
    return "No pasted text attached.";
  }

  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function getPendingRequestCount() {
  return incomingRequests.filter((request) => request.status === "pending")
    .length;
}

function updateRequestSummary() {
  const pendingCount = getPendingRequestCount();
  const resolvedCount = incomingRequests.length - pendingCount;

  if (!incomingRequests.length) {
    requestSummary.textContent = "No queued requests yet.";
    return;
  }

  if (!pendingCount) {
    requestSummary.textContent = `${resolvedCount} resolved request${
      resolvedCount === 1 ? "" : "s"
    }. Inbox is clear.`;
    return;
  }

  requestSummary.textContent = `${pendingCount} pending request${
    pendingCount === 1 ? "" : "s"
  }${resolvedCount ? `, ${resolvedCount} resolved` : ""}.`;
}

function createRequestCard(request) {
  const article = document.createElement("article");
  article.className = "request-card";
  article.dataset.status = request.status;

  const metaRow = document.createElement("div");
  metaRow.className = "request-card-meta";

  const badge = document.createElement("span");
  badge.className = "request-status-badge";
  badge.textContent = request.status;
  metaRow.appendChild(badge);

  const requestId = document.createElement("span");
  requestId.className = "request-id";
  requestId.textContent = request.label;
  metaRow.appendChild(requestId);

  article.appendChild(metaRow);

  if (request.text) {
    const preview = document.createElement("p");
    preview.className = "request-preview";
    preview.textContent = formatRequestPreview(request.text);
    article.appendChild(preview);
  }

  if (request.clickFunction) {
    const actionLabel = document.createElement("p");
    actionLabel.className = "request-action";
    actionLabel.textContent = `Action: ${request.clickFunction}`;
    article.appendChild(actionLabel);
  }

  const actionRow = document.createElement("div");
  actionRow.className = "request-card-actions";

  if (request.status === "pending") {
    const applyButton = document.createElement("button");
    applyButton.className = "panel-button request-action-button";
    applyButton.type = "button";
    applyButton.textContent = "Apply";
    applyButton.addEventListener("click", () => {
      if (request.text || request.clickFunction) {
        addIncomingPayloadMessage(request.text, request.clickFunction);
      }

      runClickFunction(request.clickFunction);
      request.status = "applied";
      renderRequestList();
    });
    actionRow.appendChild(applyButton);

    const dismissButton = document.createElement("button");
    dismissButton.className = "ghost-button request-action-button";
    dismissButton.type = "button";
    dismissButton.textContent = "Dismiss";
    dismissButton.addEventListener("click", () => {
      request.status = "dismissed";
      renderRequestList();
    });
    actionRow.appendChild(dismissButton);
  } else {
    const reopenButton = document.createElement("button");
    reopenButton.className = "ghost-button request-action-button";
    reopenButton.type = "button";
    reopenButton.textContent = "Reopen";
    reopenButton.addEventListener("click", () => {
      request.status = "pending";
      renderRequestList();
    });
    actionRow.appendChild(reopenButton);
  }

  article.appendChild(actionRow);

  return article;
}

function renderRequestList() {
  requestList.replaceChildren();

  if (!incomingRequests.length) {
    const emptyState = document.createElement("article");
    emptyState.className = "request-empty-state";

    const title = document.createElement("p");
    title.className = "empty-title";
    title.textContent = "Inbox is clear";
    emptyState.appendChild(title);

    const copy = document.createElement("p");
    copy.className = "empty-copy";
    copy.textContent =
      "New requests sent to the local chat endpoint will appear here for review.";
    emptyState.appendChild(copy);

    requestList.appendChild(emptyState);
    updateRequestSummary();
    return;
  }

  incomingRequests.forEach((request) => {
    requestList.appendChild(createRequestCard(request));
  });

  updateRequestSummary();
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

function handleIncomingPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return;
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const clickFunction =
    typeof payload.click_function === "string"
      ? payload.click_function.trim()
      : "";

  if (text || clickFunction) {
    incomingRequestCount += 1;
    incomingRequests.unshift({
      id: `${Date.now()}-${incomingRequestCount}`,
      label: `Request ${incomingRequestCount}`,
      text,
      clickFunction,
      status: "pending",
    });
    renderRequestList();
    addMessage(
      "assistant",
      `Queued ${clickFunction || "chat"} request for review in the Request Inbox.`,
    );
  }
}

function applySession(session) {
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

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) {
    return;
  }

  addMessage("user", value);
  addMessage(
    "assistant",
    "Session assistant placeholder response. Connect this to the real model flow next.",
  );
  chatInput.value = "";
});

clearResolvedRequestsButton.addEventListener("click", () => {
  const pendingRequests = incomingRequests.filter(
    (request) => request.status === "pending",
  );
  incomingRequests.splice(0, incomingRequests.length, ...pendingRequests);
  renderRequestList();
});

window.overlayApi.onThemeChanged(applyThemeState);
window.overlayApi.onWindowMode(({ mode }) => setMode(mode));
window.overlayApi.onSessionChanged(applySession);
window.overlayApi.onIncomingPayload(handleIncomingPayload);

window.addEventListener("DOMContentLoaded", async () => {
  const session = await window.overlayApi.getCurrentSession();
  applySession(session);
  attachResizeHandle(resizeHandle);
  renderRequestList();
});
