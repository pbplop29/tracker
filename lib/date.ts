export function todayKey(): string {
  return toDateKey(new Date());
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, delta: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function formatDisplayDate(key: string): string {
  const date = fromDateKey(key);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function isToday(key: string): boolean {
  return key === todayKey();
}
