
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
  Unlock,
  StickyNote,
  FileSearch,
  Copyright,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const { isAdmin } = useAdmin();

  const primaryNav = [
    { label: 'Painel de Controle', href: '/', icon: LayoutDashboard },
    { label: 'Processos Judiciais', href: '/cases', icon: Briefcase },
    { label: 'Contas & Clientes', href: '/clients', icon: Users },
  ];

  const omniNav = [
    { label: 'Auditoria 3D', href: '/veredito', icon: FileSearch },
    { label: 'Consultoria de Gabinete', href: '/chat', icon: MessageSquare },
    { label: 'Importação de Dados', href: '/import', icon: Upload },
    { label: 'Evidências & Notas', href: '/notes', icon: StickyNote },
  ];

  const adminNav = [
    { label: 'Indicadores Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Motor de Prioridade', href: '/urgency', icon: ShieldAlert },
    { label: 'Configuração Sistema', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "h-screen bg-white flex flex-col transition-all duration-200 border-r border-[#dddbda] shrink-0 print:hidden z-50",
      collapsed ? "w-[70px]" : "w-64"
    )}>
      <div className="h-14 flex items-center px-5 border-b border-[#dddbda] bg-[#f8f9fb]">
        <div className="flex items-center gap-4">
          <div className="icon-3d-wrapper">
            <div className="icon-3d-block black w-8 h-8 rounded-sm">
              <Scale size={16} className="text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-black text-sm text-black tracking-tight uppercase">LexisPredict</span>
              <span className="text-[9px] text-black/60 font-black tracking-widest uppercase italic">Elite Edition</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <section>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Gestão</p>}
          <div className="space-y-1">
            {primaryNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={collapsed} active={pathname === item.href} />
            ))}
          </div>
        </section>

        <section>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Auditoria</p>}
          <div className="space-y-1">
            {omniNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={collapsed} active={pathname === item.href} />
            ))}
          </div>
        </section>

        <section>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Administração</p>}
          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={collapsed} active={pathname === item.href} />
            ))}
          </div>
        </section>
      </div>

      <div className="p-2 border-t border-[#dddbda] bg-[#f8f9fb]">
        <div className={cn(
          "flex items-center p-2 rounded-md transition-all group",
          !collapsed ? "gap-3 bg-white border border-black shadow-sm hover:bg-black hover:text-white" : "justify-center"
        )}>
          <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
            DA
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-black group-hover:text-white transition-colors truncate uppercase">Davi Alves Figueredo</span>
              <span className="text-[9px] text-black/60 group-hover:text-white/60 transition-colors font-black uppercase truncate italic">Fundador & Gestor</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          {!collapsed && (
            <span className="text-[9px] font-black text-black uppercase flex items-center gap-1 group cursor-default">
              {isAdmin ? <Unlock size={10} className="text-green-600" /> : <Lock size={10} />}
              <span className="group-hover:bg-black group-hover:text-white px-1 transition-all rounded-sm">{isAdmin ? "Admin Root" : "Visitante"}</span>
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6 text-black/40 hover:bg-black hover:text-white transition-all"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </Button>
        </div>

        {!collapsed && (
          <div className="mt-4 pb-2 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity group cursor-default">
              <Copyright size={8} className="text-black group-hover:text-black" />
              <span className="text-[7px] uppercase font-black text-black tracking-widest">© 2026 W1 CAPITAL</span>
            </div>
            <p className="text-[6px] text-black/60 font-black uppercase tracking-tighter italic">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({ item, collapsed, active }: { item: any, collapsed: boolean, active: boolean }) {
  return (
    <Link 
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 group relative",
        active 
          ? "bg-black text-white" 
          : "text-black hover:bg-black hover:text-white"
      )}
    >
      <div className="icon-3d-wrapper shrink-0 scale-75">
        <div className={cn("icon-3d-block w-8 h-8 rounded-sm", active ? "bg-white" : "group-hover:bg-white")}>
          <item.icon className={cn("w-4 h-4", active ? "text-black" : "text-black group-hover:text-black")} />
        </div>
      </div>
      {!collapsed && <span className="font-black text-[13px] tracking-tight truncate uppercase transition-colors">{item.label}</span>}
    </Link>
  );
}
