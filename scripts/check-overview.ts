// Runnable check for the Progress > Overall calculations. Run with: npx tsx scripts/check-overview.ts
import assert from "node:assert/strict";
import { computeOverview, type SetRow } from "../lib/overview";

let id = 0;
const ids = new Map<string, string>();
const rows: SetRow[] = [];
/** Log an exercise: each entry is [date, weight, reps]; several entries with the same date are sets of one session. */
function log(name: string, ...entries: [string, number, number][]) {
  if (!ids.has(name)) ids.set(name, `e${++id}`);
  for (const [date, weight, reps] of entries) rows.push({ exerciseId: ids.get(name)!, name, date, weight, reps });
}
const d = (n: number) => `2026-01-${String(n).padStart(2, "0")}`; // d(1) = Jan 1

// A: 5 sessions, B: 4, C: 3, D: 2 (older), E: 2 (newer), F: 1 (once)
for (const day of [1, 8, 15, 22, 29]) log("A", [d(day), 50, 10], [d(day), 50, 10]); // 2 sets/session still counts as 1 session
for (const day of [1, 8, 15, 22]) log("B", [d(day), 50, 10]);
for (const day of [2, 9, 16]) log("C", [d(day), 50, 10], [d(day), 50, 10]); // ties on 3 sessions with others: more total sets wins
for (const day of [3, 10]) log("D", [d(day), 50, 10]);
for (const day of [20, 27]) log("E", [d(day), 50, 10]);
log("F", [d(5), 50, 10]);
// Progress: GAIN +16.7% (60x10 -> 70x10), FLAT 0%, DROP negative, QUICK too short (<14 days), BW bodyweight reps 8 -> 12
log("GAIN", [d(1), 60, 10], [d(8), 62.5, 10], [d(15), 70, 10]);
log("FLAT", [d(1), 60, 10], [d(8), 60, 10], [d(15), 60, 10]);
log("DROP", [d(1), 80, 10], [d(8), 75, 10], [d(15), 70, 10]);
log("QUICK", [d(1), 60, 10], [d(4), 65, 10], [d(7), 70, 10]);
log("BW", [d(1), 0, 8], [d(8), 0, 10], [d(15), 0, 12]);
log("HEAVY", [d(3), 140, 3], [d(3), 140, 5], [d(10), 130, 8]); // heaviest 140 x 5 (more reps wins the tie)

const o = computeOverview(rows, d(31));

// sessions
assert.deepEqual(o.mostTrained.map((x) => `${x.name}:${x.sessions}`), ["A:5", "B:4", "C:3"].map((s) => s), "most trained, same-day sets = 1 session");
const names = (list: { name: string }[]) => list.map((x) => x.name);
assert.ok(!names(o.leastTrained).includes("F"), "once-only exercise is not 'least trained'");
assert.ok(!names(o.leastTrained).some((n) => names(o.mostTrained).includes(n)), "no overlap with most trained");
assert.deepEqual(names(o.leastTrained), ["D", "HEAVY", "E"], "2-session exercises: the one done longest ago first (D and HEAVY tie on date -> name)");

// progress
const gain = o.biggestGains.find((p) => p.name === "GAIN")!;
assert.equal(gain.changePct, 16.7); // 80 -> 93.3
assert.equal(gain.unit, "kg");
const bw = o.biggestGains.find((p) => p.name === "BW")!;
assert.equal(bw.unit, "reps");
assert.equal(bw.changePct, 50);
assert.deepEqual(names(o.biggestGains)[0], "BW", "biggest first");
assert.ok(o.biggestGains.every((p) => p.changePct > 0), "gains are positive only");
assert.ok(![...names(o.biggestGains), ...names(o.leastProgress)].includes("QUICK"), "needs 14+ days between first and latest session");
assert.ok(![...names(o.biggestGains), ...names(o.leastProgress)].includes("D"), "needs 3+ sessions");
assert.equal(o.leastProgress[0].name, "DROP", "worst first");
assert.ok(o.leastProgress[0].changePct < 0);
assert.ok(!o.leastProgress.some((p) => o.biggestGains.includes(p)), "no overlap between gains and least progress");

// single-set records
assert.deepEqual(o.heaviest[0], { name: "HEAVY", weight: 140, reps: 5, date: d(3) });
assert.ok(!names(o.heaviest).includes("BW"), "bodyweight (0 kg) never ranks as heaviest");
assert.equal(o.mostReps[0].reps, 12);
assert.ok(o.mostReps.some((x) => x.name === "BW" || x.name === "A" || x.name === "HEAVY"));

// days per month: 17 distinct trained days over 31 calendar days
const trained = new Set(rows.map((r) => r.date)).size;
assert.equal(o.daysPerMonth?.trainedDays, trained);
assert.equal(o.daysPerMonth?.average, Math.round((trained / 31) * 30 * 10) / 10);
assert.equal(o.daysPerMonth?.of, 30);
assert.equal(computeOverview(rows, d(10)).daysPerMonth, null, "under two weeks of history: no average yet");
assert.equal(computeOverview([], d(10)).mostTrained.length, 0, "empty history is fine");
console.log("overview ok");
