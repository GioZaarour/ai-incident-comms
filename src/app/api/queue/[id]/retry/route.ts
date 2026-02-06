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

    if (update.status !== "publish_failed") {
      return NextResponse.json(
        { error: "Can only retry publish_failed updates" },
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

    const componentsRecord: Record<string, string> = {};
    const componentIds: string[] = [];
    for (const c of reviewed.components) {
      componentsRecord[c.component_id] = c.component_status;
      componentIds.push(c.component_id);
    }

    try {
      let statuspageResult;

      if (incident.statuspage_incident_id) {
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
        statuspageResult = await createStatuspageIncident({
          incident: {
            name: reviewed.incident_name,
            status: reviewed.status,
            body: reviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });

        await updateIncident(incident.id, {
          statuspage_incident_id: statuspageResult.id,
        });
      }

      await updateIncident(incident.id, { status: reviewed.status });

      const latestSpUpdate = statuspageResult.incident_updates?.[0];

      await updateIncidentUpdate(id, {
        status: "published",
        published_at: new Date().toISOString(),
        statuspage_update_id: latestSpUpdate?.id ?? null,
        publish_error: null,
      });

      await createEvent({
        incident_id: incident.id,
        update_id: id,
        type: "published",
        actor: "system",
        payload_json: {
          statuspage_incident_id: statuspageResult.id,
          retry: true,
        },
      });

      return NextResponse.json({ status: "published" });
    } catch (publishErr) {
      const publishMessage =
        publishErr instanceof Error ? publishErr.message : "Retry failed";

      await updateIncidentUpdate(id, {
        publish_error: publishMessage,
      });

      return NextResponse.json(
        { error: `Retry failed: ${publishMessage}` },
        { status: 502 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
