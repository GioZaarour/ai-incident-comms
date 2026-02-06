import type { App } from "@slack/bolt";
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

export function registerApproveAction(app: App) {
  app.action("approve_draft", async ({ ack, action, body, client }) => {
    await ack();

    if (!("value" in action)) return;
    const updateId = action.value;
    const userId = body.user.id;

    let userName = body.user.name ?? userId;
    try {
      const userInfo = await client.users.info({ user: userId });
      userName = userInfo.user?.real_name ?? userInfo.user?.name ?? userName;
    } catch {
      // Fallback
    }

    const update = await getIncidentUpdate(updateId);
    if (!update) {
      await client.chat.postMessage({
        channel: userId,
        text: "Update not found.",
      });
      return;
    }

    if (update.status !== "awaiting_approval") {
      await client.chat.postMessage({
        channel: userId,
        text: `Cannot approve — current status is "${update.status}".`,
      });
      return;
    }

    const incident = await getIncident(update.incident_id);
    if (!incident) return;

    const reviewed = update.reviewed_json as unknown as ReviewerOutput;
    if (!reviewed) return;

    const componentsRecord: Record<string, string> = {};
    const componentIds: string[] = [];
    for (const c of reviewed.components) {
      componentsRecord[c.component_id] = c.component_status;
      componentIds.push(c.component_id);
    }

    try {
      let result;
      if (incident.statuspage_incident_id) {
        result = await updateStatuspageIncident(incident.statuspage_incident_id, {
          incident: {
            name: reviewed.incident_name,
            status: reviewed.status,
            body: reviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });
      } else {
        result = await createStatuspageIncident({
          incident: {
            name: reviewed.incident_name,
            status: reviewed.status,
            body: reviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });
        await updateIncident(incident.id, { statuspage_incident_id: result.id });
      }

      await updateIncident(incident.id, { status: reviewed.status });

      const latestSpUpdate = result.incident_updates?.[0];
      await updateIncidentUpdate(updateId, {
        status: "published",
        approved_by: userName,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        statuspage_update_id: latestSpUpdate?.id ?? null,
      });

      await createEvent({
        incident_id: incident.id,
        update_id: updateId,
        type: "approval_granted",
        actor: userName,
        payload_json: { source: "slack" },
      });

      await createEvent({
        incident_id: incident.id,
        update_id: updateId,
        type: "published",
        actor: "system",
        payload_json: {
          statuspage_incident_id: result.id,
          source: "slack",
        },
      });

      await client.chat.postMessage({
        channel: userId,
        text: `Published to Statuspage! Incident: ${result.shortlink || result.id}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await updateIncidentUpdate(updateId, {
        status: "publish_failed",
        approved_by: userName,
        publish_error: msg,
      });

      await client.chat.postMessage({
        channel: userId,
        text: `Publish failed: ${msg}`,
      });
    }
  });
}
