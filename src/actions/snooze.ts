import { ContextWithConversation } from "../types";
import { getAllUserIdsInMessage } from "../clients-and-helpers/userHelpers";
import { WebClient } from "@slack/web-api";
import { throwUserError } from "../clients-and-helpers/errorHandler";
import { SayFn } from "@slack/bolt";
import { sayInThread } from "../clients-and-helpers/sayHelpers";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

const parseSnoozeTime = (args: string[]): number | null => {
  if (args.length === 0) {
    return null;
  }

  const firstArg = args[0]?.toLowerCase();

  if (firstArg === "today") {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  if (args.length < 2) {
    return null;
  }

  const amount = parseInt(args[0] ?? "");
  const unit = args[1]?.toLowerCase();

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  const now = Date.now();
  let milliseconds = 0;

  switch (unit) {
    case "hour":
    case "hours":
      milliseconds = amount * ONE_HOUR_IN_MS;
      break;
    case "day":
    case "days":
      milliseconds = amount * 24 * ONE_HOUR_IN_MS;
      break;
    case "week":
    case "weeks":
      milliseconds = amount * 7 * 24 * ONE_HOUR_IN_MS;
      break;
    default:
      return null;
  }

  return now + milliseconds;
};

export interface SnoozeButtonPayload {
  userIds: string[];
  mentionTs: string;
}

export const isSnoozeButtonPayload = (
  value: unknown,
): value is SnoozeButtonPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "userIds" in value &&
    "mentionTs" in value &&
    Array.isArray(value.userIds) &&
    value.userIds.every((id) => typeof id === "string") &&
    typeof value.mentionTs === "string"
  );
};

export const snooze = async (
  say: SayFn,
  channel: string,
  restOfCommand: string[],
  context: ContextWithConversation,
  mentionTs: string,
  client: WebClient,
): Promise<void> => {
  const { conversation } = context;

  const userIds = getAllUserIdsInMessage(restOfCommand);

  if (userIds.length === 0) {
    return throwUserError(client, channel, mentionTs);
  }

  const timeArgs = restOfCommand.filter((arg) => !arg.startsWith("<@"));
  const snoozeUntil = parseSnoozeTime(timeArgs);

  if (!snoozeUntil) {
    return throwUserError(client, channel, mentionTs);
  }

  const existingSnoozes = conversation.snoozed.filter(
    (entry) => !userIds.includes(entry.userId),
  );

  const newSnoozes = userIds.map((userId) => ({
    userId,
    expiryTimestamp: snoozeUntil,
  }));

  conversation.snoozed = [...existingSnoozes, ...newSnoozes];

  await context.updateConversation(conversation);

  const payload: SnoozeButtonPayload = {
    userIds,
    mentionTs,
  };

  await sayInThread(say, mentionTs, [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:zzz: Snoozed ${userIds.map((id) => `<@${id}>`).join(", ")}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: ":press_to_unsnooze: Unsnooze",
            emoji: true,
          },
          value: JSON.stringify(payload),
          action_id: "unsnooze_button_click",
        },
      ],
    },
  ]);
};
