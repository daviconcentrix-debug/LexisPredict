/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  LogOut,
  MessageCircle,
  Menu,
  FileText,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Repeat,
  Bot,
  Zap,
  FileSignature,
  FileStack,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
      ],
    },
    {
      title: t.operations,
      items: [
        { label: 'Consultoria IA', href: '/chat-ia', icon: Bot },
        { label: t.audit, href: '/veredito', icon: FileSearch },
        { label: 'Procuração', href: '/documents', icon: FileText },
        { label: 'Habilitação', href: '/habilitacao-peca', icon: FileSignature },
        { label: 'Substabelecimento', href: '/substabelecimento', icon: Repeat },
        { label: 'Peça de Subst.', href: '/substabelecimento-peca', icon: FileStack },
        { label: t.whatsapp, href: '/whatsapp', icon: MessageCircle },
        { label: t.import, href: '/import', icon: Upload },
        { label: t.notes, href: '/notes', icon: StickyNote },
        { label: 'Motor de OCR', href: '/tools/ocr', icon: Zap },
      ],
    },
    {
      title: t.system,
      items: [
        { label: t.analytics, href: '/analytics', icon: BarChart3 },
        { label: t.urgency, href: '/urgency', icon: ShieldAlert },
        { label: t.settings, href: '/settings', icon: Settings },
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-border/50">
      {/* === CABEÇALHO COM LOGO === */}
      <div className="h-20 flex items-center px-4 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center shadow-xl shrink-0 overflow-hidden border border-black/10">
            <Image
              src="/logo.png"
              alt="LexisPredict"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs tracking-tight uppercase text-foreground leading-none truncate">
                LexisPredict
              </span>
              <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">
                Enterprise Elite
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 mb-3 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  pathname === item.href
                    ? 'bg-black text-white shadow-lg'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    pathname === item.href ? 'text-primary' : 'opacity-60'
                  )}
                />
                {!collapsed && (
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/30 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fb] border border-border/30 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-primary font-black text-xs border border-primary/20">
              {profile?.nome?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black uppercase truncate text-foreground leading-tight">
                {profile?.nome || 'User'}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">
                {profile?.cargo || 'Operator'}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          >
            <LogOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-5 left-5 z-[100]">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="premium-card h-12 w-12 border-none">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-80">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Access LexisPredict Operations</SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
      <aside
        className={cn(
          'hidden lg:flex h-screen flex-col transition-all duration-500 z-50 shrink-0',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
