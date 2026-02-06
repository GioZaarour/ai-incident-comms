import type {
  StatuspageComponent,
  StatuspageIncident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
} from "./types";

const BASE_URL = "https://api.statuspage.io/v1";

function getConfig() {
  const apiKey = process.env.STATUSPAGE_API_KEY;
  const pageId = process.env.STATUSPAGE_PAGE_ID;
  if (!apiKey || !pageId) {
    throw new Error("Missing STATUSPAGE_API_KEY or STATUSPAGE_PAGE_ID");
  }
  return { apiKey, pageId };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { apiKey, pageId } = getConfig();
  const url = `${BASE_URL}/pages/${pageId}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `OAuth ${apiKey}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Statuspage API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function listComponents(): Promise<StatuspageComponent[]> {
  return request<StatuspageComponent[]>("/components");
}

export async function getIncident(incidentId: string): Promise<StatuspageIncident> {
  return request<StatuspageIncident>(`/incidents/${incidentId}`);
}

export async function listUnresolvedIncidents(): Promise<StatuspageIncident[]> {
  return request<StatuspageIncident[]>("/incidents/unresolved");
}

export async function createIncident(
  payload: CreateIncidentPayload
): Promise<StatuspageIncident> {
  return request<StatuspageIncident>("/incidents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateIncident(
  incidentId: string,
  payload: UpdateIncidentPayload
): Promise<StatuspageIncident> {
  return request<StatuspageIncident>(`/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
