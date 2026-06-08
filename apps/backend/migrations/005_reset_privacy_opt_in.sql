WITH should_reset AS (
  SELECT NOT EXISTS (
    SELECT 1
    FROM app_state
    WHERE state_key = 'privacy_reset_opt_in_v2'
      AND state_value = 'applied'
  ) AS value
)
UPDATE privacy_settings
SET
  screenshot_policy = 'manual',
  sync_consent = 'unknown',
  updated_at = CURRENT_TIMESTAMP
WHERE (SELECT value FROM should_reset);

INSERT INTO app_state (state_key, state_value, updated_at)
SELECT 'privacy_reset_opt_in_v2', 'applied', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM app_state
  WHERE state_key = 'privacy_reset_opt_in_v2'
    AND state_value = 'applied'
)
ON CONFLICT (state_key) DO UPDATE SET
  state_value = EXCLUDED.state_value,
  updated_at = CURRENT_TIMESTAMP;
