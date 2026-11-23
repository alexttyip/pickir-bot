# Pickir Bot

## Usage

| Command                  | Description                                                                                  | Example                                 |
|--------------------------|----------------------------------------------------------------------------------------------|-----------------------------------------|
| `pick <message>`         | Pick a non-excluded user from the channel.<br>Pickir will never pick the picker.             | `@Pickir pick TFGM-123: This is a test` |
| `[exclude \| rm] @User`  | Exclude the user from **all** picks.<br>Note that by default all users are included.         | `@Pickir exclude @Alex Yip`             |
| `[include \| i] @User`   | Re-include the user from picks.                                                              | `@Pickir include @Alex Yip`             |
| `[list-excluded \| lse]` | List and manage excluded users.                                                              | `@Pickir lse`                           |
| `create <team name>`     | Create team with the given team name and manage members.<br>Team names are case-insensitive. | `@Pickir create a-team`                 |
| `show <team name>`       | Show team and manage members.                                                                | `@Pickir show a-team`                   |
| `stats`                  | This is a WIP feature.<br>Show statistics for the current channel.                           | `@Pickir stats`                         |

## Extra flags for picks

Note that one must currently call the exclude tag after the team tag, if both are provided.

| flag                                      | Description                  |
|-------------------------------------------|------------------------------|
| `--team <team name>`, (`-t`)              | Only pick from specific team |
| `--exclude @Ned Reid @Sned Sreid`, (`-e`) | Exclude users                |

## Working weeks

Each team member can be given a working week via the "Manage working days" button under a team message.
When picking from a team, members are only picked on their selected days.
Leaving a member's days empty means they can be picked on any day.

Note that working weeks only apply to team picks (via the `--team` flag), not channel-wide picks.

## Error handling

| Pickir's reaction  | Description      |
|--------------------|------------------|
| `:user_error:`     | User error       |
| `:confusedparrot:` | Unexpected error |

## Re-rolling

The picker can re-roll by clicking the "Re-roll" button under the last picked user in the slack thread.
Re-rolling will exclude previously-picked users, until there are no more users to pick.

## What's next

- Avoid picking recently picked users
- Improved stats
- Exclude until date
- Delete team
