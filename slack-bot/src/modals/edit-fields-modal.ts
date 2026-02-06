import type { App } from "@slack/bolt";
import type { View } from "@slack/web-api";
import { getIncidentUpdate } from "@/lib/supabase/queries";
import type { ReviewerOutput } from "@/lib/shared/types";

export function buildEditFieldsModal(
  updateId: string,
  reviewed: ReviewerOutput
): View {
  return {
    type: "modal",
    callback_id: "edit_fields_modal",
    private_metadata: updateId,
    title: { type: "plain_text", text: "Edit Draft" },
    submit: { type: "plain_text", text: "Publish Edited" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "incident_name",
        label: { type: "plain_text", text: "Incident Name" },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          initial_value: reviewed.incident_name,
        },
      },
      {
        type: "input",
        block_id: "body",
        label: { type: "plain_text", text: "Update Body" },
        element: {
          type: "plain_text_input",
          action_id: "body_input",
          multiline: true,
          initial_value: reviewed.body,
        },
      },
      {
        type: "input",
        block_id: "status",
        label: { type: "plain_text", text: "Status" },
        element: {
          type: "static_select",
          action_id: "status_select",
          initial_option: {
            text: {
              type: "plain_text",
              text: reviewed.status.charAt(0).toUpperCase() + reviewed.status.slice(1),
            },
            value: reviewed.status,
          },
          options: [
            { text: { type: "plain_text", text: "Investigating" }, value: "investigating" },
            { text: { type: "plain_text", text: "Identified" }, value: "identified" },
            { text: { type: "plain_text", text: "Monitoring" }, value: "monitoring" },
            { text: { type: "plain_text", text: "Resolved" }, value: "resolved" },
          ],
        },
      },
    ],
  };
}

export function registerEditFieldsModal(app: App) {
  app.view("edit_fields_modal", async ({ ack, view, body, client }) => {
    await ack();

    const updateId = view.private_metadata;
    const vals = view.state.values;
    const userId = body.user.id;

    let userName = body.user.name ?? userId;
    try {
      const userInfo = await client.users.info({ user: userId });
      userName = userInfo.user?.real_name ?? userInfo.user?.name ?? userName;
    } catch {
      // Fallback
    }

    const editedName = vals.incident_name?.name_input?.value ?? "";
    const editedBody = vals.body?.body_input?.value ?? "";
    const editedStatus = vals.status?.status_select?.selected_option?.value ?? "investigating";

    const update = await getIncidentUpdate(updateId);
    if (!update || !update.reviewed_json) return;

    const reviewed = update.reviewed_json as unknown as ReviewerOutput;

    // Build edited version — keep components from the reviewed draft
    const editedReviewed: ReviewerOutput = {
      ...reviewed,
      incident_name: editedName,
      body: editedBody,
      status: editedStatus as ReviewerOutput["status"],
    };

    // Import dynamically to avoid circular deps
    const { updateIncidentUpdate, getIncident, updateIncident, createEvent } =
      await import("@/lib/supabase/queries");
    const { createIncident: createSP, updateIncident: updateSP } =
      await import("@/lib/statuspage/client");

    const incident = await getIncident(update.incident_id);
    if (!incident) return;

    const componentsRecord: Record<string, string> = {};
    const componentIds: string[] = [];
    for (const c of editedReviewed.components) {
      componentsRecord[c.component_id] = c.component_status;
      componentIds.push(c.component_id);
    }

    try {
      let result;
      if (incident.statuspage_incident_id) {
        result = await updateSP(incident.statuspage_incident_id, {
          incident: {
            name: editedReviewed.incident_name,
            status: editedReviewed.status,
            body: editedReviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });
      } else {
        result = await createSP({
          incident: {
            name: editedReviewed.incident_name,
            status: editedReviewed.status,
            body: editedReviewed.body,
            component_ids: componentIds,
            components: componentsRecord,
          },
        });
        await updateIncident(incident.id, { statuspage_incident_id: result.id });
      }

      await updateIncident(incident.id, { status: editedReviewed.status });

      await updateIncidentUpdate(updateId, {
        reviewed_json: editedReviewed as unknown as Record<string, unknown>,
        status: "published",
        approved_by: userName,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      });

      await createEvent({
        incident_id: incident.id,
        update_id: updateId,
        type: "published",
        actor: userName,
        payload_json: { source: "slack", edited: true },
      });

      await client.chat.postMessage({
        channel: userId,
        text: `Edited draft published to Statuspage.`,
      });
    } catch (err) {
      await client.chat.postMessage({
        channel: userId,
        text: `Publish failed: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    }
  });
}
