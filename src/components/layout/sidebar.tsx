
"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  Scale, 
  PanelLeftClose, 
  PanelLeft,
  Lock,
  Unlock,
  StickyNote,
  FileSearch,
  MessageSquare,
  LogOut,
  MessageCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { browserStorage } from '@/lib/browser-storage';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  
  const isMounted = useRef(true);
  const lastAppliedSettings = useRef<string>('');
  const activeBlobUrls = useRef<{ main?: string; side?: string }>({});

  const isAdmin = profile?.cargo === 'Administrador';

  useEffect(() => {
    isMounted.current = true;
    
    const applyAppearance = async () => {
      if (typeof window === 'undefined' || !isMounted.current) return;

      const settings = {
        mode: localStorage.getItem('lexis_wp_mode') || 'global',
        mainUrl: localStorage.getItem('lexis_wp_main_url'),
        sideUrl: localStorage.getItem('lexis_wp_sidebar_url'),
        mainType: localStorage.getItem('lexis_wp_main_type') || 'image',
        sideType: localStorage.getItem('lexis_wp_sidebar_type') || 'image',
        opacity: localStorage.getItem('lexis_wp_opacity') || '1',
        bgColor: localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2',
        fontColor: localStorage.getItem('lexisPredict_font_color') || '#000000',
        btnBgColor: localStorage.getItem('lexisPredict_btn_bg_color') || '#000000',
        btnTextColor: localStorage.getItem('lexisPredict_btn_text_color') || '#ffffff',
        iconColor: localStorage.getItem('lexisPredict_icon_color') || '#000000',
        borderColor: localStorage.getItem('lexisPredict_border_color') || '#000000',
      };

      const settingsKey = JSON.stringify(settings);
      if (settingsKey === lastAppliedSettings.current) return;
      lastAppliedSettings.current = settingsKey;

      // 1. Injeção Dinâmica de Estilo (Override de Identidade Visual)
      let fontStyle = document.getElementById('lexis-custom-theme') as HTMLStyleElement;
      if (!fontStyle) {
        fontStyle = document.createElement('style');
        fontStyle.id = 'lexis-custom-theme';
        document.head.appendChild(fontStyle);
      }
      
      fontStyle.innerHTML = `
        /* Fontes e Textos */
        body, .text-black, h1, h2, h3, h4, h5, h6, p, span, label, input, textarea, select, .font-black {
          color: ${settings.fontColor} !important;
        }
        .text-muted-foreground {
          color: ${settings.fontColor}99 !important;
        }
        input::placeholder, textarea::placeholder {
          color: ${settings.fontColor}44 !important;
        }

        /* Bordas e Divisores */
        .border-black, .border-2, .border-r, .border-b, .border-t, .border-l, border-collapse, hr {
          border-color: ${settings.borderColor} !important;
        }
        .divide-black\\/5 > * + *, .divide-black\\/10 > * + * {
          border-color: ${settings.borderColor}22 !important;
        }

        /* Ícones */
        svg {
          stroke: ${settings.iconColor} !important;
        }
        
        /* Botões e Elementos Ativos */
        .bg-black {
          background-color: ${settings.btnBgColor} !important;
          color: ${settings.btnTextColor} !important;
        }
        button.bg-black, a.bg-black {
          color: ${settings.btnTextColor} !important;
        }
        button.bg-black svg, a.bg-black svg {
          stroke: ${settings.btnTextColor} !important;
        }
        .hover\\:bg-black:hover {
          background-color: ${settings.btnBgColor} !important;
          color: ${settings.btnTextColor} !important;
        }
        .hover\\:bg-black:hover svg {
          stroke: ${settings.btnTextColor} !important;
        }

        /* Ícones 3D Isométricos */
        .icon-3d-block {
          border-color: ${settings.borderColor} !important;
        }
        .icon-3d-block::before, .icon-3d-block::after {
          background-color: ${settings.borderColor} !important;
          opacity: 0.8;
        }
        .icon-3d-block.black {
          background-color: ${settings.btnBgColor} !important;
        }
        .icon-3d-block.black svg {
          stroke: ${settings.btnTextColor} !important;
        }
      `;

      // 2. Resolução de Assets Locais (IndexedDB)
      const resolveSrc = async (key: string, storedValue: string | null, target: 'main' | 'side') => {
        if (storedValue === 'LOCAL_ASSET') {
          const blob = await browserStorage.getAsset(key);
          if (blob instanceof Blob) {
            if (activeBlobUrls.current[target]) URL.revokeObjectURL(activeBlobUrls.current[target]!);
            const newUrl = URL.createObjectURL(blob);
            activeBlobUrls.current[target] = newUrl;
            return newUrl;
          }
        }
        return storedValue;
      };

      const mainSrc = await resolveSrc('main_wallpaper_blob', settings.mainUrl, 'main');
      const sideSrc = await resolveSrc('side_wallpaper_blob', settings.sideUrl, 'side');

      const mainElement = document.querySelector('main');
      const sidebarElement = document.querySelector('aside');
      const rootContainer = mainElement?.parentElement;

      if (rootContainer) rootContainer.style.backgroundColor = settings.bgColor;
      if (mainElement) mainElement.style.backgroundColor = 'transparent';

      // 3. Gerenciamento de Camadas Multimídia
      const updateLayer = (el: HTMLElement | null, className: string, url: string | null, type: string, opacity: string) => {
        if (!el) return;
        
        let layer = el.querySelector(`.${className}`) as HTMLElement;
        if (!layer) {
          layer = document.createElement('div');
          layer.className = className;
          Object.assign(layer.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-1', pointerEvents: 'none', transition: 'opacity 0.5s ease'
          });
          el.appendChild(layer);
        }

        layer.style.opacity = opacity;

        if (url) {
          if (type === 'video') {
            const currentVideo = layer.querySelector('video');
            const currentSrc = currentVideo?.querySelector('source')?.getAttribute('src');
            
            if (currentSrc !== url) {
              layer.innerHTML = `
                <video autoplay muted loop playsinline preload="auto" style="width:100%; height:100%; object-fit:cover; will-change:transform; transform: translate3d(0,0,0);">
                  <source src="${url}">
                </video>
              `;
            }
          } else {
            layer.innerHTML = '';
            layer.style.background = `url(${url}) center/cover no-repeat fixed`;
          }
        } else {
          layer.innerHTML = '';
          layer.style.background = 'none';
        }
      };

      const activeMainUrl = (settings.mode === 'global' || settings.mode === 'main_only' || settings.mode === 'separate') ? mainSrc : null;
      updateLayer(mainElement, 'lexis-bg-layer', activeMainUrl, settings.mainType, settings.opacity);

      const activeSideUrl = (settings.mode === 'global') ? mainSrc : (settings.mode === 'sidebar_only' || settings.mode === 'separate') ? sideSrc : null;
      const activeSideType = settings.mode === 'global' ? settings.mainType : settings.sideType;
      
      if (sidebarElement) {
        sidebarElement.style.backgroundColor = activeSideUrl ? 'transparent' : 'white';
        updateLayer(sidebarElement, 'lexis-side-bg-layer', activeSideUrl, activeSideType, settings.opacity);
      }
    };

    applyAppearance();
    window.addEventListener('storage', applyAppearance);
    const interval = setInterval(applyAppearance, 3000);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('storage', applyAppearance);
      clearInterval(interval);
      if (activeBlobUrls.current.main) URL.revokeObjectURL(activeBlobUrls.current.main);
      if (activeBlobUrls.current.side) URL.revokeObjectURL(activeBlobUrls.current.side);
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
    { label: 'Mensagens WhatsApp', href: '/whatsapp', icon: MessageCircle },
    { label: 'Importação de Dados', href: '/import', icon: Upload },
    { label: 'Evidências & Notas', href: '/notes', icon: StickyNote },
  ];

  const adminNav = [
    { label: 'Indicadores Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Motor de Prioridade', href: '/urgency', icon: ShieldAlert },
    { label: 'Configuração Sistema', href: '/settings', icon: Settings },
  ];

  const SidebarContentComponent = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 flex items-center px-5 border-b border-black bg-white/5 relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="icon-3d-wrapper">
            <div className="icon-3d-block black w-8 h-8 rounded-sm">
              <Scale size={16} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-black tracking-tight uppercase">LexisPredict</span>
            <span className="text-[9px] text-black/60 font-black tracking-widest uppercase italic">Elite Edition</span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden relative z-10">
        <section>
          <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Gestão</p>
          <div className="space-y-1">
            {primaryNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={false} active={pathname === item.href} onClick={() => setIsMobileOpen(false)} />
            ))}
          </div>
        </section>

        <section>
          <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Auditoria</p>
          <div className="space-y-1">
            {omniNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={false} active={pathname === item.href} onClick={() => setIsMobileOpen(false)} />
            ))}
          </div>
        </section>

        <section>
          <p className="px-3 mb-2 text-[10px] font-black text-black/40 uppercase tracking-widest">Administração</p>
          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavLink key={item.label} item={item} collapsed={false} active={pathname === item.href} onClick={() => setIsMobileOpen(false)} />
            ))}
          </div>
        </section>
      </div>

      <div className="p-2 border-t border-black bg-white/5 space-y-2 relative z-10 shrink-0">
        <div className="flex items-center p-2 rounded-sm bg-white/10 border border-black shadow-sm gap-3">
          <div className="w-8 h-8 rounded-sm bg-black text-white flex items-center justify-center font-black text-xs shrink-0 border border-black">
            {profile?.nome?.substring(0, 2).toUpperCase() || '??'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black text-black transition-colors truncate uppercase">{profile?.nome || 'Gabinete'}</span>
            <span className="text-[9px] text-black/60 transition-colors font-black uppercase truncate italic">{profile?.cargo || 'Operador'}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-[10px] font-black text-black uppercase h-8 hover:bg-black hover:text-white rounded-sm border border-transparent hover:border-black"
        >
          <LogOut size={14} className="mr-2" /> Encerrar Sessão
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[100]">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none h-10 w-10">
              <Menu size={20} className="text-black" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-2 border-black w-72 bg-white">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
              <SheetDescription>Navegação lateral do LexisPredict Elite</SheetDescription>
            </SheetHeader>
            <SidebarContentComponent />
          </SheetContent>
        </Sheet>
      </div>

      <aside className={cn(
        "hidden lg:flex h-screen bg-white/90 backdrop-blur-sm flex-col transition-all duration-200 border-r border-black shrink-0 print:hidden z-50 overflow-hidden relative",
        collapsed ? "w-[70px]" : "w-64"
      )}>
        <div className="h-14 flex items-center px-5 border-b border-black bg-white/5 relative z-10 shrink-0">
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

        <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden relative z-10">
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

        <div className="p-2 border-t border-black bg-white/5 space-y-2 relative z-10 shrink-0">
          <div className={cn(
            "flex items-center p-2 rounded-sm transition-all group",
            !collapsed ? "gap-3 bg-white/10 border border-black shadow-sm hover:bg-black hover:text-white" : "justify-center"
          )}>
            <div className="w-8 h-8 rounded-sm bg-black text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white group-hover:text-black border border-black">
              {profile?.nome?.substring(0, 2).toUpperCase() || '??'}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black text-black group-hover:text-white transition-colors truncate uppercase">{profile?.nome || 'Gabinete'}</span>
                <span className="text-[9px] text-black/60 transition-colors font-black uppercase truncate italic">{profile?.cargo || 'Operador'}</span>
              </div>
            )}
          </div>

          {!collapsed && (
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-[10px] font-black text-black uppercase h-8 hover:bg-black hover:text-white rounded-sm border border-transparent hover:border-black"
            >
              <LogOut size={14} className="mr-2" /> Encerrar Sessão
            </Button>
          )}

          <div className="flex items-center justify-between px-2">
            {!collapsed && (
              <span className="text-[9px] font-black text-black uppercase flex items-center gap-1">
                {isAdmin ? <Unlock size={10} className="text-green-600" /> : <Lock size={10} />}
                <span>{isAdmin ? "Admin" : "Operador"}</span>
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="h-6 w-6 text-black/40 hover:bg-black hover:text-white"
            >
              {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({ item, collapsed, active, onClick }: { item: any, collapsed: boolean, active: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={item.href}
      onClick={onClick}
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
