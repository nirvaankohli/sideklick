ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE email IS NOT NULL
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique email constraint while duplicate user emails exist.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
ON users (LOWER(email))
WHERE email IS NOT NULL;
