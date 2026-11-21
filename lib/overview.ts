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
const MIN_SPAN_DAYS = 14; // progress needs at least two weeks of history
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

/**
 * Progress = rate of change of session volume. Volume is weight x reps summed over a day's sets (the same
 * definition as the Volume/Total charts). We fit a straight line through every session and report its slope
 * as a % of the average volume per week, so one fluke session can't swing the result and exercises of
 * different sizes compare fairly. Bodyweight-only exercises (all weights 0) use total reps instead.
 */
function progressFor(stats: ExerciseStats): ProgressItem | null {
  const repsMode = [...stats.sessions.values()].flat().every((s) => s.weight === 0);

  const points = [...stats.sessions.entries()]
    .map(([date, sets]) => ({
      day: dayNumber(date),
      volume: sets.reduce((sum, s) => sum + (repsMode ? s.reps : s.weight * s.reps), 0),
    }))
    .filter((p) => p.volume > 0)
    .sort((a, b) => a.day - b.day);

  if (points.length < MIN_SESSIONS_PROGRESS) return null;
  if (points[points.length - 1].day - points[0].day < MIN_SPAN_DAYS) return null;

  const n = points.length;
  const meanDay = points.reduce((s, p) => s + p.day, 0) / n;
  const meanVolume = points.reduce((s, p) => s + p.volume, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.day - meanDay) * (p.volume - meanVolume);
    sxx += (p.day - meanDay) ** 2;
  }
  const slopePerDay = sxy / sxx; // sxx > 0: at least two distinct days, 14+ apart

  return {
    name: stats.name,
    ratePct: round1(((slopePerDay * 7) / meanVolume) * 100),
    volume: Math.round(meanVolume),
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
  const mostTrained = [...exercises]
    .sort((a, b) => b.sessions.size - a.sessions.size || b.totalSets - a.totalSets || a.name.localeCompare(b.name))
    .slice(0, TOP);
  const leastTrained = exercises
    .filter((s) => s.sessions.size >= MIN_SESSIONS_LEAST && !mostTrained.includes(s))
    .sort((a, b) => a.sessions.size - b.sessions.size || lastDone(a).localeCompare(lastDone(b)) || a.name.localeCompare(b.name))
    .slice(0, TOP);

  // Most / least progress, by rate of change of volume.
  const progress = exercises.map(progressFor).filter((p): p is ProgressItem => p !== null);
  const mostProgress = progress
    .filter((p) => p.ratePct > 0)
    .sort((a, b) => b.ratePct - a.ratePct || a.name.localeCompare(b.name))
    .slice(0, TOP);
  const leastProgress = progress
    .filter((p) => !mostProgress.includes(p))
    .sort((a, b) => a.ratePct - b.ratePct || a.name.localeCompare(b.name))
    .slice(0, TOP);

  // Average trained days per 30-day month: trained days / calendar days since the first workout.
  // (Averaging calendar months would let the partly-complete first and current months skew it.)
  const trainedDates = [...new Set(rows.map((r) => r.date))].sort();
  let daysPerMonth: OverviewDto["daysPerMonth"] = null;
  if (trainedDates.length > 0) {
    const span = Math.max(daysBetween(trainedDates[0], today), 0) + 1;
    if (span >= MIN_SPAN_DAYS) daysPerMonth = { average: round1((trainedDates.length / span) * MONTH_DAYS), of: MONTH_DAYS };
  }

  return {
    daysPerMonth,
    mostTrained: mostTrained.map((s) => ({ name: s.name, sessions: s.sessions.size })),
    leastTrained: leastTrained.map((s) => ({ name: s.name, sessions: s.sessions.size })),
    mostProgress,
    leastProgress,
  };
}
