import { App } from "@slack/bolt";
import "dotenv/config";
import { registerIncidentCommand } from "./commands/incident";
import { registerModalHandlers } from "./modals/create-modal";
import { registerUpdateModalHandlers } from "./modals/update-modal";
import { registerEditFieldsModal } from "./modals/edit-fields-modal";
import { registerChangesModal } from "./modals/changes-modal";
import { registerApproveAction } from "./actions/approve";
import { registerRequestChangesAction } from "./actions/request-changes";
import { registerEditFieldsAction } from "./actions/edit-fields";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
});

// Register all handlers
registerIncidentCommand(app);
registerModalHandlers(app);
registerUpdateModalHandlers(app);
registerEditFieldsModal(app);
registerChangesModal(app);
registerApproveAction(app);
registerRequestChangesAction(app);
registerEditFieldsAction(app);

(async () => {
  await app.start();
  console.log("Incident Comms Slack bot is running!");
})();
