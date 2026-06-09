CREATE TABLE IF NOT EXISTS web_visit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT,
  session_id TEXT,
  path TEXT NOT NULL,
  url TEXT,
  title TEXT,
  referrer TEXT,
  referrer_host TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS web_visit_events_created_at_idx
ON web_visit_events(created_at);

CREATE INDEX IF NOT EXISTS web_visit_events_source_idx
ON web_visit_events(source, created_at);

CREATE INDEX IF NOT EXISTS web_visit_events_campaign_idx
ON web_visit_events(campaign, created_at);
