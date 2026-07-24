import {
  BlockAction,
  Middleware,
  SlackActionMiddlewareArgs,
} from "@slack/bolt/dist/types";
import { PickButtonPayload } from "../clients-and-helpers/sayHelpers";
import { doesContextHaveConversation } from "../types";
import { getUsersAndPick } from "../actions/pick";
import { throwUnexpectedError } from "../clients-and-helpers/errorHandler";
import { SectionBlock } from "@slack/types/dist/block-kit/blocks";
import { Block } from "@slack/types";
import { addReact, removeReact } from "../clients-and-helpers/reactHelper";

const isSectionBlock = (block: unknown): block is SectionBlock =>
  block !== undefined && (block as Block).type === "section";

export const reRoll: Middleware<
  SlackActionMiddlewareArgs<BlockAction>
> = async ({ ack, body, say, context, client }) => {
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
  const { ts: pickMessageTs, blocks } = body.message;

  if (!action || action.type !== "button") {
    return throwUnexpectedError(client, channel, pickMessageTs);
  }

  if (!doesContextHaveConversation(context)) {
    return throwUnexpectedError(client, channel, body.message.ts);
  }

  const { triggerTs, triggerUser, teamId, excludedInPick, pickedUser } =
    JSON.parse(action.value) as PickButtonPayload;

  const excludedUsersAndPickedUser = [...excludedInPick, pickedUser];

  // Remove old user's emoji reaction if they had one
  if (teamId) {
    const team = context.conversation.teams[teamId];
    const oldEmoji = team?.memberEmojis?.[pickedUser];

    if (oldEmoji) {
      await removeReact(client, channel, triggerTs, oldEmoji);
    }
  }

  // Hide re-roll button
  if (Array.isArray(blocks) && isSectionBlock(blocks[0])) {
    await client.chat.update({
      channel,
      ts: pickMessageTs,
      blocks: [
        {
          ...blocks[0],
          accessory: undefined,
        },
      ],
    });
  }

  await addReact(client, channel, pickMessageTs, "no-cross");

  await getUsersAndPick(
    say,
    triggerUser,
    channel,
    context,
    triggerTs,
    client,
    excludedUsersAndPickedUser,
    teamId,
  );
};
