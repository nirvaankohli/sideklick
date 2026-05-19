const NATIVE_HOST_NAME = "com.sideklick.desktop_bridge";
const RESTORE_CLICK_FUNCTION = "restore-window";

const MENU_ITEMS = [
  {
    id: "sideclick-open-chat",
    title: "Open SideKlick",
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

function sendNativeMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(
      NATIVE_HOST_NAME,
      payload,
      (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error || "Native host rejected request"));
          return;
        }

        resolve(response);
      },
    );
  });
}

function getMenuItemById(menuItemId) {
  return MENU_ITEMS.find((item) => item.id === menuItemId) || null;
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.action.onClicked.addListener(() => {
  void openSideKlick();
});

async function openSideKlick() {
  try {
    await sendNativeMessage({
      action_type: "chat",
      selected_text: "",
      surrounding_text: null,
      page_title: "",
      page_url: "",
      user_note: "",
      screenshot_data_url: null,
      click_function: RESTORE_CLICK_FUNCTION,
    });
  } catch (error) {
    console.error("Failed to open SideKlick via native host:", error);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuClick(info, tab);
});

async function handleContextMenuClick(info, tab) {
  const menuItem = getMenuItemById(info.menuItemId);
  if (!menuItem) {
    return;
  }

  const selectionText =
    typeof info.selectionText === "string" ? info.selectionText.trim() : "";
  const pageTitle = typeof tab?.title === "string" ? tab.title : "";
  const pageUrl = typeof tab?.url === "string" ? tab.url : "";

  try {
    await sendNativeMessage({
      action_type: menuItem.actionType,
      selected_text: menuItem.buildSelectedText({
        selectionText,
        pageTitle,
        pageUrl,
      }),
      surrounding_text: null,
      page_title: pageTitle,
      page_url: pageUrl,
      user_note: "",
      screenshot_data_url: null,
      click_function: RESTORE_CLICK_FUNCTION,
    });
  } catch (error) {
    console.error(`Failed to send ${menuItem.id} via native host:`, error);
  }
}
