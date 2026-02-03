import { ContextWithConversation } from "../types";

export const refreshSnoozedUsers = async (
  context: ContextWithConversation,
): Promise<string[]> => {
  const now = Date.now();
  const { conversation } = context;

  const activeSnoozedUsers = conversation.snoozed.filter(
    (entry) => entry.expiryTimestamp >= now,
  );

  if (activeSnoozedUsers.length !== conversation.snoozed.length) {
    conversation.snoozed = activeSnoozedUsers;
    await context.updateConversation(conversation);
  }

  return activeSnoozedUsers.map((entry) => entry.userId);
};
