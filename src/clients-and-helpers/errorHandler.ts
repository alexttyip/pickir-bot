import { WebClient } from "@slack/web-api";
import { addReact } from "./reactHelper";

export const throwUserError = (
  client: WebClient,
  channel: string,
  ts: string,
) => addReact(client, channel, ts, "user_error");

export const throwUnexpectedError = (
  client: WebClient,
  channel: string,
  ts: string,
) => addReact(client, channel, ts, "confusedparrot");
