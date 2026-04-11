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
      <div id="chat-thread"></div>
      <form id="chat-form"><textarea id="chat-input"></textarea></form>
      <button id="clear-resolved-requests"></button>
      <p id="request-summary"></p>
      <div id="request-list"></div>
      <button id="resize-handle"></button>
    </main>
  </body>
</html>`,
    { url: "http://localhost/" },
  );
}

test("incoming payload is queued for review and only runs after apply", async () => {
  const dom = createDom();

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;

  let incomingPayloadHandler;
  let expandWindowCalls = 0;

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
    onThemeChanged: () => {},
    onWindowMode: () => {},
    onSessionChanged: () => {},
    onIncomingPayload: (callback) => {
      incomingPayloadHandler = callback;
    },
    getCurrentSession: async () => null,
  };

  const rendererPath = path.join(__dirname, "..", "src", "renderer.js");
  delete require.cache[require.resolve(rendererPath)];
  require(rendererPath);

  assert.equal(typeof incomingPayloadHandler, "function");

  incomingPayloadHandler({
    text: "const root = document.querySelector('.window-shell');",
    click_function: "restore-window",
  });

  const requestCard = document.querySelector(".request-card");
  assert.ok(requestCard, "Expected request inbox card to be added");

  const requestPreview = requestCard.querySelector(".request-preview")?.textContent;
  assert.equal(
    requestPreview,
    "const root = document.querySelector('.window-shell');",
  );

  const requestAction = requestCard.querySelector(".request-action")?.textContent;
  assert.equal(requestAction, "Action: restore-window");

  const summary = document.querySelector("#request-summary").textContent;
  assert.equal(summary, "1 pending request.");

  await Promise.resolve();
  assert.equal(expandWindowCalls, 0);

  const applyButton = requestCard.querySelector("button");
  assert.ok(applyButton, "Expected apply button to exist");
  applyButton.dispatchEvent(new dom.window.Event("click", { bubbles: true }));

  const payloadMessage = document.querySelector(".chat-message.incoming-payload");
  assert.ok(payloadMessage, "Expected incoming payload message to be added after apply");

  const userMessages = document.querySelectorAll(
    ".chat-message.user .chat-message-copy",
  );
  const lastUserMessage = userMessages[userMessages.length - 1]?.textContent;
  assert.equal(lastUserMessage, "restore-window");

  // Wait one microtask so async click handlers complete.
  await Promise.resolve();
  assert.equal(expandWindowCalls, 1);

  const appliedBadge = document.querySelector(".request-card .request-status-badge")
    ?.textContent;
  assert.equal(appliedBadge, "applied");

  dom.window.close();
});
