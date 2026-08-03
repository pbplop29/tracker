"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddExerciseSheet } from "@/components/add-exercise/add-exercise-sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showDateTopBar = pathname === "/";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      {showDateTopBar && <TopBar />}
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
      <AddExerciseSheet />
    </div>
  );
}
