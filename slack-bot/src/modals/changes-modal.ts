import type { App } from "@slack/bolt";
import type { View } from "@slack/web-api";
import { updateIncidentUpdate, createEvent, getIncidentUpdate } from "@/lib/supabase/queries";

export function buildChangesModal(updateId: string): View {
  return {
    type: "modal",
    callback_id: "changes_modal",
    private_metadata: updateId,
    title: { type: "plain_text", text: "Request Changes" },
    submit: { type: "plain_text", text: "Submit Feedback" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "feedback",
        label: { type: "plain_text", text: "What changes are needed?" },
        element: {
          type: "plain_text_input",
          action_id: "feedback_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Describe the changes you'd like to see...",
          },
        },
      },
    ],
  };
}

export function registerChangesModal(app: App) {
  app.view("changes_modal", async ({ ack, view, body, client }) => {
    await ack();

    const updateId = view.private_metadata;
    const feedback = view.state.values.feedback?.feedback_input?.value ?? "";
    const userId = body.user.id;

    let userName = body.user.name ?? userId;
    try {
      const userInfo = await client.users.info({ user: userId });
      userName = userInfo.user?.real_name ?? userInfo.user?.name ?? userName;
    } catch {
      // Fallback
    }

    const update = await getIncidentUpdate(updateId);
    if (!update) return;

    await updateIncidentUpdate(updateId, {
      status: "changes_requested",
      change_feedback: feedback,
    });

    await createEvent({
      incident_id: update.incident_id,
      update_id: updateId,
      type: "changes_requested",
      actor: userName,
      payload_json: { feedback, source: "slack" },
    });

    await client.chat.postMessage({
      channel: userId,
      text: `Changes requested. Feedback saved.`,
    });
  });
}
