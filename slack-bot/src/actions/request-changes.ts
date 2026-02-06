import type { App } from "@slack/bolt";
import { getIncidentUpdate } from "@/lib/supabase/queries";
import { buildChangesModal } from "../modals/changes-modal";

export function registerRequestChangesAction(app: App) {
  app.action("request_changes_draft", async ({ ack, action, body, client }) => {
    await ack();

    if (!("value" in action) || !("trigger_id" in body)) return;
    const updateId = action.value;

    const update = await getIncidentUpdate(updateId);
    if (!update) return;

    await client.views.open({
      trigger_id: body.trigger_id,
      view: buildChangesModal(updateId),
    });
  });
}
