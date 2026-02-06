import type { App } from "@slack/bolt";
import { getIncidentUpdate } from "@/lib/supabase/queries";
import { buildEditFieldsModal } from "../modals/edit-fields-modal";
import type { ReviewerOutput } from "@/lib/shared/types";

export function registerEditFieldsAction(app: App) {
  app.action("edit_fields_draft", async ({ ack, action, body, client }) => {
    await ack();

    if (!("value" in action) || !("trigger_id" in body)) return;
    const updateId = action.value;

    const update = await getIncidentUpdate(updateId);
    if (!update || !update.reviewed_json) return;

    const reviewed = update.reviewed_json as unknown as ReviewerOutput;

    await client.views.open({
      trigger_id: body.trigger_id,
      view: buildEditFieldsModal(updateId, reviewed),
    });
  });
}
