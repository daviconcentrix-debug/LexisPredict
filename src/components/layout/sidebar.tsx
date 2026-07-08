"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  X,
  FileText
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
  const samplingCanvas = useRef<HTMLCanvasElement | null>(null);

  const isAdmin = profile?.cargo === 'Administrador';

  const extractColorsFromElement = useCallback((element: HTMLImageElement | HTMLVideoElement) => {
    if (!samplingCanvas.current) {
      samplingCanvas.current = document.createElement('canvas');
    }
    const canvas = samplingCanvas.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = 50;
    canvas.height = 50;

    try {
      ctx.drawImage(element, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        r += data[i+1];
        r += data[i+2];
      }
      
      const count = data.length / 4;
      if (!count || isNaN(count) || count === 0) return null;

      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);

      if (isNaN(avgR) || isNaN(avgG) || isNaN(avgB)) return null;

      const lum = (0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB) / 255;
      
      const toHex = (c: number) => {
        const hex = Math.max(0, Math.min(255, c)).toString(16);
        return hex.padStart(2, '0');
      };

      const dominant = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;
      
      const isLight = lum > 0.5;
      const font = isLight ? '#000000' : '#ffffff';
      const border = isLight ? '#000000' : '#ffffff';
      const btnBg = isLight ? '#000000' : '#ffffff';
      const btnText = isLight ? '#ffffff' : '#000000';
      const icon = isLight ? '#000000' : '#ffffff';

      return { dominant, font, border, btnBg, btnText, icon, lum };
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    const sampleFrame = () => {
      const isAuto = localStorage.getItem('lexis_auto_theme') === 'true';
      if (!isAuto) return;

      const mainLayer = document.querySelector('.lexis-bg-layer');
      const video = mainLayer?.querySelector('video');
      const img = mainLayer?.querySelector('img');

      let target: HTMLVideoElement | HTMLImageElement | null = null;
      if (video && video.readyState >= 2) target = video;
      else if (img && img.complete) target = img;

      if (target) {
        const colors = extractColorsFromElement(target);
        if (colors && colors.dominant.length === 7) {
          const lastDominant = localStorage.getItem('lexisPredict_last_sampled');
          if (colors.dominant !== lastDominant) {
            localStorage.setItem('lexisPredict_bg_color', colors.dominant);
            localStorage.setItem('lexisPredict_font_color', colors.font);
            localStorage.setItem('lexisPredict_btn_bg_color', colors.btnBg);
            localStorage.setItem('lexisPredict_btn_text_color', colors.btnText);
            localStorage.setItem('lexisPredict_icon_color', colors.icon);
            localStorage.setItem('lexisPredict_border_color', colors.border);
            localStorage.setItem('lexisPredict_last_sampled', colors.dominant);
            window.dispatchEvent(new Event('storage'));
          }
        }
      }
    };

    const interval = setInterval(sampleFrame, 1000);
    return () => clearInterval(interval);
  }, [extractColorsFromElement]);

  useEffect(() => {
    isMounted.current = true;
    
    const hexToRgba = (hex: string, opacity: number) => {
      if (!hex || hex.length !== 7) return `rgba(0,0,0,${opacity})`;
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const applyAppearance = async () => {
      if (typeof window === 'undefined' || !isMounted.current) return;

      const settings = {
        mode: localStorage.getItem('lexis_wp_mode') || 'global',
        mainUrl: localStorage.getItem('lexis_wp_main_url'),
        sideUrl: localStorage.getItem('lexis_wp_sidebar_url'),
        mainType: localStorage.getItem('lexis_wp_main_type') || 'image',
        sideType: localStorage.getItem('lexis_wp_sidebar_type') || 'image',
        opacity: localStorage.getItem('lexis_wp_opacity') || '1',
        autoTheme: localStorage.getItem('lexis_auto_theme') === 'true',
        bgColor: localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2',
        fontColor: localStorage.getItem('lexisPredict_font_color') || '#000000',
        unselectedFontColor: localStorage.getItem('lexisPredict_unselected_font_color') || '#000000',
        btnBgColor: localStorage.getItem('lexisPredict_btn_bg_color') || '#000000',
        unselectedBtnBgColor: localStorage.getItem('lexisPredict_unselected_btn_bg_color') || '#ffffff',
        btnTextColor: localStorage.getItem('lexisPredict_btn_text_color') || '#ffffff',
        iconColor: localStorage.getItem('lexisPredict_icon_color') || '#000000',
        borderColor: localStorage.getItem('lexisPredict_border_color') || '#000000',
        containerOpacity: parseFloat(localStorage.getItem('lexisPredict_container_opacity') || '1'),
      };

      const settingsKey = JSON.stringify(settings);
      if (settingsKey === lastAppliedSettings.current) return;
      
      const injectStyle = () => {
        let fontStyle = document.getElementById('lexis-custom-theme') as HTMLStyleElement;
        if (!fontStyle) {
          fontStyle = document.createElement('style');
          fontStyle.id = 'lexis-custom-theme';
          document.head.appendChild(fontStyle);
        }

        const btnBgRgba = hexToRgba(settings.btnBgColor, settings.containerOpacity);
        const unselectedBtnBgRgba = hexToRgba(settings.unselectedBtnBgColor, settings.containerOpacity);
        const borderRgba = hexToRgba(settings.borderColor, settings.containerOpacity);
        const fontRgba = settings.fontColor;
        
        fontStyle.innerHTML = `
          body, .text-black, h1, h2, h3, h4, h5, h6, p, span, label, input, textarea, select, .font-black {
            color: ${fontRgba} !important;
          }
          .text-muted-foreground, .unselected-text {
            color: ${settings.unselectedFontColor} !important;
            opacity: 0.8;
          }
          input::placeholder, textarea::placeholder {
            color: ${settings.fontColor}44 !important;
          }
          .border-black, .border-2, .border-r, .border-b, .border-t, .border-l, border-collapse, hr {
            border-color: ${borderRgba} !important;
          }
          .divide-black\\/5 > * + *, .divide-black\\/10 > * + * {
            border-color: ${settings.borderColor}22 !important;
          }
          svg {
            stroke: ${settings.iconColor} !important;
          }
          .bg-black, [data-active="true"], .active-item {
            background-color: ${btnBgRgba} !important;
            color: ${settings.btnTextColor} !important;
          }
          .bg-black svg, [data-active="true"] svg {
            stroke: ${settings.btnTextColor} !important;
          }
          .bg-white, .bg-sidebar, .bg-card, .bg-\\[\\#f3f2f2\\], .bg-[#f3f2f2], [data-active="false"], .inactive-item {
            background-color: ${unselectedBtnBgRgba} !important;
            color: ${settings.unselectedFontColor} !important;
          }
          .bg-white svg, .bg-sidebar svg, .inactive-item svg {
            stroke: ${settings.iconColor} !important;
          }
          header, .bg-\\[\\#f8f9fb\\], .bg-[#f8f9fb] {
            background-color: ${unselectedBtnBgRgba} !important;
            border-color: ${borderRgba} !important;
          }
          .hover\\:bg-black:hover {
            background-color: ${btnBgRgba} !important;
            color: ${settings.btnTextColor} !important;
          }
          .hover\\:bg-black:hover svg {
            stroke: ${settings.btnTextColor} !important;
          }
          .icon-3d-block {
            border-color: ${borderRgba} !important;
          }
          .icon-3d-block::before, .icon-3d-block::after {
            background-color: ${settings.borderColor} !important;
            opacity: 0.8;
          }
          .icon-3d-block.black {
            background-color: ${btnBgRgba} !important;
          }
          .icon-3d-block.black svg {
            stroke: ${settings.btnTextColor} !important;
          }
        `;
      };

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
      
      if (mainElement?.parentElement) {
        mainElement.parentElement.style.backgroundColor = settings.bgColor;
        mainElement.parentElement.style.transition = 'background-color 0.5s ease';
      }
      
      if (mainElement) mainElement.style.backgroundColor = 'transparent';

      const updateLayer = (el: HTMLElement | null, className: string, url: string | null, type: string, opacity: string) => {
        if (!el) return;
        let layer = el.querySelector(`.${className}`) as HTMLElement;
        if (!layer) {
          layer = document.createElement('div');
          layer.className = className;
          Object.assign(layer.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-1', pointerEvents: 'none', transition: 'opacity 0.5s ease'
          });
          el.appendChild(layer);
        }
        layer.style.opacity = opacity;

        if (url) {
          if (type === 'video') {
            const currentVideo = layer.querySelector('video');
            if (currentVideo?.querySelector('source')?.getAttribute('src') !== url) {
              layer.innerHTML = `
                <video autoplay muted loop playsinline preload="auto" style="width:100%; height:100%; object-fit:cover; will-change:transform; transform: translate3d(0,0,0);">
                  <source src="${url}">
                </video>
              `;
            }
          } else {
            layer.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover; position:fixed; top:0; left:0; z-index:-1;" />`;
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

      if (!settings.autoTheme) injectStyle();
      lastAppliedSettings.current = settingsKey;
    };

    applyAppearance();
    window.addEventListener('storage', applyAppearance);
    const interval = setInterval(applyAppearance, 2000);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('storage', applyAppearance);
      clearInterval(interval);
    };
  }, [extractColorsFromElement]);

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
    { label: 'Gerador de Procurações', href: '/documents', icon: FileText },
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
            <span className="text-[11px] font-black text-black transition-colors uppercase">{profile?.nome || 'Gabinete'}</span>
            <span className="text-[9px] text-black/60 transition-colors font-black uppercase italic">{profile?.cargo || 'Operador'}</span>
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
              className="h-6 v-6 text-black/40 hover:bg-black hover:text-white"
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
      data-active={active ? "true" : "false"}
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
