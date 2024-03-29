import { WebClient } from "@slack/web-api";
import { isString } from "lodash";

export const getAllUserIdsInChannel = async (
  channel: string,
  client: WebClient,
) => {
  const members =
    (await client.conversations
      .members({ channel })
      .then((obj) => obj.members)) ?? [];

  const infoPromises = members.map((member) =>
    client.users
      .info({
        user: member,
      })
      .then(({ user }) => user),
  );

  const infos = await Promise.all(infoPromises);

  // Exclude bots and undefined users
  return infos.reduce((acc: string[], user) => {
    if (!user) {
      return acc;
    }

    const { id, is_bot } = user;

    if (!is_bot && id) {
      acc.push(id);
    }

    return acc;
  }, []);
};

export const getAllUserIdsInMessage = (restOfCommand: string[]) =>
  restOfCommand.reduce((acc: string[], word) => {
    if (word.match(/^<@[A-Z0-9]*>/)) {
      acc.push(word.substring(2, word.length - 1));
    }

    return acc;
  }, []);

export const getUserNamesByIds = (
  client: WebClient,
  userIds: string[],
): Promise<string[]> =>
  Promise.all(userIds.map((user: string) => client.users.info({ user }))).then(
    (users) =>
      users.map(({ user }) => user?.profile?.display_name).filter(isString),
  );
