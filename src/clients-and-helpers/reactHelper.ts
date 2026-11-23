import { WebClient } from "@slack/web-api";

export const addReact = async (
  client: WebClient,
  channel: string,
  timestamp: string,
  emoji: string,
) => {
  try {
    await client.reactions.add({
      channel,
      timestamp,
      name: emoji.replace(/:/g, ""),
    });
  } catch (error) {
    console.error("Failed to add reaction:", error);
  }
};

export const removeReact = async (
  client: WebClient,
  channel: string,
  timestamp: string,
  emoji: string,
) => {
  try {
    await client.reactions.remove({
      channel,
      timestamp,
      name: emoji.replace(/:/g, ""),
    });
  } catch (error) {
    console.error("Failed to remove reaction:", error);
  }
};
