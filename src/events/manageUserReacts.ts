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
import { WebClient } from "@slack/web-api";
import { InputBlock } from "@slack/types";

const MANAGE_USER_REACTS_BLOCK_ID_PREFIX = "MANAGE_USER_REACTS_BLOCK_ID_";
const MANAGE_USER_REACTS_ACTION_ID_PREFIX = "MANAGE_USER_REACTS_ACTION_ID_";

interface ManageUserReactsModalSubmissionPayload {
  teamId: string;
  conversationId: string;
}

const getUserName = async (
  client: WebClient,
  userId: string,
): Promise<string> => {
  try {
    const result = await client.users.info({ user: userId });
    return result.user?.name ?? userId;
  } catch {
    return userId;
  }
};

export const manageUserReacts: Middleware<
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

  const members = team.members;
  const memberEmojis = team.memberEmojis ?? {};

  const payload: ManageUserReactsModalSubmissionPayload = {
    teamId,
    conversationId: channel,
  };

  const inputBlocks: InputBlock[] = await Promise.all(
    members.map(async (userId) => {
      const userName = await getUserName(client, userId);
      return {
        type: "input",
        block_id: `${MANAGE_USER_REACTS_BLOCK_ID_PREFIX}${userId}`,
        optional: true,
        element: {
          type: "plain_text_input",
          action_id: `${MANAGE_USER_REACTS_ACTION_ID_PREFIX}${userId}`,
          initial_value: memberEmojis[userId] ?? "",
          placeholder: {
            type: "plain_text",
            text: "e.g. thumbsup or :thumbsup:",
          },
        },
        label: {
          type: "plain_text",
          text: `@${userName}`,
        },
      } as InputBlock;
    }),
  );

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "manage_user_reacts_modal_submission",
      title: {
        type: "plain_text",
        text: "Manage User Reacts",
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

export const manageUserReactsModalSubmission: Middleware<
  SlackViewMiddlewareArgs<ViewSubmitAction>
> = async ({ ack, view }) => {
  const { teamId, conversationId } = JSON.parse(
    view.private_metadata,
  ) as ManageUserReactsModalSubmissionPayload;

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

  const memberEmojis: Record<string, string> = {};

  Object.entries(view.state.values).forEach(([blockId, actions]) => {
    if (blockId.startsWith(MANAGE_USER_REACTS_BLOCK_ID_PREFIX)) {
      const userId = blockId.replace(MANAGE_USER_REACTS_BLOCK_ID_PREFIX, "");
      const actionId = `${MANAGE_USER_REACTS_ACTION_ID_PREFIX}${userId}`;
      const emoji = actions[actionId]?.value?.trim();

      if (emoji) {
        memberEmojis[userId] = emoji;
      }
    }
  });

  conversation.teams[teamId] = {
    ...team,
    memberEmojis,
  };

  await store.set(conversationId, conversation);

  await ack();
};
