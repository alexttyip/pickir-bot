import { PlainTextOption } from "@slack/types";

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// Ordered Monday to Sunday to match a typical working week
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const toWeekdayOption = (day: number): PlainTextOption => ({
  text: {
    type: "plain_text",
    text: DAY_NAMES[day] ?? "",
    emoji: true,
  },
  value: String(day),
});

export const weekdayOptions: PlainTextOption[] =
  WEEK_ORDER.map(toWeekdayOption);

export const getWeekdayOptions = (days: number[]): PlainTextOption[] =>
  days.map(toWeekdayOption);

export const isUserWorkingToday = (
  memberWorkingDays: Record<string, number[]> | undefined,
  userId: string,
): boolean => {
  const workingDays = memberWorkingDays?.[userId];

  return (
    !workingDays ||
    workingDays.length === 0 ||
    workingDays.includes(new Date().getDay())
  );
};
