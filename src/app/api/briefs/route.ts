import { NextResponse } from "next/server";
import { briefSchema } from "@/lib/shared/validation";
import {
  createIncident,
  getIncident,
  createIncidentUpdate,
  createEvent,
} from "@/lib/supabase/queries";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
import type { BriefPayload } from "@/lib/shared/types";
import { getIncident as getStatuspageIncident } from "@/lib/statuspage/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = briefSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const brief = parsed.data as BriefPayload;
    let incidentId: string;
    let lastPublishedUpdate: string | null = null;

    if (brief.existing_incident_id) {
      // Update existing incident
      const existing = await getIncident(brief.existing_incident_id);
      if (!existing) {
        return NextResponse.json(
          { error: "Incident not found" },
          { status: 404 }
        );
      }
      incidentId = existing.id;

      // Fetch last published update from Statuspage for diff-aware drafting
      if (existing.statuspage_incident_id) {
        try {
          const spIncident = await getStatuspageIncident(
            existing.statuspage_incident_id
          );
          if (spIncident.incident_updates?.length > 0) {
            const latest = spIncident.incident_updates[0];
            lastPublishedUpdate = `[${latest.status}] ${latest.body}`;
          }
        } catch {
          // Non-fatal: proceed without last update context
        }
      }
    } else {
      // Create new incident
      const incident = await createIncident({
        title: `${brief.severity.toUpperCase()} - ${brief.customer_impact.slice(0, 100)}`,
        status: brief.lifecycle_state,
        severity: brief.severity,
        created_by: brief.submitter_name,
      });
      incidentId = incident.id;
    }

    // Create the incident_update record
    const update = await createIncidentUpdate({
      incident_id: incidentId,
      brief_json: brief as unknown as Record<string, unknown>,
      submitted_by: brief.submitter_name,
      status: "processing",
    });

    // Log the brief submission event
    await createEvent({
      incident_id: incidentId,
      update_id: update.id,
      type: "brief_submitted",
      actor: brief.submitter_name,
      payload_json: brief as unknown as Record<string, unknown>,
    });

    // Await pipeline — Vercel kills the function after response, so we must complete it first
    await runPipeline(update.id, incidentId, brief, lastPublishedUpdate);

    return NextResponse.json(
      { update_id: update.id, incident_id: incidentId },
      { status: 202 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("POST /api/briefs error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
