const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importModule } = require("./helpers/import-module");

async function loadWebAnalyticsDbModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "db", "web-analytics.ts"),
  );
}

async function loadWebAnalyticsServiceModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "services", "webAnalyticsService.ts"),
  );
}

async function createWebAnalyticsTestDb() {
  const db = new Database(":memory:");
  const { ensureWebAnalyticsTables } = await loadWebAnalyticsDbModule();
  ensureWebAnalyticsTables(db);
  return db;
}

test("web analytics records Instagram campaign visits without storing raw IPs", async () => {
  const db = await createWebAnalyticsTestDb();
  const {
    getWebAnalyticsSummary,
    listRecentWebVisits,
    recordWebVisit,
  } = await loadWebAnalyticsServiceModule();
  const originalWebhookUrl = process.env.SIDEKLICK_WEB_VISIT_WEBHOOK_URL;
  delete process.env.SIDEKLICK_WEB_VISIT_WEBHOOK_URL;

  try {
    const visit = recordWebVisit(
      {
        visitorId: "visitor-1",
        sessionId: "session-1",
        path: "/?utm_source=instagram&utm_campaign=reel-one",
        url: "https://sideklick.app/?utm_source=instagram&utm_medium=social&utm_campaign=reel-one&utm_content=hook-a",
        title: "SideKlick",
        referrer: "https://l.instagram.com/",
      },
      {
        ipAddress: "203.0.113.42",
        userAgent: "TestBrowser/1.0",
      },
      db,
      new Date("2026-06-07T12:00:00.000Z"),
    );

    assert.equal(visit.source, "instagram");
    assert.equal(visit.medium, "social");
    assert.equal(visit.campaign, "reel-one");
    assert.equal(visit.content, "hook-a");
    assert.equal(visit.referrerHost, "l.instagram.com");

    const storedRow = db.prepare(
      "SELECT ip_hash, user_agent FROM web_visit_events WHERE id = ?",
    ).get(visit.id);
    assert.equal(storedRow.user_agent, "TestBrowser/1.0");
    assert.notEqual(storedRow.ip_hash, "203.0.113.42");
    assert.match(storedRow.ip_hash, /^[a-f0-9]{64}$/);

    const summary = getWebAnalyticsSummary(
      { days: 14 },
      db,
      new Date("2026-06-08T12:00:00.000Z"),
    );
    assert.equal(summary.totalVisits, 1);
    assert.equal(summary.uniqueVisitors, 1);
    assert.equal(summary.instagramVisits, 1);
    assert.deepEqual(summary.byDay[0], {
      date: "2026-06-07",
      visits: 1,
      uniqueVisitors: 1,
      instagramVisits: 1,
    });
    assert.deepEqual(summary.bySource[0], {
      source: "instagram",
      visits: 1,
      uniqueVisitors: 1,
    });
    assert.deepEqual(summary.byCampaign[0], {
      campaign: "reel-one",
      source: "instagram",
      visits: 1,
      uniqueVisitors: 1,
    });

    const recentVisits = listRecentWebVisits({ limit: 5 }, db);
    assert.equal(recentVisits.length, 1);
    assert.equal(recentVisits[0].source, "instagram");
  } finally {
    if (originalWebhookUrl === undefined) {
      delete process.env.SIDEKLICK_WEB_VISIT_WEBHOOK_URL;
    } else {
      process.env.SIDEKLICK_WEB_VISIT_WEBHOOK_URL = originalWebhookUrl;
    }
    db.close();
  }
});
