"use client";

import { LayoutGrid, LineChart, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/store/workout-store";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const openAddSheet = useWorkoutStore((s) => s.openAddSheet);

  const onGridClick = () => router.push(pathname === "/progress" ? "/" : "/progress");
  const onAnalyticsClick = () => router.push(pathname === "/analytics" ? "/" : "/analytics");
  const onAddClick = () => {
    if (pathname !== "/") router.push("/");
    openAddSheet(null);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-md safe-bottom"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-6 py-2">
        <button
          onClick={onGridClick}
          aria-label="Progress grid"
          aria-current={pathname === "/progress" ? "page" : undefined}
          className={cn(
            "flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-2xl transition-colors active:scale-95",
            pathname === "/progress" ? "text-brand" : "text-muted-foreground"
          )}
        >
          <LayoutGrid className="size-6" />
          <span className="text-[11px] font-medium">Grid</span>
        </button>

        <button
          onClick={onAddClick}
          aria-label="Add exercise"
          className="relative -mt-8 flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition-transform active:scale-90"
        >
          <Plus className="size-8" strokeWidth={2.5} />
        </button>

        <button
          onClick={onAnalyticsClick}
          aria-label="Progress graph"
          aria-current={pathname === "/analytics" ? "page" : undefined}
          className={cn(
            "flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-2xl transition-colors active:scale-95",
            pathname === "/analytics" ? "text-brand" : "text-muted-foreground"
          )}
        >
          <LineChart className="size-6" />
          <span className="text-[11px] font-medium">Progress</span>
        </button>
      </div>
    </nav>
  );
}
