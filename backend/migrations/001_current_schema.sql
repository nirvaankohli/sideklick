CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id TEXT,
  class_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  current_unit TEXT,
  teacher_focus TEXT,
  key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id TEXT,
  class_id BIGINT REFERENCES classes(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMPTZ,
  title TEXT,
  notes TEXT,
  summary TEXT,
  key_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  carry_forward TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  screenshot_preview TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id TEXT,
  session_id BIGINT REFERENCES sessions(id),
  class_id BIGINT REFERENCES classes(id),
  prompt TEXT NOT NULL,
  response TEXT,
  interaction_type TEXT,
  request_payload JSONB,
  response_payload JSONB,
  built_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gaps (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id TEXT,
  class_id BIGINT REFERENCES classes(id),
  topic TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  weight INTEGER NOT NULL DEFAULT 0,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gap_events (
  id BIGSERIAL PRIMARY KEY,
  gap_id BIGINT NOT NULL REFERENCES gaps(id),
  interaction_id BIGINT REFERENCES interactions(id),
  session_id BIGINT REFERENCES sessions(id),
  evidence TEXT NOT NULL,
  confidence DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_state (
  state_key TEXT PRIMARY KEY,
  state_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
