"use client";

import useSWR from "swr";
import { Flame } from "lucide-react";
import { SubPageHeader } from "@/components/layout/sub-page-header";
import { ContributionGrid, getGridRange } from "@/components/progress/contribution-grid";
import { jsonFetcher } from "@/lib/api";

export default function ProgressPage() {
  const { from, to } = getGridRange();
  const { data, isLoading } = useSWR<string[]>(`/api/contributions?from=${from}&to=${to}`, jsonFetcher);
  const loggedDates = new Set(data ?? []);

  return (
    <div>
      <SubPageHeader title="Consistency" />
      <div className="px-4 py-5">
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{isLoading ? "-" : loggedDates.size}</p>
            <p className="text-sm text-muted-foreground">workouts in the last 26 weeks</p>
          </div>
        </div>

        <ContributionGrid loggedDates={loggedDates} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Tap any day to jump to that workout.
        </p>
      </div>
    </div>
  );
}
