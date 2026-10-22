import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(), // stored lowercase
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    totpSecret: text("totp_secret").notNull(), // AES-GCM encrypted, base64
    enrolledAt: text("enrolled_at"), // null until the first valid code is confirmed
    lastTotpStep: integer("last_totp_step").notNull().default(0), // blocks code reuse
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: integer("locked_until"), // epoch ms
    inviteTokenHash: text("invite_token_hash"),
    inviteExpiresAt: integer("invite_expires_at"), // epoch ms
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const recoveryCodes = sqliteTable(
  "recovery_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: text("used_at"),
  },
  (table) => [index("recovery_codes_user_idx").on(table.userId)]
);

// user_id is nullable only so existing rows can be backfilled to the admin; the app always sets it.
const userRef = () => text("user_id").references(() => users.id, { onDelete: "cascade" });

export const workoutDays = sqliteTable(
  "workout_days",
  {
    id: text("id").primaryKey(),
    userId: userRef(),
    date: text("date").notNull(), // YYYY-MM-DD, local calendar day
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("workout_days_user_date_idx").on(table.userId, table.date)]
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    userId: userRef(),
    name: text("name").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("exercises_user_name_idx").on(table.userId, table.name)]
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

// One body-weight reading per calendar day (kg); logging the same day again overwrites it.
export const bodyWeights = sqliteTable(
  "body_weights",
  {
    id: text("id").primaryKey(),
    userId: userRef(),
    date: text("date").notNull(),
    weight: real("weight").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex("body_weights_user_date_idx").on(table.userId, table.date)]
);

export type User = typeof users.$inferSelect;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
