import {
  BlockAction,
  Middleware,
  SlackActionMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from "@slack/bolt/dist/types";
import { doesContextHaveConversation } from "../types";
import { throwUnexpectedError } from "../clients-and-helpers/errorHandler";
import { ManageUsersButtonPayload } from "./teams";
import { ViewSubmitAction } from "@slack/bolt/dist/types/view";
import store from "../clients-and-helpers/dbClient";
import { InputBlock } from "@slack/types";
import { getUserName } from "../clients-and-helpers/userHelpers";
import {
  getWeekdayOptions,
  weekdayOptions,
} from "../clients-and-helpers/workingDays";

const MANAGE_WORKING_DAYS_BLOCK_ID_PREFIX = "MANAGE_WORKING_DAYS_BLOCK_ID_";
const MANAGE_WORKING_DAYS_ACTION_ID_PREFIX = "MANAGE_WORKING_DAYS_ACTION_ID_";

interface ManageWorkingDaysModalSubmissionPayload {
  teamId: string;
  conversationId: string;
}

export const manageWorkingDays: Middleware<
  SlackActionMiddlewareArgs<BlockAction>
> = async ({ ack, body, context, client }) => {
  await ack();

  if (!body.message) {
    console.error("No message in body", body);
    return;
  }

  if (!body.channel) {
    console.error("No channel in body", body);
    return;
  }

  const action = body.actions[0];
  const channel = body.channel.id;
  const pickMessageTs = body.message.ts;

  if (!action || action.type !== "button") {
    return throwUnexpectedError(client, channel, pickMessageTs);
  }

  if (!doesContextHaveConversation(context)) {
    return throwUnexpectedError(client, channel, body.message.ts);
  }

  const { teamId } = JSON.parse(action.value) as ManageUsersButtonPayload;
  const team = context.conversation.teams[teamId];

  if (!team) {
    return throwUnexpectedError(client, channel, body.message.ts);
  }

  const { members, memberWorkingDays } = team;

  const payload: ManageWorkingDaysModalSubmissionPayload = {
    teamId,
    conversationId: channel,
  };

  const inputBlocks: InputBlock[] = await Promise.all(
    members.map(async (userId): Promise<InputBlock> => {
      const userName = await getUserName(client, userId);
      const selectedOptions = getWeekdayOptions(
        memberWorkingDays?.[userId] ?? [],
      );

      return {
        type: "input",
        block_id: `${MANAGE_WORKING_DAYS_BLOCK_ID_PREFIX}${userId}`,
        optional: true,
        element: {
          type: "multi_static_select",
          action_id: `${MANAGE_WORKING_DAYS_ACTION_ID_PREFIX}${userId}`,
          options: weekdayOptions,
          ...(selectedOptions.length > 0
            ? { initial_options: selectedOptions }
            : {}),
          placeholder: {
            type: "plain_text",
            text: "Leave empty for all days",
          },
        },
        label: {
          type: "plain_text",
          text: `@${userName}`,
        },
      };
    }),
  );

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "manage_working_days_modal_submission",
      title: {
        type: "plain_text",
        text: "Manage Working Days",
      },
      private_metadata: JSON.stringify(payload),
      blocks:
        inputBlocks.length > 0
          ? inputBlocks
          : [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "No users in this team yet. Add users first!",
                },
              },
            ],
      submit:
        inputBlocks.length > 0
          ? {
              type: "plain_text",
              text: "Submit",
            }
          : undefined,
    },
  });
};

export const manageWorkingDaysModalSubmission: Middleware<
  SlackViewMiddlewareArgs<ViewSubmitAction>
> = async ({ ack, view }) => {
  const { teamId, conversationId } = JSON.parse(
    view.private_metadata,
  ) as ManageWorkingDaysModalSubmissionPayload;

  const conversation = await store.get(conversationId);
  const team = conversation.teams[teamId];

  if (!team) {
    return ack({
      response_action: "errors",
      errors: {
        "": "Team not found",
      },
    });
  }

  const memberWorkingDays: Record<string, number[]> = {};

  Object.entries(view.state.values).forEach(([blockId, actions]) => {
    if (blockId.startsWith(MANAGE_WORKING_DAYS_BLOCK_ID_PREFIX)) {
      const userId = blockId.replace(MANAGE_WORKING_DAYS_BLOCK_ID_PREFIX, "");
      const actionId = `${MANAGE_WORKING_DAYS_ACTION_ID_PREFIX}${userId}`;
      const days = actions[actionId]?.selected_options
        ?.map((option) => Number(option.value))
        .filter((day) => !Number.isNaN(day));

      if (days?.length) {
        memberWorkingDays[userId] = days;
      }
    }
  });

  conversation.teams[teamId] = {
    ...team,
    memberWorkingDays,
  };

  await store.set(conversationId, conversation);

  await ack();
};
