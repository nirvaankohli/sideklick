import crypto from "node:crypto";
import type BetterSqlite3 from "better-sqlite3";

import { getDatabase } from "../db";
import { ensureWebAnalyticsTables } from "../db/web-analytics.ts";
import type { WebAnalyticsAdminQueryInput, WebVisitRequestInput } from "../schema";

type DatabaseLike = BetterSqlite3.Database;

export type WebVisitRequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type WebVisitRecord = {
  id: number;
  visitorId: string | null;
  sessionId: string | null;
  path: string;
  url: string | null;
  title: string | null;
  referrer: string | null;
  referrerHost: string | null;
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type WebAnalyticsSummary = {
  days: number;
  totalVisits: number;
  uniqueVisitors: number;
  instagramVisits: number;
  byDay: Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
    instagramVisits: number;
  }>;
  bySource: Array<{ source: string; visits: number; uniqueVisitors: number }>;
  byCampaign: Array<{
    campaign: string;
    source: string;
    visits: number;
    uniqueVisitors: number;
  }>;
};

type WebVisitRow = {
  id: number;
  visitor_id: string | null;
  session_id: string | null;
  path: string;
  url: string | null;
  title: string | null;
  referrer: string | null;
  referrer_host: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  user_agent: string | null;
  created_at: string;
};

const WEBHOOK_TIMEOUT_MS = 2_500;

function normalizeText(value: string | undefined, maxLength: number): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, maxLength);
}

function normalizeToken(value: string | undefined, maxLength: number): string | null {
  const normalized = normalizeText(value, maxLength);
  return normalized ? normalized.toLowerCase() : null;
}

