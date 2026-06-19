import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'accent' | 'destructive' | 'success';
}

export function StatCard({ title, value, icon, trend, trendUp, color = 'primary' }: StatCardProps) {
  const colorMap = {
    primary: "from-primary/20 to-transparent text-primary border-primary/20",
    accent: "from-accent/20 to-transparent text-accent border-accent/20",
    destructive: "from-destructive/20 to-transparent text-destructive border-destructive/20",
    success: "from-chart-3/20 to-transparent text-chart-3 border-chart-3/20",
  };

  return (
    <div className={cn(
      "bg-card border border-border p-6 rounded-2xl relative overflow-hidden group transition-all hover:border-primary/50",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      colorMap[color]
    )}>
      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-headline font-bold text-white">{value}</h3>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full w-fit",
              trendUp ? "bg-chart-3/10 text-chart-3" : "bg-destructive/10 text-destructive"
            )}>
              {trend}
            </div>
          )}
        </div>
        <div className="p-3 bg-secondary rounded-xl text-foreground/80 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}