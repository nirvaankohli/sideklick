CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL,
  label TEXT,
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discount_code_redemptions (
  id TEXT PRIMARY KEY,
  discount_code_id TEXT NOT NULL REFERENCES discount_codes(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_code_redemptions_code_user_idx
ON discount_code_redemptions(discount_code_id, user_id);

CREATE INDEX IF NOT EXISTS discount_code_redemptions_user_idx
ON discount_code_redemptions(user_id, redeemed_at);
