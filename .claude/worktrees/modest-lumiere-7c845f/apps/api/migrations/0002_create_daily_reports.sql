-- Data Model 6.1 + Domain Rules 2.1: exactly one active daily report per
-- (project_id, report_date). Relational links are logical-only.

CREATE TABLE IF NOT EXISTS daily_reports (
  id                    TEXT    PRIMARY KEY,
  project_id            TEXT    NOT NULL,
  report_date           TEXT    NOT NULL,
  weather_summary       TEXT,
  general_summary       TEXT,
  created_by_user_id    TEXT    NOT NULL,
  updated_by_user_id    TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  deleted_at            TEXT,
  revision              INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_reports_project_date
  ON daily_reports(project_id, report_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id  ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_deleted_at  ON daily_reports(deleted_at);
