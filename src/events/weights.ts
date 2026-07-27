import { SayFn } from "@slack/bolt";
import { ContextWithConversation } from "../types";
import {
  getSimpleTextBlock,
  sayInThread,
} from "../clients-and-helpers/sayHelpers";

export const editWeights = async (
  say: SayFn,
  restOfCommand: string[],
  context: ContextWithConversation,
  mentionTs: string,
) => {
  console.log("editWeights");
  const { weights } = context.conversation;
  const user = restOfCommand[0] ?? "";
  const newWeight = Number(restOfCommand[1]);

  weights[user] = newWeight;

  await context.updateConversation({
    ...context.conversation,
    weights,
  });

  await showWeights(
    say,
    context,
    mentionTs,
  )
};

export const showWeights = async (
  say: SayFn,
  { conversation }: ContextWithConversation,
  mentionTs: string,
) => {
  const { weights } = conversation;

  return sayInThread(say, mentionTs, [
    getSimpleTextBlock(
      `Weights:\n \`\`\`${Object.entries(weights)
        .map((userWeightPair) => `${userWeightPair[0]}: ${userWeightPair[1]}`)
        .join("\n")}\`\`\``,
    )
  ]);
};
