import { NextResponse } from "next/server";
import {
  getIncidentUpdate,
  updateIncidentUpdate,
  getIncident,
  updateIncident,
  createEvent,
} from "@/lib/supabase/queries";
import {
  createIncident as createStatuspageIncident,
  updateIncident as updateStatuspageIncident,
} from "@/lib/statuspage/client";
import type { ReviewerOutput } from "@/lib/shared/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const approverName = body.approver_name;

    if (!approverName) {
      return NextResponse.json(
        { error: "approver_name is required" },
        { status: 400 }
      );
    }

    const update = await getIncidentUpdate(id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    if (update.status !== "awaiting_approval" && update.status !== "publish_failed") {
      return NextResponse.json(
        { error: `Cannot approve update with status: ${update.status}` },
        { status: 400 }
      );
    }

    const incident = await getIncident(update.incident_id);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const reviewed = update.reviewed_json as unknown as ReviewerOutput;
    if (!reviewed) {
      return NextResponse.json(
        { error: "No reviewed draft to publish" },
        { status: 400 }
      );
    }

    // Convert components array to record for Statuspage API
    const componentsRecord: Record<string, string> = {};
    const componentIds: string[] = [];
    for (const c of reviewed.components) {
      componentsRecord[c.component_id] = c.component_status;
      componentIds.push(c.component_id);
    }

    try {
      let statuspageResult;

      if (incident.statuspage_incident_id) {
        // Update existing Statuspage incident
        statuspageResult = await updateStatuspageIncident(
          incident.statuspage_incident_id,
          {
            incident: {
              name: reviewed.incident_name,
              status: reviewed.status,
              body: reviewed.body,
              component_ids: componentIds,
              components: componentsRecord,
            },
          }
        );
      } else {
        // Create new Statuspage incident
        statuspageResult = await createStatuspageIncident({
          incident: {
            name: reviewed.incident_name,
            status: reviewed.status,
            body: reviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });

        // Save the Statuspage incident ID
        await updateIncident(incident.id, {
          statuspage_incident_id: statuspageResult.id,
        });
      }

      // Update incident status to match the lifecycle state
      await updateIncident(incident.id, { status: reviewed.status });

      const latestSpUpdate = statuspageResult.incident_updates?.[0];

      await updateIncidentUpdate(id, {
        status: "published",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        statuspage_update_id: latestSpUpdate?.id ?? null,
      });

      await createEvent({
        incident_id: incident.id,
        update_id: id,
        type: "approval_granted",
        actor: approverName,
      });

      await createEvent({
        incident_id: incident.id,
        update_id: id,
        type: "published",
        actor: "system",
        payload_json: {
          statuspage_incident_id: statuspageResult.id,
          statuspage_update_id: latestSpUpdate?.id,
        },
      });

      return NextResponse.json({ status: "published" });
    } catch (publishErr) {
      const publishMessage =
        publishErr instanceof Error ? publishErr.message : "Publish failed";

      await updateIncidentUpdate(id, {
        status: "publish_failed",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
        publish_error: publishMessage,
      });

      await createEvent({
        incident_id: incident.id,
        update_id: id,
        type: "publish_failed",
        actor: "system",
        payload_json: { error: publishMessage },
      });

      return NextResponse.json(
        { error: `Publish failed: ${publishMessage}` },
        { status: 502 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
