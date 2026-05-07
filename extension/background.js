const INBOX_URL = "http://localhost:4353";
const RESTORE_CLICK_FUNCTION = "restore-window";
const BRIDGE_AUTH_SECRET = "sideclick-local-dev-secret";
const BRIDGE_REQUEST_TTL_MS = 30 * 1000;
const BRIDGE_EXPIRES_HEADER = "x-sideclick-expires";
const BRIDGE_NONCE_HEADER = "x-sideclick-nonce";
const BRIDGE_SIGNATURE_HEADER = "x-sideclick-signature";

const MENU_ITEMS = [
  {
    id: "sideclick-open-chat",
    title: "Open SideClick",
    contexts: ["page", "selection"],
    actionType: "chat",
    buildSelectedText: () => "",
  },
  {
    id: "sideclick-explain",
    title: "Explain this",
    contexts: ["selection"],
    actionType: "explain",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-connect",
    title: "Connect to what I know",
    contexts: ["selection"],
    actionType: "connect",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-example",
    title: "Give me an example",
    contexts: ["selection"],
    actionType: "example",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-confusing",
    title: "Flag as confusing",
    contexts: ["selection"],
    actionType: "flag_confusing",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-know-this",
    title: "I already know this",
    contexts: ["selection"],
    actionType: "already_know",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-add-notes",
    title: "Add to my notes",
    contexts: ["selection"],
    actionType: "add_notes",
    buildSelectedText: ({ selectionText }) => selectionText,
  },
  {
    id: "sideclick-summarize-page",
    title: "Summarize this page",
    contexts: ["page"],
    actionType: "summarize_page",
    buildSelectedText: ({ pageTitle, pageUrl }) => pageTitle || pageUrl || "Summarize this page",
  },
  {
    id: "sideclick-focus",
    title: "What should I focus on?",
    contexts: ["page"],
    actionType: "focus_page",
    buildSelectedText: ({ pageTitle, pageUrl }) => pageTitle || pageUrl || "What should I focus on?",
  },
];

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    for (const item of MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: item.contexts,
      });
    }
  });
}

function encodeUtf8(value) {
  return new TextEncoder().encode(value);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildSignatureInput({ method, pathname, expires, nonce, body }) {
  return [method.toUpperCase(), pathname, expires, nonce, body].join("\n");
}

async function createBridgeSignature(secret, signatureInput) {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeUtf8(signatureInput),
  );
  return bytesToHex(new Uint8Array(signature));
}

async function sendIncomingPayload(payload) {
  const nonce =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const rawBody = JSON.stringify(payload);
  const expires = String(Date.now() + BRIDGE_REQUEST_TTL_MS);
  const signature = await createBridgeSignature(
    BRIDGE_AUTH_SECRET,
    buildSignatureInput({
      method: "POST",
      pathname: "/",
      expires,
      nonce,
      body: rawBody,
    }),
  );
  const response = await fetch(INBOX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [BRIDGE_NONCE_HEADER]: nonce,
      [BRIDGE_EXPIRES_HEADER]: expires,
      [BRIDGE_SIGNATURE_HEADER]: signature,
    },
    body: rawBody,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `SideClick local inbox returned ${response.status}.`);
  }
}

function getMenuItemById(menuItemId) {
  return MENU_ITEMS.find((item) => item.id === menuItemId) || null;
}

async function captureVisibleTabScreenshot(windowId) {
  try {
    return await chrome.tabs.captureVisibleTab(windowId, {
      format: "png",
    });
  } catch (error) {
    console.error("Failed to capture visible tab screenshot:", error);
    return null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.action.onClicked.addListener(async () => {
  try {
    await sendIncomingPayload({
      action_type: "chat",
      selected_text: "",
      click_function: RESTORE_CLICK_FUNCTION,
    });
  } catch (error) {
    console.error("Failed to open SideClick:", error);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItem = getMenuItemById(info.menuItemId);
  if (!menuItem) {
    return;
  }

  const selectionText =
    typeof info.selectionText === "string" ? info.selectionText.trim() : "";
  const pageTitle = typeof tab?.title === "string" ? tab.title : "";
  const pageUrl = typeof tab?.url === "string" ? tab.url : "";
  const screenshotDataUrl = await captureVisibleTabScreenshot(tab?.windowId);

  try {
    await sendIncomingPayload({
      action_type: menuItem.actionType,
      selected_text: menuItem.buildSelectedText({
        selectionText,
        pageTitle,
        pageUrl,
      }),
      page_title: pageTitle,
      page_url: pageUrl,
      screenshot_data_url: screenshotDataUrl,
      click_function: RESTORE_CLICK_FUNCTION,
    });
  } catch (error) {
    console.error(`Failed to send ${menuItem.id}:`, error);
  }
});
