
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
  const borderMap = {
    primary: "border-l-black",
    accent: "border-l-black",
    destructive: "border-l-red-600",
    success: "border-l-green-600",
  };

  const iconTextMap = {
    primary: "text-black",
    accent: "text-black",
    destructive: "text-red-600",
    success: "text-green-600",
  };

  return (
    <div className={cn(
      "bg-white border border-[#dddbda] border-l-4 p-5 rounded-sm relative overflow-hidden transition-all hover:shadow-lg hover:bg-black group cursor-default",
      borderMap[color]
    )}>
      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <p className="text-black/60 text-[10px] font-black uppercase tracking-[0.1em] group-hover:text-white/60 transition-colors">{title}</p>
          <div className="icon-3d-wrapper">
             <div className="icon-3d-block w-8 h-8 rounded-sm group-hover:bg-white transition-colors border-none shadow-sm">
                <div className={cn("transition-colors", iconTextMap[color], "group-hover:text-black")}>
                  {icon}
                </div>
             </div>
          </div>
        </div>
        <h3 className="text-2xl font-black text-black tracking-tighter mt-1 group-hover:text-white transition-colors uppercase">{value}</h3>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[9px] font-black mt-2 uppercase tracking-tighter transition-colors",
            trendUp ? "text-green-600 group-hover:text-green-400" : "text-red-600 group-hover:text-red-400"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </div>
        )}
      </div>
    </div>
  );
}
