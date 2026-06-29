
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  MessageSquare,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const { profile, signOut } = useAuth();
  const [opacity, setOpacity] = useState(1);

  const isAdmin = profile?.cargo === 'Administrador';

  useEffect(() => {
    const applyAppearance = () => {
      if (typeof window === 'undefined') return;

      const mode = localStorage.getItem('lexis_wp_mode') || 'global';
      const mainUrl = localStorage.getItem('lexis_wp_main_url');
      const sidebarUrl = localStorage.getItem('lexis_wp_sidebar_url');
      const mainType = localStorage.getItem('lexis_wp_main_type') || 'image';
      const sidebarTypeStored = localStorage.getItem('lexis_wp_sidebar_type') || 'image';
      const opacityStored = parseFloat(localStorage.getItem('lexis_wp_opacity') || '1');
      const bgColor = localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2';

      setOpacity(opacityStored);

      const mainElement = document.querySelector('main');
      const sidebarElement = document.querySelector('aside');

      // 1. APLICAÇÃO NO CONTEÚDO (MAIN)
      if (mainElement) {
        mainElement.style.backgroundColor = bgColor;
        mainElement.style.position = 'relative';
        
        let bgLayer = mainElement.querySelector('.lexis-bg-layer') as HTMLElement;
        if (!bgLayer) {
          bgLayer = document.createElement('div');
          bgLayer.className = 'lexis-bg-layer';
          bgLayer.style.position = 'absolute';
          bgLayer.style.top = '0';
          bgLayer.style.left = '0';
          bgLayer.style.width = '100%';
          bgLayer.style.height = '100%';
          bgLayer.style.zIndex = '-1';
          bgLayer.style.pointerEvents = 'none';
          bgLayer.style.overflow = 'hidden';
          mainElement.appendChild(bgLayer);
        }

        const activeMainUrl = (mode === 'global' || mode === 'main_only' || mode === 'separate') ? mainUrl : null;
        bgLayer.style.opacity = opacityStored.toString();

        if (activeMainUrl) {
          if (mainType === 'video') {
            const currentVideo = bgLayer.querySelector('video');
            if (!currentVideo || currentVideo.src !== activeMainUrl) {
              bgLayer.innerHTML = `
                <video autoplay muted loop playsinline preload="auto" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                  <source src="${activeMainUrl}">
                </video>
              `;
            }
          } else {
            bgLayer.innerHTML = '';
            bgLayer.style.backgroundImage = `url(${activeMainUrl})`;
            bgLayer.style.backgroundSize = 'cover';
            bgLayer.style.backgroundPosition = 'center';
            bgLayer.style.backgroundAttachment = 'fixed';
          }
        } else {
          bgLayer.innerHTML = '';
          bgLayer.style.backgroundImage = 'none';
        }
      }

      // 2. APLICAÇÃO NA SIDEBAR
      if (sidebarElement) {
        let sideBgLayer = sidebarElement.querySelector('.lexis-side-bg-layer') as HTMLElement;
        if (!sideBgLayer) {
          sideBgLayer = document.createElement('div');
          sideBgLayer.className = 'lexis-side-bg-layer';
          sideBgLayer.style.position = 'absolute';
          sideBgLayer.style.top = '0';
          sideBgLayer.style.left = '0';
          sideBgLayer.style.width = '100%';
          sideBgLayer.style.height = '100%';
          sideBgLayer.style.zIndex = '-1';
          sideBgLayer.style.pointerEvents = 'none';
          sideBgLayer.style.overflow = 'hidden';
          sidebarElement.style.position = 'relative';
          sidebarElement.prepend(sideBgLayer);
        }

        const activeSidebarUrl = (mode === 'global') ? mainUrl : (mode === 'sidebar_only' || mode === 'separate') ? sidebarUrl : null;
        sideBgLayer.style.opacity = opacityStored.toString();

        if (activeSidebarUrl) {
          const activeSideType = mode === 'global' ? mainType : sidebarTypeStored;
          sidebarElement.style.backgroundColor = 'transparent';

          if (activeSideType === 'video') {
            const currentSideVideo = sideBgLayer.querySelector('video');
            if (!currentSideVideo || currentSideVideo.src !== activeSidebarUrl) {
              sideBgLayer.innerHTML = `
                <video autoplay muted loop playsinline preload="auto" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
                  <source src="${activeSidebarUrl}">
                </video>
              `;
            }
          } else {
            sideBgLayer.innerHTML = '';
            sideBgLayer.style.backgroundImage = `url(${activeSidebarUrl})`;
            sideBgLayer.style.backgroundSize = 'cover';
            sideBgLayer.style.backgroundPosition = 'center';
          }
        } else {
          sideBgLayer.innerHTML = '';
          sideBgLayer.style.backgroundImage = 'none';
          sidebarElement.style.backgroundColor = 'white';
        }
      }
    };

    applyAppearance();
    window.addEventListener('storage', applyAppearance);
    const interval = setInterval(applyAppearance, 2000);
    return () => {
      window.removeEventListener('storage', applyAppearance);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    document.cookie = "lexis_master_unlock=; path=/; max-age=0";
    document.cookie = "lexis_master_email=; path=/; max-age=0";
    await signOut();
    router.push('/login');
  };

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
      "h-screen bg-white/90 backdrop-blur-sm flex flex-col transition-all duration-200 border-r border-[#dddbda] shrink-0 print:hidden z-50 overflow-hidden",
      collapsed ? "w-[70px]" : "w-64"
    )}>
      <div className="h-14 flex items-center px-5 border-b border-[#dddbda] bg-[#f8f9fb]/50">
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

      <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10">
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

      <div className="p-2 border-t border-[#dddbda] bg-[#f8f9fb]/50 space-y-2 relative z-10">
        <div className={cn(
          "flex items-center p-2 rounded-sm transition-all group",
          !collapsed ? "gap-3 bg-white border border-black shadow-sm hover:bg-black hover:text-white" : "justify-center"
        )}>
          <div className="w-8 h-8 rounded-sm bg-black text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white group-hover:text-black transition-colors border border-black">
            {profile?.nome?.substring(0, 2).toUpperCase() || '??'}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-black group-hover:text-white transition-colors truncate uppercase">{profile?.nome || 'Usuário Gabinete'}</span>
              <span className="text-[9px] text-black/60 transition-colors font-black uppercase truncate italic">{profile?.cargo || 'Operador'}</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-[10px] font-black text-black uppercase h-8 hover:bg-black hover:text-white transition-all rounded-sm border border-transparent hover:border-black"
          >
            <LogOut size={14} className="mr-2" /> Encerrar Sessão
          </Button>
        )}

        <div className="flex items-center justify-between px-2">
          {!collapsed && (
            <span className="text-[9px] font-black text-black uppercase flex items-center gap-1 group cursor-default">
              {isAdmin ? <Unlock size={10} className="text-green-600" /> : <Lock size={10} />}
              <span className="group-hover:bg-black group-hover:text-white px-1 transition-all rounded-sm">{isAdmin ? "Gabinete Admin" : "Operador Ativo"}</span>
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
        "flex items-center gap-3 px-3 py-2 rounded-sm transition-all duration-200 group relative border-2 border-transparent",
        active 
          ? "bg-black text-white border-black shadow-md" 
          : "text-black hover:bg-black hover:text-white hover:border-black"
      )}
    >
      <div className="icon-3d-wrapper shrink-0 scale-75">
        <div className={cn("icon-3d-block w-8 h-8 rounded-sm", active ? "bg-white" : "group-hover:bg-white")}>
          <item.icon className={cn("w-4 h-4", active ? "text-black" : "text-black group-hover:text-black")} />
        </div>
      </div>
      {!collapsed && <span className="font-black text-[12px] tracking-tight truncate uppercase transition-colors">{item.label}</span>}
    </Link>
  );
}
