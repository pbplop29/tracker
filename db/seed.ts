import "dotenv/config";
import { db } from "./index";
import { workoutDays, exercises, workoutExercises, exerciseSets } from "./schema";
import { newId } from "../lib/id";

type PlannedSet = { weight: number; reps: number };
type PlannedExercise = { name: string; sets: PlannedSet[] };

// A simple push/pull/legs split repeated over the last several weeks,
// with light progressive overload week over week and a couple of rest-day gaps
// so the contribution grid looks realistic.
const PUSH = (week: number): PlannedExercise[] => [
  {
    name: "Bench Press",
    sets: [
      { weight: 70 + week * 2.5, reps: 10 },
      { weight: 70 + week * 2.5, reps: 8 },
      { weight: 65 + week * 2.5, reps: 10 },
    ],
  },
  {
    name: "Incline Bench",
    sets: [
      { weight: 50 + week * 2, reps: 10 },
      { weight: 50 + week * 2, reps: 9 },
      { weight: 47.5 + week * 2, reps: 10 },
    ],
  },
  {
    name: "Overhead Press",
    sets: [
      { weight: 40 + week * 1.5, reps: 8 },
      { weight: 40 + week * 1.5, reps: 8 },
      { weight: 37.5 + week * 1.5, reps: 9 },
    ],
  },
];

const PULL = (week: number): PlannedExercise[] => [
  {
    name: "Deadlift",
    sets: [
      { weight: 100 + week * 5, reps: 5 },
      { weight: 100 + week * 5, reps: 5 },
      { weight: 90 + week * 5, reps: 6 },
    ],
  },
  {
    name: "Pull Ups",
    sets: [
      { weight: 0, reps: 10 + Math.min(week, 4) },
      { weight: 0, reps: 9 + Math.min(week, 4) },
      { weight: 0, reps: 8 + Math.min(week, 4) },
    ],
  },
  {
    name: "Barbell Row",
    sets: [
      { weight: 60 + week * 2, reps: 10 },
      { weight: 60 + week * 2, reps: 9 },
      { weight: 55 + week * 2, reps: 10 },
    ],
  },
];

const LEGS = (week: number): PlannedExercise[] => [
  {
    name: "Squat",
    sets: [
      { weight: 90 + week * 3.5, reps: 8 },
      { weight: 90 + week * 3.5, reps: 8 },
      { weight: 85 + week * 3.5, reps: 9 },
      { weight: 80 + week * 3.5, reps: 10 },
    ],
  },
  {
    name: "Romanian Deadlift",
    sets: [
      { weight: 70 + week * 2, reps: 10 },
      { weight: 70 + week * 2, reps: 10 },
      { weight: 65 + week * 2, reps: 10 },
    ],
  },
  {
    name: "Leg Press",
    sets: [
      { weight: 140 + week * 5, reps: 12 },
      { weight: 140 + week * 5, reps: 10 },
      { weight: 130 + week * 5, reps: 12 },
    ],
  },
];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding database...");

  await db.delete(exerciseSets);
  await db.delete(workoutExercises);
  await db.delete(workoutDays);
  await db.delete(exercises);

  const exerciseIdByName = new Map<string, string>();
  async function getExerciseId(name: string): Promise<string> {
    const existing = exerciseIdByName.get(name);
    if (existing) return existing;
    const id = newId();
    await db.insert(exercises).values({ id, name });
    exerciseIdByName.set(name, id);
    return id;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a 6-week training log ending today, push/pull/legs, ~5 sessions/week.
  const schedule: { offsetDays: number; plan: (week: number) => PlannedExercise[] }[] = [];
  const totalDays = 42;
  for (let offset = totalDays; offset >= 0; offset--) {
    const dow = (today.getDay() - offset + 700) % 7; // 0=Sun..6=Sat, stable across offset
    // Train Mon/Tue/Wed/Fri/Sat, rest Sun/Thu
    if (dow === 0 || dow === 4) continue;
    const plan = dow === 1 || dow === 5 ? PUSH : dow === 2 || dow === 6 ? PULL : LEGS;
    schedule.push({ offsetDays: offset, plan });
  }

  let created = 0;
  for (const entry of schedule) {
    const date = new Date(today);
    date.setDate(date.getDate() - entry.offsetDays);
    const dateKey = toDateKey(date);
    const week = Math.floor((totalDays - entry.offsetDays) / 7);
    const plannedExercises = entry.plan(week);

    const workoutDayId = newId();
    await db.insert(workoutDays).values({ id: workoutDayId, date: dateKey });

    for (let i = 0; i < plannedExercises.length; i++) {
      const planned = plannedExercises[i];
      const exerciseId = await getExerciseId(planned.name);
      const workoutExerciseId = newId();
      await db.insert(workoutExercises).values({
        id: workoutExerciseId,
        workoutDayId,
        exerciseId,
        position: i,
      });

      const setRows = planned.sets.map((s, idx) => ({
        id: newId(),
        workoutExerciseId,
        setNumber: idx + 1,
        weight: s.weight,
        reps: s.reps,
      }));
      await db.insert(exerciseSets).values(setRows);
    }
    created++;
  }

  console.log(`Seeded ${created} workout days and ${exerciseIdByName.size} exercises.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
