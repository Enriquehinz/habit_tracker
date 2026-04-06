import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isValid,
  parseISO,
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

export function normalizeDateKey(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValid(value) ? toDateKey(value) : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsedIso = parseISO(trimmed);

  if (isValid(parsedIso)) {
    return toDateKey(parsedIso);
  }

  const parsedDate = new Date(trimmed);

  return isValid(parsedDate) ? toDateKey(parsedDate) : null;
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

export function formatDayLabel(isoDate: Date | string | null | undefined) {
  const normalizedDate = normalizeDateKey(isoDate);

  if (!normalizedDate) {
    return null;
  }

  return format(parseISO(normalizedDate), "MMM d, yyyy");
}

export function getMonthLabel(date: Date) {
  return format(date, "MMM");
}

export function getPreviousDateKey(isoDate: string, days = 1) {
  const normalizedDate = normalizeDateKey(isoDate);

  if (!normalizedDate) {
    return isoDate;
  }

  return toDateKey(addDays(parseISO(normalizedDate), -days));
}
