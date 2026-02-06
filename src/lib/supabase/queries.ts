import { createServiceClient } from "./client";
import type { Incident, IncidentUpdate, Event, QueueItem } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const db = () => createServiceClient();

// --- Incidents ---

export async function createIncident(data: {
  title: string;
  status: Incident["status"];
  severity: Incident["severity"];
  created_by: string;
}): Promise<Incident> {
  const { data: row, error } = await db()
    .from("incidents")
    .insert(data as any)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as Incident;
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { data, error } = await db()
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return (data as unknown as Incident) ?? null;
}

export async function updateIncident(
  id: string,
  updates: Partial<Pick<Incident, "title" | "status" | "statuspage_incident_id">>
): Promise<Incident> {
  const { data, error } = await db()
    .from("incidents")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Incident;
}

export async function listActiveIncidents(): Promise<Incident[]> {
  const { data, error } = await db()
    .from("incidents")
    .select("*")
    .neq("status", "resolved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Incident[];
}

export async function listAllIncidents(): Promise<Incident[]> {
  const { data, error } = await db()
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Incident[];
}

// --- Incident Updates ---

export async function createIncidentUpdate(data: {
  incident_id: string;
  brief_json: Record<string, unknown>;
  submitted_by: string;
  status?: IncidentUpdate["status"];
}): Promise<IncidentUpdate> {
  const { data: row, error } = await db()
    .from("incident_updates")
    .insert({ status: "processing" as const, ...data } as any)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as IncidentUpdate;
}

export async function getIncidentUpdate(id: string): Promise<IncidentUpdate | null> {
  const { data, error } = await db()
    .from("incident_updates")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return (data as unknown as IncidentUpdate) ?? null;
}

export async function updateIncidentUpdate(
  id: string,
  updates: Partial<Omit<IncidentUpdate, "id" | "incident_id" | "created_at">>
): Promise<IncidentUpdate> {
  const { data, error } = await db()
    .from("incident_updates")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as IncidentUpdate;
}

export async function listQueueItems(status?: string): Promise<QueueItem[]> {
  let query = db()
    .from("incident_updates")
    .select("*, incident:incidents!inner(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    incident: row.incident as Incident,
  })) as QueueItem[];
}

export async function listUpdatesForIncident(
  incidentId: string
): Promise<IncidentUpdate[]> {
  const { data, error } = await db()
    .from("incident_updates")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as IncidentUpdate[];
}

// --- Events ---

export async function createEvent(data: {
  incident_id: string;
  update_id?: string;
  type: Event["type"];
  actor: string;
  payload_json?: Record<string, unknown>;
}): Promise<Event> {
  const { data: row, error } = await db()
    .from("events")
    .insert(data as any)
    .select()
    .single();
  if (error) throw error;
  return row as unknown as Event;
}

export async function listEventsForIncident(incidentId: string): Promise<Event[]> {
  const { data, error } = await db()
    .from("events")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

// --- History (incidents with events) ---

export async function listIncidentsWithEvents(): Promise<
  (Incident & { events: Event[] })[]
> {
  const { data, error } = await db()
    .from("incidents")
    .select("*, events(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    events: ((row.events as Event[]) ?? []).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  })) as (Incident & { events: Event[] })[];
}
