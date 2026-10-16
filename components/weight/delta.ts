// Losing weight is green, gaining is red, unchanged is neutral.
export function deltaColor(delta: number) {
  if (delta < 0) return "var(--color-chart-1)";
  if (delta > 0) return "var(--color-destructive)";
  return "var(--color-muted-foreground)";
}

export function formatDelta(delta: number) {
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)} kg`;
}
