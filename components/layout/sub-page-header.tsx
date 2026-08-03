"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function SubPageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md safe-top">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <button
          onClick={() => router.push("/")}
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
        >
          <X className="size-5" />
        </button>
      </div>
      {children}
    </header>
  );
}
