-- Data Model 4.1: projects table. Relational constraints and cascade
-- behavior are intentionally omitted at the schema level; relational
-- integrity is enforced by the repository layer per Phase 3 constraints.

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL,
  code            TEXT,
  description     TEXT,
  location_text   TEXT,
  status          TEXT    NOT NULL,
  start_date      TEXT,
  end_date        TEXT,
  created_at      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL,
  deleted_at      TEXT,
  revision        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_code       ON projects(code);
