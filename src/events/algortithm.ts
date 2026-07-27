import { SayFn } from "@slack/bolt";
import { ContextWithConversation, PickingAlgorithm } from "../types";
import {
  getSimpleTextBlock,
  sayInThread,
} from "../clients-and-helpers/sayHelpers";

export const editPickingAlgorithm = async (
  say: SayFn,
  restOfCommand: string[],
  context: ContextWithConversation,
  mentionTs: string,
) => {
  console.log("editWeights");
  const newPickingAlgorithm = {
    "AN": PickingAlgorithm.atmosphericNoise,
    "MR": PickingAlgorithm.mathRandom,
    "WR": PickingAlgorithm.weightedRandom,
  }[restOfCommand[0] ?? "AN"] ?? PickingAlgorithm.atmosphericNoise;

  await context.updateConversation({
    ...context.conversation,
    pickingAlgorithm: newPickingAlgorithm,
  });

  await showPickingAlgorithm(
    say,
    context,
    mentionTs,
  )
};

export const showPickingAlgorithm = async (
  say: SayFn,
  { conversation }: ContextWithConversation,
  mentionTs: string,
) => {
  const { pickingAlgorithm } = conversation;

  return sayInThread(say, mentionTs, [
    getSimpleTextBlock(
      `Picking Algorithm: ${pickingAlgorithm}`,
    )
  ]);
};
