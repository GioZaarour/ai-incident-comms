import type { Severity, LifecycleState, ComponentStatus } from "./constants";

export interface AffectedComponent {
  component_id: string;
  component_name: string;
  component_status: ComponentStatus;
}

export interface BriefPayload {
  severity: Severity;
  lifecycle_state: LifecycleState;
  affected_components: AffectedComponent[];
  customer_impact: string;
  scope: "all" | "subset";
  scope_criterion?: string;
  start_time: string;
  detection_time: string;
  mitigation_status: string;
  customer_action_required?: string;
  next_update_eta?: string;
  internal_notes?: string;
  // set by the form for updates to existing incidents
  existing_incident_id?: string;
  submitter_name: string;
}

export interface DrafterOutput {
  incident_name: string;
  status: LifecycleState;
  body: string;
  components: { component_id: string; component_status: string }[];
  flags: string[];
}

export interface ReviewerOutput {
  incident_name: string;
  status: LifecycleState;
  body: string;
  components: { component_id: string; component_status: string }[];
  changelog: string[];
  flags: string[];
}
