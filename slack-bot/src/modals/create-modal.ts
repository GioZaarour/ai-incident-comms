import type { App, ViewOutput } from "@slack/bolt";
import type { View } from "@slack/web-api";
import { listComponents } from "@/lib/statuspage/client";
import {
  createIncident,
  createIncidentUpdate,
  getIncidentUpdate,
  createEvent,
} from "@/lib/supabase/queries";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
import { buildDraftMessage } from "../views/draft-message";
import type { BriefPayload } from "@/lib/shared/types";
import type { ComponentStatus } from "@/lib/shared/constants";

export async function buildCreateModal(): Promise<View> {
  let componentOptions: { text: { type: "plain_text"; text: string }; value: string }[] = [];
  try {
    const components = await listComponents();
    componentOptions = components.map((c) => ({
      text: { type: "plain_text" as const, text: c.name },
      value: c.id,
    }));
  } catch {
    // Fallback: empty
  }

  return {
    type: "modal",
    callback_id: "create_incident_modal",
    title: { type: "plain_text", text: "New Incident" },
    submit: { type: "plain_text", text: "Submit Brief" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "severity",
        label: { type: "plain_text", text: "Severity" },
        element: {
          type: "static_select",
          action_id: "severity_select",
          options: [
            { text: { type: "plain_text", text: "SEV1 - Critical" }, value: "sev1" },
            { text: { type: "plain_text", text: "SEV2 - Major" }, value: "sev2" },
            { text: { type: "plain_text", text: "SEV3 - Minor" }, value: "sev3" },
          ],
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

function extractValues(values: ViewOutput["state"]["values"]) {
  return {
    severity: values.severity?.severity_select?.selected_option?.value ?? "sev3",
    lifecycle: values.lifecycle?.lifecycle_select?.selected_option?.value ?? "investigating",
    componentIds: (values.components?.components_select?.selected_options ?? []).map(
      (o: { value: string }) => o.value
    ),
    componentStatus:
      values.component_status?.component_status_select?.selected_option?.value ??
      "partial_outage",
    customerImpact: values.customer_impact?.customer_impact_input?.value ?? "",
    mitigation: values.mitigation?.mitigation_input?.value ?? "",
    internalNotes: values.internal_notes?.internal_notes_input?.value ?? "",
  };
}

export function registerModalHandlers(app: App) {
  app.view("create_incident_modal", async ({ ack, view, body, client }) => {
    await ack();

    const vals = extractValues(view.state.values);
    const userId = body.user.id;
    let userName = body.user.name ?? userId;

    try {
      const userInfo = await client.users.info({ user: userId });
      userName = userInfo.user?.real_name ?? userInfo.user?.name ?? userName;
    } catch {
      // Use fallback name
    }

    const affected_components = vals.componentIds.map((id: string) => ({
      component_id: id,
      component_name: id,
      component_status: vals.componentStatus as ComponentStatus,
    }));

    const brief: BriefPayload = {
      severity: vals.severity as BriefPayload["severity"],
      lifecycle_state: vals.lifecycle as BriefPayload["lifecycle_state"],
      affected_components,
      customer_impact: vals.customerImpact,
      scope: "all",
      start_time: new Date().toISOString(),
      detection_time: new Date().toISOString(),
      mitigation_status: vals.mitigation,
      internal_notes: vals.internalNotes || undefined,
      submitter_name: userName,
    };

    // Post processing message
    await client.chat.postMessage({
      channel: userId,
      text: `Processing your incident brief...`,
    });

    try {
      const incident = await createIncident({
        title: `${brief.severity.toUpperCase()} - ${brief.customer_impact.slice(0, 100)}`,
        status: brief.lifecycle_state,
        severity: brief.severity,
        created_by: brief.submitter_name,
      });

      const update = await createIncidentUpdate({
        incident_id: incident.id,
        brief_json: brief as unknown as Record<string, unknown>,
        submitted_by: brief.submitter_name,
        status: "processing",
      });

      await createEvent({
        incident_id: incident.id,
        update_id: update.id,
        type: "brief_submitted",
        actor: brief.submitter_name,
        payload_json: { source: "slack", ...brief } as Record<string, unknown>,
      });

      // Run pipeline then post draft
      await runPipeline(update.id, incident.id, brief);

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
        text: `Failed to process brief: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  });
}
