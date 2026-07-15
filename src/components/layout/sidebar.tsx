"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Upload,
  BarChart3,
  ShieldAlert,
  Settings,
  StickyNote,
  FileSearch,
  MessageSquare,
  LogOut,
  MessageCircle,
  Menu,
  FileText,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getTranslation, Locale } from '@/lib/i18n';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt');
  const { profile, signOut } = useAuth();

  const t = getTranslation(locale);
  const isAdmin = profile?.cargo === 'Administrador';

  useEffect(() => {
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const navGroups = [
    {
      title: t.management,
      items: [
        { label: t.dashboard, href: '/', icon: LayoutDashboard },
        { label: t.cases, href: '/cases', icon: Briefcase },
        { label: t.clients, href: '/clients', icon: Users },
        ...(isAdmin ? [{ label: t.team, href: '/team', icon: UserPlus }] : []),
      ]
    },
    {
      title: t.operations,
      items: [
        { label: t.audit, href: '/veredito', icon: FileSearch },
        { label: t.documents, href: '/documents', icon: FileText },
        { label: t.substabelecimento, href: '/substabelecimento', icon: Repeat },
        // ✅ NOVO ITEM ADICIONADO
        { label: "Habilitação + Procuração", href: '/habilitacao', icon: FileText },
        { label: t.chat, href: '/chat', icon: MessageSquare },
        { label: t.whatsapp, href: '/whatsapp', icon: MessageCircle },
        { label: t.import, href: '/import', icon: Upload },
        { label: t.notes, href: '/notes', icon: StickyNote },
      ]
    },
    {
      title: t.system,
      items: [
        { label: t.analytics, href: '/analytics', icon: BarChart3 },
        { label: t.urgency, href: '/urgency', icon: ShieldAlert },
        { label: t.settings, href: '/settings', icon: Settings },
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-sidebar border-r border-border/50">
      <div className="h-16 flex items-center px-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,209,255,0.3)]">
            <span className="text-black font-bold text-xs">LP</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[11px] tracking-widest uppercase">LexisPredict</span>
              <span className="text-[8px] text-primary font-bold uppercase tracking-[0.2em]">Elite v8.5</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 group relative",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                {pathname === item.href && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-full shadow-[0_0_10px_#00D1FF]" />
                )}
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  pathname === item.href ? "text-primary" : "opacity-60 group-hover:opacity-100"
                )} />
                {!collapsed && (
                  <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/30 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 rounded-sm bg-secondary/30 border border-border/10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] border border-primary/20">
              {profile?.nome?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase truncate text-foreground">{profile?.nome || 'User'}</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{profile?.cargo || 'Operator'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-primary"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-[100]">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-md border-border shadow-lg">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-border w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Access all system operations</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex h-screen flex-col transition-all duration-300 z-50 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
