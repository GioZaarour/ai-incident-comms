export interface StatuspageComponent {
  id: string;
  name: string;
  status: string;
  description: string | null;
  position: number;
  group_id: string | null;
}

export interface StatuspageIncidentUpdate {
  id: string;
  incident_id: string;
  status: string;
  body: string;
  created_at: string;
  updated_at: string;
  display_at: string;
}

export interface StatuspageIncident {
  id: string;
  name: string;
  status: string;
  impact: string;
  impact_override: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  shortlink: string;
  page_id: string;
  components: StatuspageComponent[];
  incident_updates: StatuspageIncidentUpdate[];
}

export interface CreateIncidentPayload {
  incident: {
    name: string;
    status?: string;
    body?: string;
    component_ids?: string[];
    components?: Record<string, string>;
    impact_override?: string;
  };
}

export interface UpdateIncidentPayload {
  incident: {
    name?: string;
    status?: string;
    body?: string;
    component_ids?: string[];
    components?: Record<string, string>;
    impact_override?: string;
  };
}
