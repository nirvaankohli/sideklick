const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { JSDOM } = require("jsdom");

function createDom() {
  return new JSDOM(
    `<!doctype html>
<html>
  <body>
    <main class="window-shell" data-mode="expanded" data-tone="light">
      <button id="theme-icon-toggle"></button>
      <button id="shrink-window"></button>
      <button id="stop-session"></button>
      <button id="close-window"></button>
      <button id="compact-close-window"></button>
      <button id="restore-window"></button>
      <p id="session-class-label"></p>
      <h1 id="session-name-label"></h1>
      <p id="session-mode-label"></p>
      <div id="chat-thread"></div>
      <form id="chat-form"><textarea id="chat-input"></textarea></form>
      <button id="resize-handle"></button>
    </main>
  </body>
</html>`,
    { url: "http://localhost/" },
  );
}

test("incoming payload shows action plus pasted text card and sends the assist request directly", async () => {
  const dom = createDom();

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.FileReader = class FakeFileReader {};

  let incomingPayloadHandler;
  let expandWindowCalls = 0;
  let assistCalls = 0;
  let submittedPayload = null;

  window.overlayApi = {
    getWindowBounds: async () => ({ width: 100, height: 100 }),
    resizeWindow: async () => ({}),
    setThemeSource: async () => ({ shouldUseDarkColors: false }),
    minimizeToDock: async () => ({}),
    stopSession: async () => ({}),
    closeWindow: async () => ({}),
    expandWindow: async () => {
      expandWindowCalls += 1;
      return {};
    },
    assist: async (payload) => {
      assistCalls += 1;
      submittedPayload = payload;
      return {
        interactionId: 42,
        answer: "It means the variable references the root shell element.",
        nextStep: "Compare it to the chat thread selector.",
      };
    },
    submitFeedback: async () => ({}),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: (callback) => {
      incomingPayloadHandler = callback;
    },
    getCurrentSession: async () => ({
      classId: 7,
      className: "AP Biology",
      sessionName: "Meiosis Review",
      sessionNotes: "Need help with vocab",
    }),
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  incomingPayloadHandler({
    action_type: "explain",
    selected_text: "const root = document.querySelector('.window-shell');",
    page_title: "Renderer notes",
    click_function: "restore-window",
  });

  await new Promise((resolve) => setTimeout(resolve, 700));

  assert.equal(expandWindowCalls, 1);
  assert.equal(assistCalls, 1);
  assert.equal(submittedPayload.actionType, "explain");
  assert.equal(
    submittedPayload.selectedText,
    "const root = document.querySelector('.window-shell');",
  );

  const userMessages = document.querySelectorAll(
    ".chat-message.user:not(.incoming-payload) .chat-message-copy",
  );
  assert.equal(
    userMessages[userMessages.length - 1]?.textContent,
    "Explain this",
  );

  const pastedMessage = document.querySelector(".chat-message.incoming-payload .incoming-payload-text");
  assert.equal(
    pastedMessage?.textContent,
    "const root = document.querySelector('.window-shell');",
  );

  const assistantMessages = document.querySelectorAll(".chat-message.assistant .chat-message-copy");
  const finalAssistantMessage = assistantMessages[assistantMessages.length - 1]?.textContent;
  assert.equal(
    finalAssistantMessage,
    "It means the variable references the root shell element.",
  );

  dom.window.close();
});

test("manual chat submit shows the typed message instead of the action label", async () => {
  const dom = createDom();

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.FileReader = class FakeFileReader {};

  let assistCalls = 0;

  window.overlayApi = {
    getWindowBounds: async () => ({ width: 100, height: 100 }),
    resizeWindow: async () => ({}),
    setThemeSource: async () => ({ shouldUseDarkColors: false }),
    minimizeToDock: async () => ({}),
    stopSession: async () => ({}),
    closeWindow: async () => ({}),
    expandWindow: async () => ({}),
    assist: async () => {
      assistCalls += 1;
      return {
        interactionId: 9,
        answer: "Short answer.",
        nextStep: "Keep going.",
      };
    },
    submitFeedback: async () => ({}),
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: () => {},
    getCurrentSession: async () => ({
      classId: 7,
      className: "AP Biology",
      sessionName: "Meiosis Review",
      sessionNotes: "Need help with vocab",
    }),
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  await new Promise((resolve) => {
    window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    setTimeout(resolve, 0);
  });

  const chatInput = document.querySelector("#chat-input");
  const chatForm = document.querySelector("#chat-form");
  chatInput.value = "What is meiosis?";
  chatForm.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));

  await new Promise((resolve) => setTimeout(resolve, 700));

  assert.equal(assistCalls, 1);
  const userMessages = document.querySelectorAll(
    ".chat-message.user:not(.incoming-payload) .chat-message-copy",
  );
  assert.equal(userMessages[userMessages.length - 1]?.textContent, "What is meiosis?");

  dom.window.close();
});
