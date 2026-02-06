-- Core incident record
CREATE TABLE incidents (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  text NOT NULL,
  status                 text NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity               text NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3')),
  created_by             text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  statuspage_incident_id text
);

CREATE INDEX idx_incidents_status ON incidents (status);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incidents_created_at ON incidents (created_at DESC);

-- Each submission through the pipeline (brief -> draft -> review -> approval -> publish)
CREATE TABLE incident_updates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id          uuid REFERENCES incidents(id) NOT NULL,
  brief_json           jsonb NOT NULL,
  drafted_json         jsonb,
  reviewed_json        jsonb,
  status               text NOT NULL DEFAULT 'processing'
                       CHECK (status IN ('processing', 'awaiting_approval', 'changes_requested', 'approved', 'denied', 'published', 'publish_failed')),
  submitted_by         text NOT NULL,
  approved_by          text,
  approved_at          timestamptz,
  denial_reason        text,
  change_feedback      text,
  published_at         timestamptz,
  statuspage_update_id text,
  publish_error        text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_updates_incident_id ON incident_updates (incident_id);
CREATE INDEX idx_incident_updates_status ON incident_updates (status);
CREATE INDEX idx_incident_updates_created_at ON incident_updates (created_at DESC);

-- Audit log of all events
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  uuid REFERENCES incidents(id) NOT NULL,
  update_id    uuid REFERENCES incident_updates(id),
  type         text NOT NULL
               CHECK (type IN ('brief_submitted', 'draft_generated', 'review_completed',
                               'approval_granted', 'approval_denied', 'changes_requested',
                               'published', 'publish_failed')),
  actor        text NOT NULL,
  payload_json jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_incident_id ON events (incident_id);
CREATE INDEX idx_events_update_id ON events (update_id);
CREATE INDEX idx_events_created_at ON events (created_at DESC);
