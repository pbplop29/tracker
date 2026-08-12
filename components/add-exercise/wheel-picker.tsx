"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
export const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  suffix?: string;
}

export function WheelPicker({ value, onChange, min, max, step, decimals = 0, suffix }: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(decimals));
  }, [min, max, step, decimals]);

  const indexForValue = useCallback(
    (v: number) => Math.min(Math.max(Math.round((v - min) / step), 0), items.length - 1),
    [min, step, items.length]
  );

  // Keep the wheel's scroll position in sync when `value` changes from outside
  // (previous-workout seeding, editing an existing set, switching sets).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const targetTop = indexForValue(value) * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - targetTop) > 1) {
      isProgrammaticScroll.current = true;
      el.scrollTo({ top: targetTop, behavior: "auto" });
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
    }
  }, [value, indexForValue]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.min(Math.max(Math.round(el.scrollTop / ITEM_HEIGHT), 0), items.length - 1);
      isProgrammaticScroll.current = true;
      el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
      requestAnimationFrame(() => {
        isProgrammaticScroll.current = false;
      });
      const newValue = items[idx];
      if (newValue !== value) onChange(newValue);
    }, 100);
  }, [items, value, onChange]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="no-scrollbar snap-y snap-mandatory overflow-y-scroll overscroll-contain"
      style={{
        height: WHEEL_HEIGHT,
        paddingTop: ITEM_HEIGHT,
        paddingBottom: ITEM_HEIGHT,
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
      }}
    >
      {items.map((item) => (
        <div
          key={item}
          className="flex snap-center items-center justify-center gap-1 text-lg font-medium tabular-nums"
          style={{ height: ITEM_HEIGHT }}
        >
          {decimals ? item.toFixed(decimals) : item}
          {suffix && <span className="text-xs font-normal text-muted-foreground">{suffix}</span>}
        </div>
      ))}
    </div>
  );
}
