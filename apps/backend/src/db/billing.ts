type DatabaseLike = {
  exec(sql: string): void;
};

export function ensureBillingTables(db: DatabaseLike): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_billing_profiles (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'inactive',
      founding_beta_status TEXT NOT NULL DEFAULT 'none',
      billing_provider TEXT,
      billing_customer_id TEXT,
      billing_subscription_id TEXT,
      current_period_start TEXT,
      current_period_end TEXT,
      monthly_credit_allowance INTEGER NOT NULL DEFAULT 10,
      monthly_credits_remaining INTEGER NOT NULL DEFAULT 10,
      purchased_credits_remaining INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      action_type TEXT NOT NULL,
      cost INTEGER NOT NULL,
      status TEXT NOT NULL,
      monthly_credits_used INTEGER NOT NULL DEFAULT 0,
      purchased_credits_used INTEGER NOT NULL DEFAULT 0,
      related_entity_type TEXT,
      related_entity_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_user_idempotency_idx
    ON credit_transactions(user_id, idempotency_key);

    CREATE TABLE IF NOT EXISTS credit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT,
      user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      credit_bucket TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      related_entity_type TEXT,
      related_entity_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES credit_transactions (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE INDEX IF NOT EXISTS credit_ledger_user_created_idx
    ON credit_ledger(user_id, created_at);

    CREATE TABLE IF NOT EXISTS discount_codes (
      id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL UNIQUE,
      code_type TEXT NOT NULL,
      label TEXT,
      max_redemptions INTEGER NOT NULL DEFAULT 1,
      redemption_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discount_code_redemptions (
      id TEXT PRIMARY KEY,
      discount_code_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      redeemed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (discount_code_id) REFERENCES discount_codes (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS discount_code_redemptions_code_user_idx
    ON discount_code_redemptions(discount_code_id, user_id);

    CREATE INDEX IF NOT EXISTS discount_code_redemptions_user_idx
    ON discount_code_redemptions(user_id, redeemed_at);
  `);
}
