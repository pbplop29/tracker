// One-time setup: creates the admin account and assigns ALL existing data to it.
// Usage: npm run auth:bootstrap -- "Full Name" you@example.com
// Set APP_URL to print a join link for a deployed site (default http://localhost:3000).
import "dotenv/config";
import { isNull } from "drizzle-orm";
import { db } from "./index";
import { users, workoutDays, exercises, bodyWeights } from "./schema";
import { issueInvite } from "../lib/auth/invite";

async function main() {
  const [name, email] = process.argv.slice(2);
  if (!name || !email) throw new Error('Usage: npm run auth:bootstrap -- "Full Name" you@example.com');

  const existing = await db.select().from(users);
  if (existing.some((u) => u.enrolledAt)) throw new Error("An account is already set up. Use the invite page instead.");

  const { userId, token } = await issueInvite({ name, email, isAdmin: true });

  // Atomic: either all existing rows get an owner or none do.
  const [days, exs, weights] = await db.batch([
    db.update(workoutDays).set({ userId }).where(isNull(workoutDays.userId)),
    db.update(exercises).set({ userId }).where(isNull(exercises.userId)),
    db.update(bodyWeights).set({ userId }).where(isNull(bodyWeights.userId)),
  ]);
  console.log(`Assigned to ${name}: ${days.rowsAffected} workout days, ${exs.rowsAffected} exercises, ${weights.rowsAffected} weight entries.`);

  const base = process.env.APP_URL ?? "http://localhost:3000";
  console.log(`\nOpen this link to set up your authenticator (valid 7 days):\n${base}/join?token=${token}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
