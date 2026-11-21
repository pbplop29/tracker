import type { OverviewDto, ProgressItem } from "./types";

export interface SetRow {
  exerciseId: string;
  name: string;
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number;
}

const TOP = 3;
const MIN_SESSIONS_LEAST = 2; // one-off tries and typos shouldn't rank as "least trained"
const MIN_SESSIONS_PROGRESS = 3;
const MIN_SPAN_DAYS = 14; // progress needs at least two weeks between first and latest session
const MONTH_DAYS = 30;

const dayNumber = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from);
const round1 = (n: number) => Math.round(n * 10) / 10;

interface ExerciseStats {
  name: string;
  sessions: Map<string, SetRow[]>; // one entry per day the exercise was logged
  totalSets: number;
}

/** Estimated one-rep max (Epley): makes 85 kg x 8 and 80 kg x 10 comparable. */
const oneRepMax = (weight: number, reps: number) => weight * (1 + reps / 30);

function progressFor(stats: ExerciseStats): ProgressItem | null {
  const all = [...stats.sessions.values()].flat();
  const repsMode = all.every((s) => s.weight === 0); // bodyweight-only exercise: progress is reps

  const scores = [...stats.sessions.entries()]
    .map(([date, sets]) => {
      const usable = repsMode ? sets : sets.filter((s) => s.weight > 0);
      if (usable.length === 0) return null;
      const score = repsMode ? Math.max(...usable.map((s) => s.reps)) : Math.max(...usable.map((s) => oneRepMax(s.weight, s.reps)));
      return { date, score };
    })
    .filter((x): x is { date: string; score: number } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (scores.length < MIN_SESSIONS_PROGRESS) return null;
  const first = scores[0];
  const last = scores[scores.length - 1];
  if (daysBetween(first.date, last.date) < MIN_SPAN_DAYS || first.score <= 0) return null;

  return {
    name: stats.name,
    changePct: round1(((last.score - first.score) / first.score) * 100),
    from: round1(first.score),
    to: round1(last.score),
    unit: repsMode ? "reps" : "kg",
  };
}

/** Everything on the Progress > Overall tab, computed from all of a user's logged sets. `today` is the user's local date. */
export function computeOverview(rows: SetRow[], today: string): OverviewDto {
  const byExercise = new Map<string, ExerciseStats>();
  for (const row of rows) {
    let stats = byExercise.get(row.exerciseId);
    if (!stats) byExercise.set(row.exerciseId, (stats = { name: row.name, sessions: new Map(), totalSets: 0 }));
    const day = stats.sessions.get(row.date);
    if (day) day.push(row);
    else stats.sessions.set(row.date, [row]);
    stats.totalSets++;
  }
  const exercises = [...byExercise.values()];
  const lastDone = (s: ExerciseStats) => [...s.sessions.keys()].sort().at(-1)!;

  // Most / least trained, by number of days the exercise was logged.
  const mostRanked = [...exercises].sort((a, b) => b.sessions.size - a.sessions.size || b.totalSets - a.totalSets || a.name.localeCompare(b.name));
  const mostTrained = mostRanked.slice(0, TOP);
  const leastTrained = exercises
    .filter((s) => s.sessions.size >= MIN_SESSIONS_LEAST && !mostTrained.includes(s))
    .sort((a, b) => a.sessions.size - b.sessions.size || lastDone(a).localeCompare(lastDone(b)) || a.name.localeCompare(b.name))
    .slice(0, TOP);

  // Biggest gains / least progress, by change in estimated strength (reps for bodyweight exercises).
  const progress = exercises.map(progressFor).filter((p): p is ProgressItem => p !== null);
  const biggestGains = progress
    .filter((p) => p.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct || a.name.localeCompare(b.name))
    .slice(0, TOP);
  const leastProgress = progress
    .filter((p) => !biggestGains.includes(p))
    .sort((a, b) => a.changePct - b.changePct || a.name.localeCompare(b.name))
    .slice(0, TOP);

  // Heaviest weight and most reps in a single set, per exercise.
  const best = (sets: SetRow[], better: (a: SetRow, b: SetRow) => number) => [...sets].sort(better)[0];
  const heaviest = exercises
    .map((s) => {
      const sets = [...s.sessions.values()].flat().filter((x) => x.weight > 0);
      return sets.length ? { ...best(sets, (a, b) => b.weight - a.weight || b.reps - a.reps || a.date.localeCompare(b.date)), name: s.name } : null;
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))
    .slice(0, TOP)
    .map((x) => ({ name: x.name, weight: x.weight, reps: x.reps, date: x.date }));
  const mostReps = exercises
    .map((s) => ({ ...best([...s.sessions.values()].flat(), (a, b) => b.reps - a.reps || b.weight - a.weight || a.date.localeCompare(b.date)), name: s.name }))
    .sort((a, b) => b.reps - a.reps || a.name.localeCompare(b.name))
    .slice(0, TOP)
    .map((x) => ({ name: x.name, reps: x.reps, weight: x.weight, date: x.date }));

  // Average trained days per 30-day month: trained days / calendar days since the first workout.
  // (Averaging calendar months would let the partly-complete first and current months skew it.)
  const trainedDates = [...new Set(rows.map((r) => r.date))].sort();
  let daysPerMonth: OverviewDto["daysPerMonth"] = null;
  if (trainedDates.length > 0) {
    const span = Math.max(daysBetween(trainedDates[0], today), 0) + 1;
    if (span >= MIN_SPAN_DAYS) {
      daysPerMonth = { average: round1((trainedDates.length / span) * MONTH_DAYS), of: MONTH_DAYS, trainedDays: trainedDates.length, since: trainedDates[0] };
    }
  }

  return {
    daysPerMonth,
    mostTrained: mostTrained.map((s) => ({ name: s.name, sessions: s.sessions.size })),
    leastTrained: leastTrained.map((s) => ({ name: s.name, sessions: s.sessions.size })),
    biggestGains,
    leastProgress,
    heaviest,
    mostReps,
  };
}
