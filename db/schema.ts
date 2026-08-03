import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workoutDays = sqliteTable(
  "workout_days",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(), // YYYY-MM-DD, local calendar day
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("workout_days_date_idx").on(table.date)]
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("exercises_name_idx").on(table.name)]
);

export const workoutExercises = sqliteTable(
  "workout_exercises",
  {
    id: text("id").primaryKey(),
    workoutDayId: text("workout_day_id")
      .notNull()
      .references(() => workoutDays.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index("workout_exercises_workout_day_idx").on(table.workoutDayId),
    index("workout_exercises_exercise_idx").on(table.exerciseId),
  ]
);

export const exerciseSets = sqliteTable(
  "exercise_sets",
  {
    id: text("id").primaryKey(),
    workoutExerciseId: text("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    weight: real("weight").notNull(),
    reps: integer("reps").notNull(),
  },
  (table) => [index("exercise_sets_workout_exercise_idx").on(table.workoutExerciseId)]
);

export type WorkoutDay = typeof workoutDays.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
