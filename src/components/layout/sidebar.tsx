"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Upload, 
  BarChart3, 
  ShieldAlert, 
  Settings, 
  Scale, 
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  const navItems = [
    { label: 'Intelligence Unit', href: '/', icon: LayoutDashboard },
    { label: 'Case Management', href: '/cases', icon: Briefcase },
    { label: 'Client Directory', href: '/clients', icon: Users },
    { label: 'Migration Tool', href: '/import', icon: Upload },
    { label: 'Analytics Hub', href: '/analytics', icon: BarChart3 },
    { label: 'Urgency Engine', href: '/urgency', icon: ShieldAlert },
    { label: 'System Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "h-screen bg-sidebar flex flex-col transition-all duration-300 border-r border-border shrink-0",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Scale className="text-primary w-6 h-6" />
            <span className="font-headline font-bold text-lg text-white">LexisPredict</span>
          </div>
        )}
        {collapsed && <Scale className="text-primary w-6 h-6 mx-auto" />}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-white"
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </Button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">JD</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">John Doe</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Senior Attorney</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white mx-auto">JD</div>
        )}
      </div>
    </aside>
  );
}
