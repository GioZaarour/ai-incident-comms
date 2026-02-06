import type { App, ViewOutput } from "@slack/bolt";
import type { View } from "@slack/web-api";
import { listActiveIncidents } from "@/lib/supabase/queries";
import { listComponents } from "@/lib/statuspage/client";
import {
  createIncidentUpdate,
  getIncidentUpdate,
  createEvent,
  getIncident,
} from "@/lib/supabase/queries";
import { getIncident as getStatuspageIncident } from "@/lib/statuspage/client";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
import { buildDraftMessage } from "../views/draft-message";
import type { BriefPayload } from "@/lib/shared/types";
import type { ComponentStatus } from "@/lib/shared/constants";

export async function buildUpdateModal(): Promise<View> {
  const incidents = await listActiveIncidents();
  const incidentOptions = incidents.map((i) => ({
    text: { type: "plain_text" as const, text: `${i.severity.toUpperCase()} - ${i.title.slice(0, 60)}` },
    value: i.id,
  }));

  let componentOptions: { text: { type: "plain_text"; text: string }; value: string }[] = [];
  try {
    const components = await listComponents();
    componentOptions = components.map((c) => ({
      text: { type: "plain_text" as const, text: c.name },
      value: c.id,
    }));
  } catch {
    // empty
  }

  return {
    type: "modal",
    callback_id: "update_incident_modal",
    title: { type: "plain_text", text: "Update Incident" },
    submit: { type: "plain_text", text: "Submit Update" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "incident_select",
        label: { type: "plain_text", text: "Select Incident" },
        element: {
          type: "static_select",
          action_id: "incident_id",
          options: incidentOptions.length > 0
            ? incidentOptions
            : [{ text: { type: "plain_text", text: "No active incidents" }, value: "none" }],
        },
      },
      {
        type: "input",
        block_id: "lifecycle",
        label: { type: "plain_text", text: "Status" },
        element: {
          type: "static_select",
          action_id: "lifecycle_select",
          options: [
            { text: { type: "plain_text", text: "Investigating" }, value: "investigating" },
            { text: { type: "plain_text", text: "Identified" }, value: "identified" },
            { text: { type: "plain_text", text: "Monitoring" }, value: "monitoring" },
            { text: { type: "plain_text", text: "Resolved" }, value: "resolved" },
          ],
        },
      },
      ...(componentOptions.length > 0
        ? [
            {
              type: "input" as const,
              block_id: "components",
              label: { type: "plain_text" as const, text: "Affected Components" },
              element: {
                type: "multi_static_select" as const,
                action_id: "components_select",
                options: componentOptions,
              },
            },
          ]
        : []),
      {
        type: "input",
        block_id: "component_status",
        label: { type: "plain_text", text: "Component Status" },
        element: {
          type: "static_select",
          action_id: "component_status_select",
          options: [
            { text: { type: "plain_text", text: "Degraded Performance" }, value: "degraded_performance" },
            { text: { type: "plain_text", text: "Partial Outage" }, value: "partial_outage" },
            { text: { type: "plain_text", text: "Major Outage" }, value: "major_outage" },
          ],
        },
      },
      {
        type: "input",
        block_id: "customer_impact",
        label: { type: "plain_text", text: "Customer Impact" },
        element: {
          type: "plain_text_input",
          action_id: "customer_impact_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "mitigation",
        label: { type: "plain_text", text: "Mitigation Status" },
        element: {
          type: "plain_text_input",
          action_id: "mitigation_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "internal_notes",
        label: { type: "plain_text", text: "Internal Notes" },
        element: {
          type: "plain_text_input",
          action_id: "internal_notes_input",
          multiline: true,
        },
        optional: true,
      },
    ],
  };
}

export function registerUpdateModalHandlers(app: App) {
  app.view("update_incident_modal", async ({ ack, view, body, client }) => {
    await ack();

    const vals = view.state.values as ViewOutput["state"]["values"];
    const incidentId = vals.incident_select?.incident_id?.selected_option?.value;
    if (!incidentId || incidentId === "none") return;

    const userId = body.user.id;
    let userName = body.user.name ?? userId;
    try {
      const userInfo = await client.users.info({ user: userId });
      userName = userInfo.user?.real_name ?? userInfo.user?.name ?? userName;
    } catch {
      // Fallback
    }

    const lifecycle = vals.lifecycle?.lifecycle_select?.selected_option?.value ?? "investigating";
    const componentIds = (vals.components?.components_select?.selected_options ?? []).map(
      (o: { value: string }) => o.value
    );
    const componentStatus =
      vals.component_status?.component_status_select?.selected_option?.value ?? "partial_outage";
    const customerImpact = vals.customer_impact?.customer_impact_input?.value ?? "";
    const mitigation = vals.mitigation?.mitigation_input?.value ?? "";
    const internalNotes = vals.internal_notes?.internal_notes_input?.value ?? "";

    const affected_components = componentIds.map((id: string) => ({
      component_id: id,
      component_name: id,
      component_status: componentStatus as ComponentStatus,
    }));

    const incident = await getIncident(incidentId);
    if (!incident) return;

    const brief: BriefPayload = {
      severity: incident.severity,
      lifecycle_state: lifecycle as BriefPayload["lifecycle_state"],
      affected_components,
      customer_impact: customerImpact,
      scope: "all",
      start_time: incident.created_at,
      detection_time: incident.created_at,
      mitigation_status: mitigation,
      internal_notes: internalNotes || undefined,
      existing_incident_id: incidentId,
      submitter_name: userName,
    };

    await client.chat.postMessage({
      channel: userId,
      text: `Processing your incident update...`,
    });

    // Fetch last published update for context
    let lastPublishedUpdate: string | null = null;
    if (incident.statuspage_incident_id) {
      try {
        const spIncident = await getStatuspageIncident(incident.statuspage_incident_id);
        if (spIncident.incident_updates?.length > 0) {
          const latest = spIncident.incident_updates[0];
          lastPublishedUpdate = `[${latest.status}] ${latest.body}`;
        }
      } catch {
        // Non-fatal
      }
    }

    try {
      const update = await createIncidentUpdate({
        incident_id: incidentId,
        brief_json: brief as unknown as Record<string, unknown>,
        submitted_by: userName,
        status: "processing",
      });

      await createEvent({
        incident_id: incidentId,
        update_id: update.id,
        type: "brief_submitted",
        actor: userName,
        payload_json: { source: "slack", ...brief } as Record<string, unknown>,
      });

      await runPipeline(update.id, incidentId, brief, lastPublishedUpdate);

      const completed = await getIncidentUpdate(update.id);
      const reviewed = completed?.reviewed_json as unknown as import("@/lib/shared/types").ReviewerOutput | null;
      const drafted = completed?.drafted_json as unknown as import("@/lib/shared/types").DrafterOutput | null;

      if (reviewed) {
        const message = buildDraftMessage(update.id, reviewed, drafted?.flags ?? []);
        await client.chat.postMessage({
          channel: userId,
          ...message,
        });
      } else {
        await client.chat.postMessage({
          channel: userId,
          text: `Pipeline completed but no reviewed draft was produced. Check the web queue for details.`,
        });
      }
    } catch (err) {
      await client.chat.postMessage({
        channel: userId,
        text: `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  });
}
