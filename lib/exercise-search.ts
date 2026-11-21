// Client-side autofill matching. The user's full exercise list is loaded once, then filtered here.
//
// Two ways to find "Dumbbell Machine Overhead Press":
//   words:    "machine overhead" (any order, each word may be just the start of a word: "mach over")
//   initials: "dmop", or "mop" (the first letters of consecutive words)
// Results are ranked: starts-with, then word starts, then anywhere inside, then initials.

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function rank(name: string, query: string): number | null {
  const lower = name.toLowerCase();
  const nameWords = words(name);
  const tokens = query.split(/\s+/);

  if (lower.startsWith(query)) return 0;
  if (tokens.every((t) => nameWords.some((w) => w.startsWith(t)))) return 1;
  if (tokens.every((t) => lower.includes(t))) return 2;

  const compact = query.replace(/[^a-z0-9]/g, "");
  const initials = nameWords.map((w) => w[0]).join("");
  if (compact.length >= 2 && initials.includes(compact)) return 3;
  return null;
}

export function searchExercises<T extends { name: string }>(items: T[], rawQuery: string, limit = 8): T[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return []; // nothing is suggested until at least one character is typed

  const ranked: { item: T; rank: number }[] = [];
  for (const item of items) {
    const r = rank(item.name, query);
    if (r !== null) ranked.push({ item, rank: r });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name));
  return ranked.slice(0, limit).map((r) => r.item);
}
