
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
  PanelLeft,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const { isAdmin } = useAdmin();

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
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg text-white leading-none">LexisPredict</span>
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Procedural Intelligence</span>
            </div>
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

      <div className="p-4 border-t border-border space-y-3">
        {!collapsed && (
          <div className={cn(
            "flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-tighter",
            isAdmin ? "border-primary/30 bg-primary/5 text-primary" : "border-muted bg-muted/5 text-muted-foreground"
          )}>
            <span className="flex items-center gap-1.5">
              {isAdmin ? <Unlock size={10} /> : <Lock size={10} />}
              {isAdmin ? "Admin Active" : "Visitor Mode"}
            </span>
            {!isAdmin && <Link href="/settings" className="hover:underline text-[9px]">Unlock</Link>}
          </div>
        )}
        
        {!collapsed ? (
          <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white shrink-0">DA</div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">Davi Alves</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Análise Jurídica</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white mx-auto">DA</div>
        )}
      </div>
    </aside>
  );
}
