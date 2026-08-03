"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useWorkoutStore } from "@/lib/store/workout-store";
import { addDays, formatDisplayDate, fromDateKey, isToday, toDateKey } from "@/lib/date";
import { useState } from "react";

export function TopBar() {
  const selectedDate = useWorkoutStore((s) => s.selectedDate);
  const setSelectedDate = useWorkoutStore((s) => s.setSelectedDate);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = isToday(selectedDate);
  const weekday = fromDateKey(selectedDate).toLocaleDateString("en-US", { weekday: "long" });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-1 border-b border-border/60 bg-background/80 px-2 py-3 backdrop-blur-md safe-top">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous day"
        className="h-11 w-11 shrink-0 rounded-full"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
      >
        <ChevronLeft className="size-5" />
      </Button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-center active:bg-accent transition-colors"
          aria-label="Open calendar"
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-[15px] font-semibold">
            {today ? "Today" : weekday}
            <span className="mx-1.5 text-muted-foreground font-normal">•</span>
            <span className="text-muted-foreground font-normal">{formatDisplayDate(selectedDate)}</span>
          </span>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={fromDateKey(selectedDate)}
            defaultMonth={fromDateKey(selectedDate)}
            disabled={{ after: new Date() }}
            onSelect={(date) => {
              if (!date) return;
              setSelectedDate(toDateKey(date));
              setCalendarOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Next day"
        className="h-11 w-11 shrink-0 rounded-full"
        disabled={today}
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
      >
        <ChevronRight className="size-5" />
      </Button>
    </header>
  );
}
