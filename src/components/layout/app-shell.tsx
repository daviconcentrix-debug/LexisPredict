"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 h-screen overflow-hidden glass-panel",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