function getQueryValue(url: string | null, key: string): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, "https://sideklick.app").searchParams.get(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function getReferrerHost(referrer: string | null): string | null {
  if (!referrer) {
    return null;
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function inferSource(input: {
  explicitSource: string | null;
  referrerHost: string | null;
}): string {
  if (input.explicitSource) {
    return input.explicitSource;
  }

  const host = input.referrerHost ?? "";
  if (!host) {
    return "direct";
  }
  if (host.includes("instagram.com")) {
    return "instagram";
  }
  if (host.includes("tiktok.com")) {
    return "tiktok";
  }
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return "youtube";
  }
  if (host.includes("twitter.com") || host.includes("x.com") || host.includes("t.co")) {
    return "twitter";
  }
  if (host.includes("google.")) {
    return "google";
  }
  return host;
}

function inferMedium(input: {
  explicitMedium: string | null;
  source: string;
  referrerHost: string | null;
}): string {
  if (input.explicitMedium) {
    return input.explicitMedium;
  }

  if (["instagram", "tiktok", "youtube", "twitter"].includes(input.source)) {
    return "social";
  }

  return input.referrerHost ? "referral" : "direct";
}

function hashIpAddress(ipAddress: string | undefined): string | null {
  const normalized = ipAddress?.trim();
  if (!normalized) {
    return null;
  }

  const salt =
    process.env.SIDEKLICK_WEB_ANALYTICS_SALT ||
    process.env.BACKEND_JWT_SECRET ||
    "sideklick-web-analytics";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${normalized}`)
    .digest("hex");
}

function mapVisitRow(row: WebVisitRow): WebVisitRecord {
  return {
    id: row.id,
    visitorId: row.visitor_id,
    sessionId: row.session_id,
    path: row.path,
    url: row.url,
    title: row.title,
    referrer: row.referrer,
    referrerHost: row.referrer_host,
    source: row.source ?? "direct",
    medium: row.medium ?? "direct",
    campaign: row.campaign,
    content: row.content,
    term: row.term,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

export function recordWebVisit(
  input: WebVisitRequestInput,
  meta: WebVisitRequestMeta,
  db: DatabaseLike = getDatabase(),
  now = new Date(),
): WebVisitRecord {
  ensureWebAnalyticsTables(db);

  const url = normalizeText(input.url, 4096);
  const referrer = normalizeText(input.referrer, 4096);
  const referrerHost = getReferrerHost(referrer);
  const source = inferSource({
    explicitSource:
      normalizeToken(input.utmSource, 120) ??
      normalizeToken(getQueryValue(url, "utm_source"), 120),
    referrerHost,
  });
  const medium = inferMedium({
    explicitMedium:
      normalizeToken(input.utmMedium, 120) ??
      normalizeToken(getQueryValue(url, "utm_medium"), 120),
    source,
    referrerHost,
  });
  const campaign =
    normalizeText(input.utmCampaign, 160) ??
    normalizeText(getQueryValue(url, "utm_campaign"), 160);
  const content =
    normalizeText(input.utmContent, 160) ??
    normalizeText(getQueryValue(url, "utm_content"), 160);
  const term =
    normalizeText(input.utmTerm, 160) ??
    normalizeText(getQueryValue(url, "utm_term"), 160);
  const createdAt = now.toISOString();

  const result = db.prepare(
    `
      INSERT INTO web_visit_events (
        visitor_id,
        session_id,
        path,
        url,
        title,
        referrer,
        referrer_host,
        source,
        medium,
        campaign,
        content,
        term,
        user_agent,
        ip_hash,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    normalizeText(input.visitorId, 120),
    normalizeText(input.sessionId, 120),
    normalizeText(input.path, 2048) ?? "/",
    url,
    normalizeText(input.title, 240),
    referrer,
    referrerHost,
    source,
    medium,
    campaign,
    content,
    term,
    normalizeText(meta.userAgent, 600),
    hashIpAddress(meta.ipAddress),
    createdAt,
  );

  return mapVisitRow(
    db.prepare("SELECT * FROM web_visit_events WHERE id = ?").get(
      Number(result.lastInsertRowid),
    ) as WebVisitRow,
  );
}

export function listRecentWebVisits(
  input: Pick<WebAnalyticsAdminQueryInput, "limit" | "source">,
  db: DatabaseLike = getDatabase(),
): WebVisitRecord[] {
  ensureWebAnalyticsTables(db);

  const source = normalizeToken(input.source, 120);
  const limit = Math.min(Math.max(input.limit, 1), 250);
  const rows = source
    ? db.prepare(
        `
          SELECT *
          FROM web_visit_events
          WHERE source = ?
          ORDER BY created_at DESC, id DESC
          LIMIT ?
        `,
      ).all(source, limit)
    : db.prepare(
        `
          SELECT *
          FROM web_visit_events
          ORDER BY created_at DESC, id DESC
          LIMIT ?
        `,
      ).all(limit);

  return (rows as WebVisitRow[]).map(mapVisitRow);
}

export function getWebAnalyticsSummary(
  input: Pick<WebAnalyticsAdminQueryInput, "days">,
  db: DatabaseLike = getDatabase(),
  now = new Date(),
): WebAnalyticsSummary {
  ensureWebAnalyticsTables(db);

  const days = Math.min(Math.max(input.days, 1), 90);
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    .toISOString();
  const totals = db.prepare(
    `
      SELECT
        COUNT(*) AS totalVisits,
        COUNT(DISTINCT visitor_id) AS uniqueVisitors,
        SUM(CASE WHEN source = 'instagram' THEN 1 ELSE 0 END) AS instagramVisits
      FROM web_visit_events
      WHERE created_at >= ?
    `,
  ).get(startDate) as {
    totalVisits: number;
    uniqueVisitors: number;
    instagramVisits: number | null;
  };

  const byDay = db.prepare(
    `
      SELECT
        date(created_at) AS date,
        COUNT(*) AS visits,
        COUNT(DISTINCT visitor_id) AS uniqueVisitors,
        SUM(CASE WHEN source = 'instagram' THEN 1 ELSE 0 END) AS instagramVisits
      FROM web_visit_events
      WHERE created_at >= ?
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT ?
    `,
  ).all(startDate, days) as Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
    instagramVisits: number | null;
  }>;

  const bySource = db.prepare(
    `
      SELECT
        COALESCE(source, 'direct') AS source,
        COUNT(*) AS visits,
        COUNT(DISTINCT visitor_id) AS uniqueVisitors
      FROM web_visit_events
      WHERE created_at >= ?
      GROUP BY COALESCE(source, 'direct')
      ORDER BY visits DESC, source ASC
      LIMIT 25
    `,
  ).all(startDate) as Array<{
    source: string;
    visits: number;
    uniqueVisitors: number;
  }>;

  const byCampaign = db.prepare(
    `
      SELECT
        campaign,
        COALESCE(source, 'direct') AS source,
        COUNT(*) AS visits,
        COUNT(DISTINCT visitor_id) AS uniqueVisitors
      FROM web_visit_events
      WHERE created_at >= ? AND campaign IS NOT NULL
      GROUP BY campaign, COALESCE(source, 'direct')
      ORDER BY visits DESC, campaign ASC
      LIMIT 25
    `,
  ).all(startDate) as Array<{
    campaign: string;
    source: string;
    visits: number;
    uniqueVisitors: number;
  }>;

  return {
    days,
    totalVisits: totals.totalVisits,
    uniqueVisitors: totals.uniqueVisitors,
    instagramVisits: totals.instagramVisits ?? 0,
    byDay: byDay.map((day) => ({
      ...day,
      instagramVisits: day.instagramVisits ?? 0,
    })),
    bySource,
    byCampaign,
  };
}

function shouldNotifyVisit(record: WebVisitRecord): boolean {
  const configuredSources = process.env.SIDEKLICK_WEB_VISIT_NOTIFY_SOURCES
    ?.split(",")
    .map((source) => source.trim().toLowerCase())
    .filter(Boolean);

  if (!configuredSources || configuredSources.length === 0) {
    return true;
  }

  return configuredSources.includes(record.source);
}

function buildVisitMessage(record: WebVisitRecord): string {
  const source = record.campaign
    ? `${record.source} / ${record.campaign}`
    : record.source;
  return `New SideKlick visit: ${record.path} from ${source}`;
}

export function queueWebVisitNotification(record: WebVisitRecord): void {
  const webhookUrl = process.env.SIDEKLICK_WEB_VISIT_WEBHOOK_URL?.trim();
  if (!webhookUrl || !shouldNotifyVisit(record) || !globalThis.fetch) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  const message = buildVisitMessage(record);

  void globalThis.fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: message,
      content: message,
      visit: {
        path: record.path,
        source: record.source,
        medium: record.medium,
        campaign: record.campaign,
        referrerHost: record.referrerHost,
        createdAt: record.createdAt,
      },
    }),
    signal: controller.signal,
  }).catch(() => {
    // Visit recording should never fail because an optional notification failed.
  }).finally(() => {
    clearTimeout(timeout);
  });
}
