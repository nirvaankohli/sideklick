const root = document.querySelector(".window-shell");
const themeIconToggle = document.querySelector("#theme-icon-toggle");
const shrinkWindow = document.querySelector("#shrink-window");
const stopSessionButton = document.querySelector("#stop-session");
const closeWindow = document.querySelector("#close-window");
const compactCloseWindow = document.querySelector("#compact-close-window");
const restoreWindow = document.querySelector("#restore-window");
const compactStarButton = document.querySelector("#compact-star-button");
const sessionClassLabel = document.querySelector("#session-class-label");
const sessionNameLabel = document.querySelector("#session-name-label");
const chatThread = document.querySelector("#chat-thread");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatAttachTrigger = document.querySelector("#chat-attach-trigger");
const chatAttachMenu = document.querySelector("#chat-attach-menu");
const attachScreenshotButton = document.querySelector("#attach-screenshot-button");
const attachClipboardButton = document.querySelector("#attach-clipboard-button");
const resizeHandle = document.querySelector("#resize-handle");

document.body.dataset.windowMode = root?.dataset.mode || "expanded";

const ACTION_LABELS = {
  chat: "Ask SideKlick",
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
const LUCIDE_ICON_NODES = {
  copy: [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
  ],
  thumbsUp: [
    ["path", { d: "M7 10v12" }],
    [
      "path",
      {
        d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
      },
    ],
  ],
  thumbsDown: [
    ["path", { d: "M17 14V2" }],
    [
      "path",
      {
        d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",
      },
    ],
  ],
};

let currentTone = "light";
let currentSession = null;
let screenshotDataUrl = null;
let clipboardAttachmentText = null;
let attachmentStatusRow = null;
let fitTextFrame = null;

function fitTextToBox(element, minimumFontSize = 8) {
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(source) {
  const codeSpans = [];
  const withCodePlaceholders = source.replace(/`([^`]+)`/g, (_match, code) => {
    const placeholder = `@@CODE${codeSpans.length}@@`;
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

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
  const normalized = source.replace(/\r\n/g, "\n").trim();
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

    blocks.push(
      `<p>${renderInlineMarkdown(paragraphLines.join(" ")).replace(/\n/g, "<br>")}</p>`,
    );
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

function setAssistantMessageContent(container, copy) {
  container.innerHTML = renderMarkdown(copy);
}

function applyThemeState({ shouldUseDarkColors }) {
  currentTone = shouldUseDarkColors ? "dark" : "light";
  root.dataset.tone = currentTone;
}

function applyTransparencyPreference(preferences) {
  const transparencyMode =
    preferences?.transparencyMode === "reduced" ||
    preferences?.transparencyMode === "solid"
      ? preferences.transparencyMode
      : preferences?.reduceTransparency
        ? "reduced"
        : "normal";

  root.dataset.transparencyMode = transparencyMode;
  root.dataset.reduceTransparency =
    transparencyMode !== "normal" ? "true" : "false";
}

function setMode(mode) {
  root.dataset.mode = mode;
  document.body.dataset.windowMode = mode;
}

function createLucideIcon(nodes, label) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "feedback-icon-svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.85");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");

  for (const [tagName, attributes] of nodes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      node.setAttribute(key, value);
    });
    icon.appendChild(node);
  }

  const text = document.createElement("span");
  text.className = "visually-hidden";
  text.textContent = label;

  const wrap = document.createDocumentFragment();
  wrap.append(icon, text);
  return wrap;
}

window.overlayApi.onPreferencesChanged?.((preferences) => {
  applyTransparencyPreference(preferences);
});

async function copyToClipboard(value) {
  if (window.overlayApi?.writeClipboardText) {
    try {
      window.overlayApi.writeClipboardText(value);
      return;
    } catch (err) {
      console.warn("overlayApi.writeClipboardText failed, falling back", err);
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back", err);
    }
  }

  try {
    const tempInput = document.createElement("textarea");
    tempInput.value = value;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  } catch (err) {
    console.error("ExecCommand copy failed", err);
  }
}

function createFeedbackRow(interactionId, messageCopy) {
  const feedbackRow = document.createElement("div");
  feedbackRow.className = "chat-feedback-row";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "ghost-button feedback-icon-button";
  copyButton.setAttribute("aria-label", "Copy response");
  copyButton.append(createLucideIcon(LUCIDE_ICON_NODES.copy, "Copy response"));
  copyButton.addEventListener("click", async () => {
    await copyToClipboard(messageCopy);
    const statusText = document.createElement("span");
    statusText.className = "feedback-status-text";
    statusText.textContent = "Copied.";
    feedbackRow.replaceChildren(statusText);
    setTimeout(() => {
      feedbackRow.replaceChildren(copyButton, helpfulButton, notHelpfulButton);
    }, 1000);
  });

  const helpfulButton = document.createElement("button");
  helpfulButton.type = "button";
  helpfulButton.className = "ghost-button feedback-icon-button";
  helpfulButton.setAttribute("aria-label", "Helpful");
  helpfulButton.append(
    createLucideIcon(LUCIDE_ICON_NODES.thumbsUp, "Helpful"),
  );
  helpfulButton.addEventListener("click", async () => {
    await window.overlayApi.submitFeedback({
      interactionId,
      helped: true,
    });
    const statusText = document.createElement("span");
    statusText.className = "feedback-status-text";
    statusText.textContent = "Feedback saved.";
    feedbackRow.replaceChildren(statusText);
  });

  const notHelpfulButton = document.createElement("button");
  notHelpfulButton.type = "button";
  notHelpfulButton.className = "ghost-button feedback-icon-button";
  notHelpfulButton.setAttribute("aria-label", "Not helpful");
  notHelpfulButton.append(
    createLucideIcon(LUCIDE_ICON_NODES.thumbsDown, "Not helpful"),
  );
  notHelpfulButton.addEventListener("click", async () => {
    await window.overlayApi.submitFeedback({
      interactionId,
      helped: false,
    });
    const statusText = document.createElement("span");
    statusText.className = "feedback-status-text";
    statusText.textContent = "Feedback saved.";
    feedbackRow.replaceChildren(statusText);
  });

  feedbackRow.append(copyButton, helpfulButton, notHelpfulButton);
  return feedbackRow;
}

function addMessage(role, copy, options = {}) {
  const article = document.createElement("article");
  article.className = `chat-message ${role}`;

  const content = document.createElement("div");
  content.className = "chat-message-copy";
  if (role === "assistant") {
    setAssistantMessageContent(content, copy);
  } else {
    content.textContent = copy;
    content.dataset.fitText = "true";
  }
  article.appendChild(content);

  if (options.meta) {
    const meta = document.createElement("p");
    meta.className = "chat-message-meta";
    meta.textContent = options.meta;
    if (role !== "assistant") {
      meta.dataset.fitText = "true";
    }
    article.appendChild(meta);
  }

  if (role === "assistant" && options.interactionId) {
    article.appendChild(createFeedbackRow(options.interactionId, copy));
  }

  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  scheduleFitText();
  return article;
}

function addIncomingPayloadMessage(text) {
  return addAttachmentTextMessage(text, {
    badge: "PASTED",
    className: "incoming-payload",
  });
}

function addAttachmentTextMessage(
  text,
  {
    badge = "ATTACHED",
    className = "incoming-payload",
  } = {},
) {
  if (!text) {
    return null;
  }

  const article = document.createElement("article");
  article.className = `chat-message user ${className}`;

  const codeCopy = document.createElement("div");
  codeCopy.className = "chat-message-copy incoming-payload-text";
  codeCopy.textContent = text.trim();
  codeCopy.dataset.fitText = "true";
  article.appendChild(codeCopy);

  const pastedBadge = document.createElement("span");
  pastedBadge.className = "incoming-pasted-badge";
  pastedBadge.textContent = badge;
  article.appendChild(pastedBadge);

  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  scheduleFitText();
  return article;
}

function addAttachmentImageMessage(dataUrl, badge = "SCREENSHOT") {
  if (!dataUrl) {
    return null;
  }

  const article = document.createElement("article");
  article.className = "chat-message user incoming-payload incoming-payload-image-card";

  const preview = document.createElement("img");
  preview.className = "incoming-payload-image";
  preview.src = dataUrl;
  preview.alt = `${badge.toLowerCase()} attachment`;
  article.appendChild(preview);

  const pastedBadge = document.createElement("span");
  pastedBadge.className = "incoming-pasted-badge";
  pastedBadge.textContent = badge;
  article.appendChild(pastedBadge);

  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  return article;
}

function createPendingAssistantMessage(label) {
  const article = document.createElement("article");
  article.className = "chat-message assistant pending";

  const paragraph = document.createElement("div");
  paragraph.className = "chat-message-copy";
  paragraph.setAttribute("aria-label", label);

  const thinking = document.createElement("span");
  thinking.className = "thinking-indicator";
  thinking.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>';
  paragraph.appendChild(thinking);

  article.appendChild(paragraph);
  chatThread.appendChild(article);
  chatThread.scrollTop = chatThread.scrollHeight;
  scheduleFitText();

  return {
    article,
    paragraph,
  };
}

async function streamTextToParagraph(paragraph, text) {
  paragraph.textContent = "";

  for (let index = 0; index < text.length; index += STREAM_CHUNK_SIZE) {
    paragraph.textContent += text.slice(index, index + STREAM_CHUNK_SIZE);
    chatThread.scrollTop = chatThread.scrollHeight;
    scheduleFitText();
    await new Promise((resolve) => {
      window.setTimeout(resolve, STREAM_INTERVAL_MS);
    });
  }
}

async function resolvePendingAssistantMessage(pendingMessage, result) {
  pendingMessage.article.classList.remove("pending");
  if (result?.screenViewed === true) {
    const meta = document.createElement("p");
    meta.className = "chat-message-meta screen-viewed-meta";
    meta.textContent = "Viewed your screen";
    pendingMessage.article.insertBefore(meta, pendingMessage.paragraph);
  }
  await streamTextToParagraph(pendingMessage.paragraph, result.answer);
  setAssistantMessageContent(pendingMessage.paragraph, result.answer);

  if (result.interactionId) {
    pendingMessage.article.appendChild(
      createFeedbackRow(result.interactionId, result.answer),
    );
  }
}

function failPendingAssistantMessage(pendingMessage, errorMessage) {
  pendingMessage.article.classList.remove("pending");
  pendingMessage.article.classList.add("error");
  pendingMessage.paragraph.textContent = errorMessage;
}

function ensureAttachmentStatusRow() {
  if (attachmentStatusRow) {
    return attachmentStatusRow;
  }

  attachmentStatusRow = document.createElement("div");
  attachmentStatusRow.className = "chat-attachment-status-row";
  attachmentStatusRow.hidden = true;
  chatForm.before(attachmentStatusRow);
  return attachmentStatusRow;
}

function createAttachmentChip(label, onRemove) {
  const chip = document.createElement("div");
  chip.className = "chat-attachment-chip";

  const text = document.createElement("span");
  text.className = "chat-attachment-chip-label";
  text.textContent = label;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "ghost-button chat-attachment-chip-remove";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", onRemove);

  chip.append(text, removeButton);
  return chip;
}

function renderAttachmentStatus() {
  const row = ensureAttachmentStatusRow();
  row.replaceChildren();

  if (!screenshotDataUrl && !clipboardAttachmentText) {
    row.hidden = true;
    return;
  }

  row.hidden = false;

  if (screenshotDataUrl) {
    row.append(
      createAttachmentChip("Screenshot attached", () => {
        screenshotDataUrl = null;
        renderAttachmentStatus();
      }),
    );
  }

  if (clipboardAttachmentText) {
    row.append(
      createAttachmentChip("Clipboard attached", () => {
        clipboardAttachmentText = null;
        renderAttachmentStatus();
      }),
    );
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function combineUserNotes(...parts) {
  const filteredParts = parts
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim());
  return filteredParts.length > 0 ? filteredParts.join("\n\n") : null;
}

async function maybeCaptureAutomaticScreenshot(normalizedPayload, options = {}) {
  if (options.forceNoScreenshot) {
    return null;
  }

  if (normalizedPayload.screenshotDataUrl || screenshotDataUrl) {
    return normalizedPayload.screenshotDataUrl || screenshotDataUrl;
  }

  if (options.suppressAutomaticCapture) {
    return null;
  }

  if (
    typeof window.overlayApi?.getPrivacySettings !== "function" ||
    typeof window.overlayApi?.captureScreenshotAttachment !== "function"
  ) {
    return null;
  }

  const privacySettings = await window.overlayApi.getPrivacySettings();
  if (privacySettings?.screenshotPolicy !== "automatic") {
    return null;
  }

  try {
    return await window.overlayApi.captureScreenshotAttachment();
  } catch (error) {
    addMessage(
      "assistant",
      error instanceof Error
        ? error.message
        : "Could not capture the automatic screenshot.",
    );
    return null;
  }
}

function closeAttachmentMenu() {
  if (!chatAttachMenu || !chatAttachTrigger) {
    return;
  }

  chatAttachMenu.hidden = true;
  chatAttachTrigger.setAttribute("aria-expanded", "false");
}

function openAttachmentMenu() {
  if (!chatAttachMenu || !chatAttachTrigger) {
    return;
  }

  chatAttachMenu.hidden = false;
  chatAttachTrigger.setAttribute("aria-expanded", "true");
}

function toggleAttachmentMenu() {
  if (!chatAttachMenu) {
    return;
  }

  if (chatAttachMenu.hidden) {
    openAttachmentMenu();
    return;
  }

  closeAttachmentMenu();
}

function runClickFunction(clickFunctionName) {
  if (typeof clickFunctionName !== "string" || !clickFunctionName.trim()) {
    return;
  }

  const normalizedName = clickFunctionName.trim();
  if (normalizedName === "restore-window" && restoreWindow instanceof HTMLElement) {
    restoreWindow.click();
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

function buildAssistPayload(normalizedPayload, options = {}) {
  const fallbackSelection =
    normalizedPayload.selectedText ||
    options.clipboardAttachmentText ||
    normalizedPayload.pageTitle ||
    normalizedPayload.actionLabel;

  const payload = {
    classId: currentSession.classId,
    sessionId: currentSession.sessionId || undefined,
    actionType: normalizedPayload.actionType,
    selectedText: fallbackSelection,
    surroundingText: normalizedPayload.surroundingText,
    pageTitle: normalizedPayload.pageTitle || currentSession.className || null,
    pageUrl: normalizedPayload.pageUrl || null,
    userNote: combineUserNotes(
      normalizedPayload.userNote,
      currentSession.sessionNotes,
      options.clipboardAttachmentText
        ? `Clipboard attachment:\n${options.clipboardAttachmentText}`
        : null,
    ),
    screenshotDataUrl:
      options.screenshotDataUrl || null,
  };

  if (options.requestMode === "smart") {
    payload.requestMode = "smart";
    payload.screenshotPolicy = options.screenshotPolicy || "automatic";
  }

  return payload;
}

async function executeAssistRequest(normalizedPayload, options = {}) {
  if (!currentSession || !currentSession.classId) {
    addMessage(
      "assistant",
      "Start a class session from Home before sending SideKlick actions.",
    );
    return;
  }

  const aiStatus =
    typeof window.overlayApi?.getAiBackendStatus === "function"
      ? await window.overlayApi.getAiBackendStatus()
      : { available: true };
  if (aiStatus?.available === false) {
    addMessage(
      "assistant",
      aiStatus.message ||
        "Add OPENAI_API_KEY to .env.backend and restart SideKlick to use AI assist on this device.",
    );
    return;
  }

  const privacySettings =
    typeof window.overlayApi?.getPrivacySettings === "function"
      ? await window.overlayApi.getPrivacySettings()
      : null;
  const canUseSmartScreenRequest =
    !options.forceNoScreenshot &&
    privacySettings?.screenshotPolicy === "automatic";
  let effectiveScreenshotDataUrl =
    normalizedPayload.screenshotDataUrl || screenshotDataUrl || null;
  if (!canUseSmartScreenRequest && !effectiveScreenshotDataUrl) {
    effectiveScreenshotDataUrl =
      (await maybeCaptureAutomaticScreenshot(normalizedPayload, options)) || null;
  }
  const effectiveClipboardAttachmentText = clipboardAttachmentText;

  if (normalizedPayload.actionType === "chat") {
    addMessage(
      "user",
      normalizedPayload.selectedText.trim() || "Attached context",
    );
  } else {
    addMessage("user", normalizedPayload.actionLabel);
  }

  if (normalizedPayload.actionType !== "chat" && normalizedPayload.selectedText) {
    addIncomingPayloadMessage(normalizedPayload.selectedText);
  }

  if (effectiveClipboardAttachmentText) {
    addAttachmentTextMessage(effectiveClipboardAttachmentText, {
      badge: "CLIPBOARD",
      className: "incoming-payload",
    });
  }

  const isManuallyAttached = !!(normalizedPayload.screenshotDataUrl || screenshotDataUrl);
  if (isManuallyAttached && effectiveScreenshotDataUrl && !options.forceNoScreenshot) {
    addAttachmentImageMessage(effectiveScreenshotDataUrl);
  }

  const pendingMessage = createPendingAssistantMessage(
    `${normalizedPayload.actionLabel}...`,
  );

  try {
    let result = await window.overlayApi.assist(
      buildAssistPayload(normalizedPayload, {
        screenshotDataUrl: effectiveScreenshotDataUrl,
        clipboardAttachmentText: effectiveClipboardAttachmentText,
        requestMode: canUseSmartScreenRequest ? "smart" : undefined,
        screenshotPolicy: privacySettings?.screenshotPolicy,
      }),
      {
        suppressAutomaticCapture:
          canUseSmartScreenRequest ||
          options.suppressAutomaticCapture === true,
      },
    );

    if (
      result?.requestMode === "smart" &&
      result?.needsScreenshot === true &&
      canUseSmartScreenRequest
    ) {
      effectiveScreenshotDataUrl =
        (await maybeCaptureAutomaticScreenshot(normalizedPayload, {
          ...options,
          suppressAutomaticCapture: false,
        })) || null;
      if (!effectiveScreenshotDataUrl) {
        throw new Error("SideKlick wanted to view your screen, but no screenshot was captured.");
      }
      result = await window.overlayApi.assist(
        buildAssistPayload(normalizedPayload, {
          screenshotDataUrl: effectiveScreenshotDataUrl,
          clipboardAttachmentText: effectiveClipboardAttachmentText,
          requestMode: "smart",
          screenshotPolicy: privacySettings?.screenshotPolicy,
        }),
        {
          suppressAutomaticCapture: true,
        },
      );
    }

    screenshotDataUrl = null;
    clipboardAttachmentText = null;
    renderAttachmentStatus();
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

  void (async () => {
    await executeAssistRequest(normalizedPayload);
  })();
}

function applySession(session) {
  currentSession = session;
  const hasSession = !!session;
  if (root) {
    root.dataset.hasSession = hasSession ? "true" : "false";
  }

  // Update compact strip buttons for active session state
  const restoreBtn = document.querySelector("#restore-window");
  const closeBtn = document.querySelector("#compact-close-window");
  if (restoreBtn && closeBtn) {
    if (hasSession) {
      restoreBtn.innerHTML = `Ask <i class="icon-svg" data-lucide="sparkle"></i>`;
      restoreBtn.setAttribute("aria-label", "Expand overlay and ask");
      closeBtn.innerHTML = `<i class="icon-svg" data-lucide="square"></i>`;
      closeBtn.setAttribute("aria-label", "Stop session");
    } else {
      restoreBtn.innerHTML = `Open`;
      restoreBtn.setAttribute("aria-label", "Expand overlay and open");
      closeBtn.innerHTML = `<i class="icon-svg" data-lucide="x"></i>`;
      closeBtn.setAttribute("aria-label", "Close window");
    }
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  if (!session) {
    sessionClassLabel.textContent = "No active class";
    sessionNameLabel.textContent = "No active session";
    scheduleFitText();
    return;
  }

  sessionClassLabel.textContent = session.className || "Class";
  sessionNameLabel.textContent = session.sessionName || "Session";
  sessionClassLabel.dataset.fitText = "true";
  sessionNameLabel.dataset.fitText = "true";
  scheduleFitText();
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

themeIconToggle?.addEventListener("click", async () => {
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
  if (root && root.dataset.hasSession === "true") {
    await window.overlayApi.stopSession();
  } else {
    await window.overlayApi.closeWindow();
  }
});

restoreWindow.addEventListener("click", async () => {
  await window.overlayApi.expandWindow();
});

compactStarButton?.addEventListener("click", async () => {
  const nextSource = currentTone === "dark" ? "light" : "dark";
  const result = await window.overlayApi.setThemeSource(nextSource);
  applyThemeState(result);
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
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
    renderAttachmentStatus();
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
  if (!value && !screenshotDataUrl && !clipboardAttachmentText) {
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

if (chatAttachTrigger) {
  chatAttachTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAttachmentMenu();
  });
}

if (attachScreenshotButton) {
  attachScreenshotButton.addEventListener("click", async () => {
    closeAttachmentMenu();

    try {
      screenshotDataUrl = await window.overlayApi.captureScreenshotAttachment();
      renderAttachmentStatus();
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
}

if (attachClipboardButton) {
  attachClipboardButton.addEventListener("click", async () => {
    closeAttachmentMenu();

    try {
      const attachment = await window.overlayApi.readClipboardAttachment();
      if (!attachment) {
        addMessage("assistant", "Clipboard is empty.");
        return;
      }

      if (attachment.type === "image" && attachment.dataUrl) {
        screenshotDataUrl = attachment.dataUrl;
        renderAttachmentStatus();
        addMessage(
          "assistant",
          "Clipboard image attached. Send your message when you're ready.",
        );
        return;
      }

      if (attachment.type === "text" && attachment.text) {
        clipboardAttachmentText = attachment.text;
        renderAttachmentStatus();
        addMessage(
          "assistant",
          "Clipboard text attached. Send your message when you're ready.",
        );
        return;
      }

      addMessage("assistant", "Clipboard does not contain a supported attachment.");
    } catch (error) {
      addMessage(
        "assistant",
        error instanceof Error
          ? error.message
          : "Could not attach the clipboard content.",
      );
    }
  });
}

document.addEventListener("click", (event) => {
  if (
    chatAttachMenu &&
    !chatAttachMenu.hidden &&
    (!(event.target instanceof Element) ||
      !event.target.closest(".chat-attach-shell"))
  ) {
    closeAttachmentMenu();
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  const session = await window.overlayApi.getCurrentSession();
  applySession(session);
  const preferences =
    typeof window.overlayApi.getPreferences === "function"
      ? await window.overlayApi.getPreferences()
      : {};
  applyTransparencyPreference(preferences);
  attachResizeHandle(resizeHandle);
  renderAttachmentStatus();
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

window.addEventListener("resize", scheduleFitText);
