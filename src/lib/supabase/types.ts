export interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "sev1" | "sev2" | "sev3";
  created_by: string;
  created_at: string;
  statuspage_incident_id: string | null;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  brief_json: Record<string, unknown>;
  drafted_json: Record<string, unknown> | null;
  reviewed_json: Record<string, unknown> | null;
  status:
    | "processing"
    | "awaiting_approval"
    | "changes_requested"
    | "approved"
    | "denied"
    | "published"
    | "publish_failed";
  submitted_by: string;
  approved_by: string | null;
  approved_at: string | null;
  denial_reason: string | null;
  change_feedback: string | null;
  published_at: string | null;
  statuspage_update_id: string | null;
  publish_error: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  incident_id: string;
  update_id: string | null;
  type:
    | "brief_submitted"
    | "draft_generated"
    | "review_completed"
    | "approval_granted"
    | "approval_denied"
    | "changes_requested"
    | "published"
    | "publish_failed";
  actor: string;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

export interface IncidentWithUpdates extends Incident {
  incident_updates: IncidentUpdate[];
}

export interface IncidentWithEvents extends Incident {
  events: Event[];
}

export interface QueueItem extends IncidentUpdate {
  incident: Incident;
}
