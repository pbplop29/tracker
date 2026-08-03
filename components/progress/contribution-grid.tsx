"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/store/workout-store";
import { toDateKey, todayKey } from "@/lib/date";

const WEEKS = 26;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Day {
  key: string;
  date: Date;
  inFuture: boolean;
  isMonthStart: boolean;
}

export function getGridRange(): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + (6 - today.getDay()));
  const gridStart = new Date(currentWeekEnd);
  gridStart.setDate(currentWeekEnd.getDate() - (WEEKS * 7 - 1));
  return { from: toDateKey(gridStart), to: toDateKey(today) };
}

function buildWeeks(): Day[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + (6 - today.getDay())); // upcoming Saturday

  const gridStart = new Date(currentWeekEnd);
  gridStart.setDate(currentWeekEnd.getDate() - (WEEKS * 7 - 1)); // Sunday, WEEKS weeks back

  const weeks: Day[][] = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const week: Day[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const month = date.getMonth();
      const isMonthStart = date.getDate() <= 7 && month !== lastMonth;
      if (isMonthStart) lastMonth = month;
      week.push({ key: toDateKey(date), date, inFuture: date > today, isMonthStart });
    }
    weeks.push(week);
  }
  return weeks;
}

export function ContributionGrid({ loggedDates }: { loggedDates: Set<string> }) {
  const router = useRouter();
  const setSelectedDate = useWorkoutStore((s) => s.setSelectedDate);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(() => buildWeeks(), []);
  const today = todayKey();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const goToDay = (day: Day) => {
    if (day.inFuture) return;
    setSelectedDate(day.key);
    router.push("/");
  };

  return (
    <div className="w-full">
      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1 pl-1">
          <div className="flex gap-1">
            {weeks.map((week, i) => {
              const label = week.find((d) => d.isMonthStart);
              return (
                <div key={i} className="w-[13px] shrink-0 text-[10px] text-muted-foreground">
                  {label ? MONTH_LABELS[label.date.getMonth()] : ""}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const logged = loggedDates.has(day.key);
                  return (
                    <button
                      key={day.key}
                      onClick={() => goToDay(day)}
                      disabled={day.inFuture}
                      aria-label={day.key}
                      title={day.key}
                      className={cn(
                        "size-[13px] shrink-0 rounded-[3px] transition-transform active:scale-90 disabled:cursor-default",
                        day.inFuture
                          ? "bg-transparent"
                          : logged
                            ? "bg-brand"
                            : "bg-secondary hover:bg-secondary-foreground/10",
                        day.key === today && "ring-2 ring-offset-1 ring-offset-background ring-foreground/40"
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 pr-1 text-[11px] text-muted-foreground">
        <span>Less</span>
        <span className="size-[11px] rounded-[3px] bg-secondary" />
        <span className="size-[11px] rounded-[3px] bg-brand" />
        <span>More</span>
      </div>
    </div>
  );
}
