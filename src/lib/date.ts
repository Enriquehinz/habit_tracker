import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";

export type CalendarCell = {
  date: Date;
  iso: string;
  inRange: boolean;
  isToday: boolean;
};

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getCalendarWeeks(rangeDays: number, today = new Date()) {
  const lastDay = startOfDay(today);
  const firstDayInRange = subDays(lastDay, rangeDays - 1);
  const calendarStart = startOfWeek(firstDayInRange, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1 });

  const cells = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(
    (date) => ({
      date,
      iso: toDateKey(date),
      inRange: date >= firstDayInRange && date <= lastDay,
      isToday: toDateKey(date) === toDateKey(lastDay),
    }),
  );

  const weeks: CalendarCell[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function formatDayLabel(isoDate: string) {
  return format(new Date(`${isoDate}T12:00:00`), "MMM d, yyyy");
}

export function getMonthLabel(date: Date) {
  return format(date, "MMM");
}

export function getPreviousDateKey(isoDate: string, days = 1) {
  return toDateKey(addDays(new Date(`${isoDate}T12:00:00`), -days));
}
