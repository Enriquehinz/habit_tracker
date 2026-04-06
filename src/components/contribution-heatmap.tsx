"use client";

import { formatDayLabel, getCalendarWeeks, getMonthLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

type HeatmapProps = {
  title: string;
  subtitle?: string;
  levelsByDate: Record<string, 0 | 1 | 2 | 3 | 4>;
  labelsByDate?: Record<string, string>;
  onTodayClick?: () => void;
  todayDate: string;
  rangeDays?: number;
};

const weekdayLabels = [
  { label: "Mon", row: 0 },
  { label: "Wed", row: 2 },
  { label: "Fri", row: 4 },
] as const;

function levelClass(level: number) {
  switch (level) {
    case 1:
      return "bg-[var(--level-1)]";
    case 2:
      return "bg-[var(--level-2)]";
    case 3:
      return "bg-[var(--level-3)]";
    case 4:
      return "bg-[var(--level-4)]";
    default:
      return "bg-[var(--level-0)]";
  }
}

export function ContributionHeatmap({
  title,
  subtitle,
  levelsByDate,
  labelsByDate,
  onTodayClick,
  todayDate,
  rangeDays = 365,
}: HeatmapProps) {
  const weeks = getCalendarWeeks(rangeDays, new Date(`${todayDate}T12:00:00`));

  return (
    <section className="rounded-3xl border bg-[var(--card)] p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle ? <p className="text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        <div className="text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-2">
            <span>Less</span>
            <span className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn(
                    "h-3.5 w-3.5 rounded-[4px] border border-black/5",
                    levelClass(level),
                  )}
                />
              ))}
            </span>
            <span>More</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="mb-2 ml-8 flex gap-1">
            {weeks.map((week, index) => {
              const firstVisibleDay = week.find((day) => day.inRange);
              const previousVisibleDay =
                index > 0 ? weeks[index - 1].find((day) => day.inRange) : undefined;

              const monthLabel =
                firstVisibleDay &&
                getMonthLabel(firstVisibleDay.date) !==
                  (previousVisibleDay ? getMonthLabel(previousVisibleDay.date) : "")
                  ? getMonthLabel(firstVisibleDay.date)
                  : "";

              return (
                <div key={`${week[0].iso}-month`} className="w-4 text-[10px] text-[var(--muted)]">
                  {monthLabel}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1 pt-0.5 text-[10px] text-[var(--muted)]">
              {Array.from({ length: 7 }).map((_, rowIndex) => {
                const visibleLabel = weekdayLabels.find((item) => item.row === rowIndex);

                return (
                  <div key={rowIndex} className="flex h-4 items-center justify-end">
                    {visibleLabel?.label}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1">
              {weeks.map((week) => (
                <div key={week[0].iso} className="grid grid-rows-7 gap-1">
                  {week.map((day) => {
                    const level = day.inRange ? levelsByDate[day.iso] ?? 0 : 0;
                    const isToday = day.iso === todayDate;
                    const canToggle = Boolean(onTodayClick && isToday);
                    const label =
                      labelsByDate?.[day.iso] ??
                      `${formatDayLabel(day.iso)} · ${
                        level > 0 ? "completed" : "not completed"
                      }`;
                    const classes = cn(
                      "h-4 w-4 rounded-[4px] border border-black/5 transition sm:h-[18px] sm:w-[18px]",
                      day.inRange ? levelClass(level) : "bg-transparent border-transparent",
                      isToday && "ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--card)]",
                      canToggle && "cursor-pointer hover:scale-105",
                    );

                    if (!day.inRange) {
                      return <div key={day.iso} className={classes} aria-hidden="true" />;
                    }

                    if (!canToggle) {
                      return <div key={day.iso} className={classes} title={label} />;
                    }

                    return (
                      <button
                        key={day.iso}
                        type="button"
                        onClick={onTodayClick}
                        title={`${label} · Tap to toggle`}
                        className={classes}
                        aria-label={`${title} for ${formatDayLabel(day.iso)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
