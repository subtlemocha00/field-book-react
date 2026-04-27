-- Phase 4: durable, replayable write log. Mutations are recorded after the
-- corresponding entity write succeeds. No foreign keys, no triggers, no
-- cascade rules. Payload stores the contract-shape entity as JSON.

CREATE TABLE IF NOT EXISTS mutations (
  id           TEXT PRIMARY KEY,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  operation    TEXT NOT NULL,
  payload      TEXT NOT NULL,
  timestamp    TEXT NOT NULL,
  status       TEXT NOT NULL,
  applied_at   TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_mutations_status
  ON mutations(status);

CREATE INDEX IF NOT EXISTS idx_mutations_entity
  ON mutations(entity_type, entity_id);
