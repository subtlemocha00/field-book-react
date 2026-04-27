-- Data Model 7.1 + Domain Rules 3.3: notes are timestamped entries within a
-- daily report. Ordering uses (note_timestamp, sort_index, id).

CREATE TABLE IF NOT EXISTS notes (
  id                    TEXT    PRIMARY KEY,
  daily_report_id       TEXT    NOT NULL,
  category_id           TEXT    NOT NULL,
  body                  TEXT    NOT NULL,
  note_timestamp        TEXT    NOT NULL,
  sort_index            INTEGER NOT NULL,
  created_by_user_id    TEXT    NOT NULL,
  updated_by_user_id    TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  deleted_at            TEXT,
  revision              INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_daily_report_id
  ON notes(daily_report_id);

CREATE INDEX IF NOT EXISTS idx_notes_report_order
  ON notes(daily_report_id, note_timestamp, sort_index);

CREATE INDEX IF NOT EXISTS idx_notes_deleted_at
  ON notes(deleted_at);
