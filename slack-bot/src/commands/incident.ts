import type { App } from "@slack/bolt";
import { buildCreateModal } from "../modals/create-modal";
import { buildUpdateModal } from "../modals/update-modal";

export function registerIncidentCommand(app: App) {
  app.command("/incident", async ({ command, ack, client }) => {
    await ack();

    const subcommand = command.text.trim().toLowerCase();

    if (subcommand === "create") {
      await client.views.open({
        trigger_id: command.trigger_id,
        view: await buildCreateModal(),
      });
    } else if (subcommand === "update") {
      await client.views.open({
        trigger_id: command.trigger_id,
        view: await buildUpdateModal(),
      });
    } else {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: "Usage: `/incident create` or `/incident update`",
      });
    }
  });
}
