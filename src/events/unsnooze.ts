import {
  BlockAction,
  Middleware,
  SlackActionMiddlewareArgs,
} from "@slack/bolt/dist/types";
import { isSnoozeButtonPayload } from "../actions/snooze";
import { doesContextHaveConversation } from "../types";
import { throwUnexpectedError } from "../clients-and-helpers/errorHandler";

export const unsnooze: Middleware<
  SlackActionMiddlewareArgs<BlockAction>
> = async ({ ack, body, context, client }) => {
  await ack();

  const action = body.actions[0];

  if (!body.channel) {
    console.error("No channel in body", body);
    return;
  }

  if (!body.message) {
    console.error("No message in body", body);
    return;
  }

  const channel = body.channel.id;
  const { ts: snoozeMessageTs } = body.message;

  if (!action || action.type !== "button") {
    return throwUnexpectedError(client, channel, snoozeMessageTs);
  }

  if (!doesContextHaveConversation(context)) {
    return throwUnexpectedError(client, channel, snoozeMessageTs);
  }

  const parsedValue: unknown = JSON.parse(action.value);

  if (!isSnoozeButtonPayload(parsedValue)) {
    return throwUnexpectedError(client, channel, snoozeMessageTs);
  }

  const { userIds } = parsedValue;

  const { conversation } = context;

  conversation.snoozed = conversation.snoozed.filter(
    (entry) => !userIds.includes(entry.userId),
  );

  await context.updateConversation(conversation);

  await client.reactions.add({
    channel,
    timestamp: snoozeMessageTs,
    name: "white_check_mark",
  });
};
