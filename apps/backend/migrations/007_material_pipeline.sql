ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS material_vector_store_id TEXT;

CREATE TABLE IF NOT EXISTS materials (
  material_id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  ownership TEXT NOT NULL,
  scope TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  derivative_status TEXT NOT NULL,
  visual_fidelity TEXT NOT NULL,
  sync_state TEXT NOT NULL,
  status_text TEXT NOT NULL,
  openai_file_id TEXT,
  vector_store_id TEXT,
  vector_store_file_id TEXT,
  extracted_text TEXT,
  fallback_text TEXT,
  storage_path TEXT,
  derivative_pdf_path TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS materials_sha256_idx
  ON materials (sha256);

CREATE INDEX IF NOT EXISTS materials_class_scope_idx
  ON materials (class_id, scope, deleted_at);
