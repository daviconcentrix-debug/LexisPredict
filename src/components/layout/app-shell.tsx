"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Shell Universal LexisPredict (v1.0)
 * Fornece a estrutura base com Sidebar e container transparente para todas as páginas internas.
 */

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
          "flex-1 flex flex-col min-w-0 h-screen overflow-hidden glass-panel relative z-10",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
