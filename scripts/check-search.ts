// Runnable check for autofill matching. Run with: npx tsx scripts/check-search.ts
import assert from "node:assert/strict";
import { searchExercises } from "../lib/exercise-search";

const items = [
  "Dumbbell Machine Overhead Press",
  "Overhead Press",
  "Bench Press",
  "Incline Bench Press",
  "Barbell Row",
  "Lat Pull Down",
].map((name) => ({ name }));
const find = (q: string) => searchExercises(items, q).map((i) => i.name);

assert.deepEqual(find(""), [], "empty query suggests nothing");
assert.deepEqual(find("   "), [], "blank query suggests nothing");
assert.deepEqual(find("machine overhead"), ["Dumbbell Machine Overhead Press"], "words, in order");
assert.deepEqual(find("overhead machine"), ["Dumbbell Machine Overhead Press"], "words, any order");
assert.deepEqual(find("mach over"), ["Dumbbell Machine Overhead Press"], "word beginnings");
assert.deepEqual(find("dmop"), ["Dumbbell Machine Overhead Press"], "initials, all words");
assert.deepEqual(find("mop"), ["Dumbbell Machine Overhead Press"], "initials, from a later word");
assert.deepEqual(find("bp"), ["Bench Press", "Incline Bench Press"], "initials, two words");
assert.deepEqual(find("ben"), ["Bench Press", "Incline Bench Press"], "starts-with ranks above word-start");
assert.deepEqual(find("ench"), ["Bench Press", "Incline Bench Press"], "anywhere inside");
assert.equal(find("press")[0], "Bench Press", "alphabetical within the same rank");
assert.deepEqual(find("zzz"), [], "no match");
assert.equal(searchExercises(items, "e", 2).length, 2, "respects the limit");
console.log("search ok");
