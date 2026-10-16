"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useSWR, { useSWRConfig } from "swr";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SubPageHeader } from "@/components/layout/sub-page-header";
import { WheelPicker, WHEEL_HEIGHT } from "@/components/add-exercise/wheel-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deltaColor, formatDelta } from "@/components/weight/delta";
import { deleteBodyWeight, jsonFetcher, saveBodyWeight } from "@/lib/api";
import { formatDisplayDate, todayKey } from "@/lib/date";
import type { BodyWeightDto } from "@/lib/types";

const WeightChart = dynamic(() => import("@/components/weight/weight-chart").then((m) => m.WeightChart), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-muted" />,
});

const KEY = "/api/body-weight";
const DEFAULT_WEIGHT = 70;
const CONFIRM_MS = 3000;

function Delta({ delta }: { delta: number }) {
  return (
    <span className="font-medium tabular-nums" style={{ color: deltaColor(delta) }}>
      {formatDelta(delta)}
    </span>
  );
}

function HistoryRow({ entry, delta, onSelect }: { entry: BodyWeightDto; delta: number | null; onSelect: () => void }) {
  const { mutate } = useSWRConfig();
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
      return;
    }
    try {
      await deleteBodyWeight(entry.date);
      await mutate(KEY);
      toast.success("Entry removed");
    } catch {
      toast.error("Couldn't delete that entry.");
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
      <button onClick={onSelect} className="flex flex-1 items-center justify-between pr-3 text-left">
        <span className="text-sm text-muted-foreground">{formatDisplayDate(entry.date)}</span>
        <span className="flex items-center gap-3 text-sm">
          {delta !== null && <Delta delta={delta} />}
          <span className="font-semibold tabular-nums">{entry.weight.toFixed(1)} kg</span>
        </span>
      </button>
      <button
        onClick={handleDelete}
        aria-label={confirming ? "Confirm delete entry" : "Delete entry"}
        className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium ${
          confirming ? "bg-destructive text-destructive-foreground" : "text-muted-foreground"
        }`}
      >
        {confirming ? "Confirm?" : <Trash2 className="size-4" />}
      </button>
    </div>
  );
}

export default function WeightPage() {
  const { data, isLoading } = useSWR<BodyWeightDto[]>(KEY, jsonFetcher);
  const { mutate } = useSWRConfig();
  const [date, setDate] = useState(todayKey);
  const [override, setOverride] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const entries = data ?? [];
  const existing = entries.find((e) => e.date === date);
  const latest = entries[entries.length - 1];
  // The wheel starts on this date's saved weight, else your latest weight.
  const value = override ?? existing?.weight ?? latest?.weight ?? DEFAULT_WEIGHT;

  const previous = entries[entries.length - 2];
  const lastChange = latest && previous ? latest.weight - previous.weight : null;
  const totalChange = latest && entries.length > 1 ? latest.weight - entries[0].weight : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBodyWeight({ date, weight: value });
      await mutate(KEY);
      setOverride(null);
      toast.success(existing ? "Weight updated" : "Weight logged");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SubPageHeader title="Body weight" />
      <div className="space-y-5 px-4 py-5">
        {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-muted" />}

        {!isLoading && (
          <>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-xs text-muted-foreground">Current weight</p>
              <p className="text-3xl font-bold tabular-nums">{latest ? `${latest.weight.toFixed(1)} kg` : "No entries yet"}</p>
              {lastChange !== null && totalChange !== null && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-muted-foreground">Last: <Delta delta={lastChange} /></span>
                  <span className="text-muted-foreground">Overall: <Delta delta={totalChange} /></span>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{existing ? "Update weight" : "Log weight"}</p>
                <Input
                  type="date"
                  value={date}
                  max={todayKey()}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setDate(e.target.value);
                    setOverride(null);
                  }}
                  className="h-9 w-auto rounded-lg text-sm"
                />
              </div>
              <div className="relative" style={{ height: WHEEL_HEIGHT }}>
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 rounded-xl bg-secondary"
                  style={{ height: 40, transform: "translateY(-50%)" }}
                />
                <div className="relative">
                  <WheelPicker value={value} onChange={setOverride} min={30} max={200} step={0.1} decimals={1} suffix="kg" />
                </div>
              </div>
              <Button size="lg" className="h-12 w-full rounded-xl text-base" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {existing ? "Update" : "Log weight"}
              </Button>
            </div>

            {entries.length > 1 && (
              <div className="rounded-2xl border border-border/60 bg-card p-3">
                <WeightChart data={entries} />
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">History</p>
                {[...entries].reverse().map((entry, i, arr) => {
                  const older = arr[i + 1];
                  return (
                    <HistoryRow
                      key={entry.date}
                      entry={entry}
                      delta={older ? entry.weight - older.weight : null}
                      onSelect={() => {
                        setDate(entry.date);
                        setOverride(null);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
