const http = require("http");

const DEFAULT_PORT = 4353;
const DEFAULT_HOST = "localhost";

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function normalizeIncomingPayload(parsed) {
  return {
    action_type:
      typeof parsed.action_type === "string"
        ? parsed.action_type
        : typeof parsed.actionType === "string"
          ? parsed.actionType
          : "chat",
    selected_text:
      typeof parsed.selected_text === "string"
        ? parsed.selected_text
        : typeof parsed.selectedText === "string"
          ? parsed.selectedText
          : typeof parsed.text === "string"
            ? parsed.text
            : "",
    surrounding_text:
      typeof parsed.surrounding_text === "string"
        ? parsed.surrounding_text
        : typeof parsed.surroundingText === "string"
          ? parsed.surroundingText
          : null,
    page_title:
      typeof parsed.page_title === "string"
        ? parsed.page_title
        : typeof parsed.pageTitle === "string"
          ? parsed.pageTitle
          : "",
    page_url:
      typeof parsed.page_url === "string"
        ? parsed.page_url
        : typeof parsed.pageUrl === "string"
          ? parsed.pageUrl
          : "",
    user_note:
      typeof parsed.user_note === "string"
        ? parsed.user_note
        : typeof parsed.userNote === "string"
          ? parsed.userNote
          : "",
    screenshot_data_url:
      typeof parsed.screenshot_data_url === "string"
        ? parsed.screenshot_data_url
        : typeof parsed.screenshotDataUrl === "string"
          ? parsed.screenshotDataUrl
          : null,
    click_function:
      typeof parsed.click_function === "string" ? parsed.click_function : "",
  };
}

function createIncomingMessageServer({
  dispatchIncomingPayload,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  log = console,
}) {
  let server = null;

  return {
    start() {
      if (server) {
        return server;
      }

      server = http.createServer(async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
          return;
        }

        try {
          const rawBody = await readRequestBody(req);
          const parsed = rawBody ? JSON.parse(rawBody) : {};
          dispatchIncomingPayload(normalizeIncomingPayload(parsed));
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON payload" }));
        }
      });

      server.on("error", (error) => {
        log.error("Incoming message server error:", error);
      });

      server.listen(port, host, () => {
        log.log(`Incoming message server listening on http://${host}:${port}`);
      });

      return server;
    },
    stop() {
      if (!server) {
        return;
      }

      server.close();
      server = null;
    },
  };
}

module.exports = {
  createIncomingMessageServer,
};
