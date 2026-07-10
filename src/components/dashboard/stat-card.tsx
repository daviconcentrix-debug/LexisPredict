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
  const accentColors = {
    primary: "text-primary border-t-primary/30",
    accent: "text-primary border-t-primary/30",
    destructive: "text-destructive border-t-destructive/30",
    success: "text-green-500 border-t-green-500/30",
  };

  return (
    <div className={cn(
      "bg-card border border-border/50 p-6 rounded-md relative overflow-hidden transition-all duration-300 hover:border-border group cursor-default",
      accentColors[color]
    )}>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.15em]">{title}</p>
          <div className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {icon}
          </div>
        </div>
        
        <div>
          <h3 className="text-3xl font-bold tracking-tight tnum">
            {value}
          </h3>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-2 text-[10px] font-medium mt-3 uppercase tracking-wider",
              trendUp ? "text-green-500" : "text-destructive"
            )}>
              <span className="px-1.5 py-0.5 bg-secondary/50 rounded-sm">
                {trendUp ? "↑" : "↓"} {trend}
              </span>
              <span className="text-muted-foreground opacity-50">vs last interval</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Precision Detail Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-10 group-hover:opacity-30 transition-opacity"></div>
    </div>
  );
}
