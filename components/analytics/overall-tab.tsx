"use client";

import useSWR from "swr";
import { CalendarCheck, Dumbbell, Flame, Moon, Repeat, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { jsonFetcher } from "@/lib/api";
import { formatShortDate, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { OverviewDto, ProgressItem } from "@/lib/types";

const num = (n: number) => String(Number(n.toFixed(1)));

function StatCard({ icon: Icon, title, hint, empty, children }: { icon: LucideIcon; title: string; hint: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children.length === 0 ? <p className="py-2 text-sm text-muted-foreground">{empty}</p> : <ol className="space-y-2.5">{children}</ol>}
    </section>
  );
}

function Row({ rank, name, value, sub, tone }: { rank: number; name: string; value: string; sub?: string; tone?: "up" | "down" | "flat" }) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-4 text-center text-sm tabular-nums text-muted-foreground">{rank}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      <span className="text-right">
        <span className={cn("block text-sm font-semibold tabular-nums", tone === "up" && "text-brand", tone === "down" && "text-destructive")}>{value}</span>
        {sub && <span className="block text-xs tabular-nums text-muted-foreground">{sub}</span>}
      </span>
    </li>
  );
}

const progressRow = (p: ProgressItem, i: number) => (
  <Row
    key={p.name}
    rank={i + 1}
    name={p.name}
    value={`${p.changePct > 0 ? "+" : ""}${num(p.changePct)}%`}
    sub={`${num(p.from)} → ${num(p.to)} ${p.unit}`}
    tone={p.changePct > 1 ? "up" : p.changePct < -1 ? "down" : "flat"}
  />
);

export function OverallTab() {
  const { data } = useSWR<OverviewDto>(`/api/analytics/overview?today=${todayKey()}`, jsonFetcher);

  if (!data) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const dpm = data.daysPerMonth;
  return (
    <div className="space-y-3">
      <section className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
          <CalendarCheck className="size-5" />
        </div>
        {dpm ? (
          <div>
            <p className="text-2xl font-bold leading-none tabular-nums">
              {num(dpm.average)} <span className="text-base font-medium text-muted-foreground">out of {dpm.of} days</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              trained per month, on average · {dpm.trainedDays} days since {formatShortDate(dpm.since)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your monthly average appears after two weeks of logging.</p>
        )}
      </section>

      <StatCard icon={Flame} title="Most Trained" hint="Days each exercise was logged" empty="Log some workouts to see this.">
        {data.mostTrained.map((s, i) => <Row key={s.name} rank={i + 1} name={s.name} value={`${s.sessions} days`} />)}
      </StatCard>

      <StatCard icon={Moon} title="Least Trained" hint="Done on 2+ days, but least often" empty="Needs exercises logged on at least 2 days.">
        {data.leastTrained.map((s, i) => <Row key={s.name} rank={i + 1} name={s.name} value={`${s.sessions} days`} />)}
      </StatCard>

      <StatCard icon={TrendingUp} title="Biggest Gains" hint="Strength, first session → latest" empty="Needs an exercise on 3+ days spanning 2+ weeks.">
        {data.biggestGains.map(progressRow)}
      </StatCard>

      <StatCard icon={TrendingDown} title="Least Progress" hint="Slowest progress, or slipping" empty="Appears once more exercises have 3+ days of history.">
        {data.leastProgress.map(progressRow)}
      </StatCard>

      <StatCard icon={Dumbbell} title="Heaviest Lifts" hint="Most weight in a single set" empty="No weighted sets logged yet.">
        {data.heaviest.map((h, i) => <Row key={h.name} rank={i + 1} name={h.name} value={`${num(h.weight)} kg`} sub={`× ${h.reps} · ${formatShortDate(h.date)}`} />)}
      </StatCard>

      <StatCard icon={Repeat} title="Most Reps" hint="Most reps in a single set" empty="Log some workouts to see this.">
        {data.mostReps.map((r, i) => (
          <Row key={r.name} rank={i + 1} name={r.name} value={`${r.reps} reps`} sub={`${r.weight > 0 ? `${num(r.weight)} kg` : "bodyweight"} · ${formatShortDate(r.date)}`} />
        ))}
      </StatCard>
    </div>
  );
}
