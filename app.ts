import "dotenv/config";
import { App } from "@slack/bolt";
import store from "./src/clients-and-helpers/dbClient";
import { mentionEvent } from "./src/events/mention";
import { reRoll } from "./src/events/reRoll";
import {
  manageUsersInTeam,
  manageUsersModalSubmission,
} from "./src/events/manageUsersInTeam";
import {
  showUserPickedCountStats,
  showUserTriggerCountStats,
} from "./src/events/stats";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  convoStore: store,
});

app.event("app_mention", mentionEvent);
app.action("re_roll_button_click", reRoll);
app.action("manage_users_button_click", manageUsersInTeam);

app.action("stats_user_trigger_count_btn_click", showUserTriggerCountStats);
app.action("stats_user_picked_count_btn_click", showUserPickedCountStats);
app.action(
  "stats_picking_to_picked_ratio_btn_click",
  showUserTriggerCountStats,
); // TODO

app.view("manage_users_modal_submission", manageUsersModalSubmission);

void app.start().then(() => {
  console.log("⚡️ Bolt app is running!");
});
