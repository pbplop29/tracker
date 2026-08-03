"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { ChevronLeft } from "lucide-react";
import { SubPageHeader } from "@/components/layout/sub-page-header";
import { ExerciseSearchList } from "@/components/analytics/exercise-search-list";
import { MetricTabs, type Metric } from "@/components/analytics/metric-tabs";
import { jsonFetcher } from "@/lib/api";
import type { AnalyticsPointDto, ExerciseSummaryDto } from "@/lib/types";

const AnalyticsChart = dynamic(
  () => import("@/components/analytics/analytics-chart").then((m) => m.AnalyticsChart),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />,
  }
);

export default function AnalyticsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExerciseSummaryDto | null>(null);
  const [metric, setMetric] = useState<Metric>("weight");

  const { data: exercises } = useSWR<ExerciseSummaryDto[]>("/api/analytics/exercises", jsonFetcher);
  const { data: points, isLoading: pointsLoading } = useSWR<AnalyticsPointDto[]>(
    selected ? `/api/analytics/data?exerciseId=${selected.id}` : null,
    jsonFetcher
  );

  return (
    <div>
      <SubPageHeader title={selected ? selected.name : "Progress"}>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="mt-1 flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
          >
            <ChevronLeft className="size-4" />
            All exercises
          </button>
        )}
      </SubPageHeader>

      <div className="px-4 py-4">
        {!selected && (
          <ExerciseSearchList
            exercises={exercises ?? []}
            query={query}
            onQueryChange={setQuery}
            onSelect={setSelected}
          />
        )}

        {selected && (
          <div className="space-y-4">
            <MetricTabs value={metric} onChange={setMetric} />

            {pointsLoading && <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />}

            {!pointsLoading && points && points.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No logged sets for this exercise yet.
              </p>
            )}

            {!pointsLoading && points && points.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <AnalyticsChart data={points} metric={metric} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
