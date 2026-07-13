
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Globe,
  Check,
  Zap,
  Image as ImageIcon,
  Layout,
  Star,
  ShieldCheck,
  RefreshCcw,
  Copyright
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AUTHORITY_PRESETS, applyGlobalTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Style');
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState('pt');
  
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [primaryColor, setPrimaryColor] = useState('#00D1FF');
  const [wallpaper, setWallpaper] = useState('');
  const [radius, setRadius] = useState(4);

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setLocale(localStorage.getItem('lexisPredict_locale') || 'pt');
    
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
    setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
    setPrimaryColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
    setWallpaper(localStorage.getItem('lexisPredict_wallpaper') || '');
    setRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLocale(lang);
    localStorage.setItem('lexisPredict_locale', lang);
    toast({ title: "Idioma Alterado", description: "Sincronizando ambiente..." });
    setTimeout(() => window.location.reload(), 800);
  };

  const handlePresetChange = (preset: any) => {
    setBgColor(preset.colors.background);
    setFontColor(preset.colors.foreground);
    setPrimaryColor(preset.colors.primary);
    setRadius(preset.radius);
    applyGlobalTheme(preset.colors, preset.radius, false);
    toast({ title: `${preset.name} Ativado` });
  };

  const handleWallpaperSelect = (url: string) => {
    setWallpaper(url);
    localStorage.setItem('lexisPredict_wallpaper', url);
    document.documentElement.style.backgroundImage = `url(${url})`;
    document.documentElement.style.backgroundSize = 'cover';
    document.documentElement.style.backgroundAttachment = 'fixed';
    toast({ title: "Atmosfera Sincronizada" });
  };

  const handleManualApply = () => {
    const customColors = {
      background: bgColor,
      foreground: fontColor,
      primary: primaryColor,
      border: bgColor === '#FFFFFF' ? '#E5E7EB' : '#1F2937',
      secondary: bgColor === '#FFFFFF' ? '#F3F4F6' : '#111111',
      card: bgColor,
      accent: primaryColor
    };
    applyGlobalTheme(customColors, radius);
    if (wallpaper) {
      localStorage.setItem('lexisPredict_wallpaper', wallpaper);
      document.documentElement.style.backgroundImage = `url(${wallpaper})`;
    } else {
      localStorage.removeItem('lexisPredict_wallpaper');
      document.documentElement.style.backgroundImage = 'none';
    }
    toast({ title: "Hardware Visual Aplicado" });
  };

  if (!mounted) return null;

  const starlinkImages = PlaceHolderImages.filter(img => img.id.startsWith('starlink'));

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
            <Badge variant="outline" className="border-primary text-primary text-[9px] uppercase font-bold tracking-[0.3em]">Elite v16.0</Badge>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-black uppercase text-[10px] flex items-center gap-1.5 px-3 py-1">
               <ShieldCheck size={10} /> Authenticated
             </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <aside className="space-y-1">
              <NavButton active={activeTab === 'Style'} onClick={() => setActiveTab('Style')} icon={<Palette size={14}/>} label="Hardware Visual" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              <NavButton active={activeTab === 'System'} onClick={() => setActiveTab('System')} icon={<Globe size={14}/>} label="Localização" />
            </aside>

            <div className="md:col-span-3 space-y-12 pb-20">
              {activeTab === 'Style' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  {/* MOCKUP PREVIEW CRÍTICO */}
                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Telemetry Preview</Label>
                    <div className="bg-card border-2 border-border p-8 rounded-none shadow-2xl relative overflow-hidden">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Interface Mockup</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] uppercase">Fidelity 100%</Badge>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="p-5 border border-border bg-background/50 space-y-4">
                             <p className="text-[9px] font-bold uppercase opacity-60">Control Component</p>
                             <div className="space-y-2">
                               <Button className="w-full h-10 font-black uppercase text-[10px] rounded-none" style={{ backgroundColor: primaryColor, color: bgColor === '#FFFFFF' ? '#000' : '#FFF' }}>
                                 Primary Action
                               </Button>
                               <Button variant="outline" className="w-full h-10 font-black uppercase text-[10px] border-2 rounded-none hover:bg-secondary">
                                 Secondary Action
                               </Button>
                             </div>
                          </div>
                          <div className="p-5 border border-border bg-background/50 space-y-4">
                             <p className="text-[9px] font-bold uppercase opacity-60">Status Telemetry</p>
                             <div className="flex gap-2">
                                <Badge className="bg-red-600 text-white text-[8px] uppercase rounded-none">Vencido</Badge>
                                <Badge className="bg-orange-500 text-white text-[8px] uppercase rounded-none">Atenção</Badge>
                                <Badge className="bg-green-600 text-white text-[8px] uppercase rounded-none">No Prazo</Badge>
                             </div>
                             <div className="h-2 w-full bg-secondary overflow-hidden">
                                <div className="h-full w-[65%]" style={{ backgroundColor: primaryColor }} />
                             </div>
                          </div>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Series Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button 
                            key={p.id} 
                            onClick={() => handlePresetChange(p)} 
                            className={cn(
                                "p-4 border-2 transition-all flex flex-col items-center gap-3 bg-card rounded-none group",
                                bgColor === p.colors.background ? "border-primary" : "border-border/50 hover:border-primary/50"
                            )}
                         >
                            <div className="w-8 h-8 rounded-full border border-border relative overflow-hidden" style={{ backgroundColor: p.colors.background }}>
                                {p.id === 'executive-gold' && <div className="absolute inset-0 bg-gradient-to-tr from-yellow-700 via-yellow-400 to-yellow-700 opacity-50" />}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ backgroundColor: p.colors.primary }} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-center">{p.name}</span>
                         </button>
                       ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Starlink Orbit Atmospheres</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {starlinkImages.map((img) => (
                            <button 
                                key={img.id}
                                onClick={() => handleWallpaperSelect(img.imageUrl)}
                                className={cn(
                                    "relative aspect-video border-2 overflow-hidden group transition-all",
                                    wallpaper === img.imageUrl ? "border-primary shadow-[0_0_15px_rgba(0,209,255,0.3)]" : "border-border/50"
                                )}
                            >
                                <img src={img.imageUrl} alt={img.description} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Star className="text-white fill-white" size={20} />
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[7px] font-black text-white uppercase">
                                  {img.description}
                                </div>
                            </button>
                        ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Custom Engine Overrides</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-card p-6 border-2 border-border rounded-none shadow-xl">
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Background</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 p-1 rounded-none border-2 border-black" />
                              <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs rounded-none border-2 border-black" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Text (Foreground)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-12 h-10 p-1 rounded-none border-2 border-black" />
                              <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="font-mono text-xs rounded-none border-2 border-black" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Accent (Primary)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 rounded-none border-2 border-black" />
                              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs rounded-none border-2 border-black" />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold flex items-center gap-2"><ImageIcon size={12}/> Wallpaper URL</Label>
                            <Input placeholder="https://..." value={wallpaper} onChange={(e) => setWallpaper(e.target.value)} className="text-xs rounded-none border-2 border-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold flex items-center gap-2"><Layout size={12}/> Border Radius: {radius}px</Label>
                            <Input type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="accent-black" />
                          </div>
                          <Button onClick={handleManualApply} className="w-full bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black uppercase text-[10px] h-12 mt-4 transition-all shadow-[6px_6px_0px_#00D1FF] hover:shadow-none">
                             Apply System Changes
                          </Button>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <div className="bg-[#0F1117] border-2 border-white/10 p-6 animate-in slide-in-from-right-4 rounded-none">
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Mission Control</h3>
                    <p className="text-[10px] text-white/40 uppercase">Selecione o motor de IA principal para as operações de gabinete.</p>
                  </div>
                  <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                    <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade." active={iaModel === 'xai'} />
                    <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-veloz de dados." active={iaModel === 'airforce'} />
                    <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real." active={iaModel === 'groq-llama'} />
                    <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise forense." active={iaModel === 'groq-deepseek'} />
                    <EngineOption id="puter" label="PUTER AI" desc="Operação edge para baixa latência." active={iaModel === 'puter'} />
                  </RadioGroup>
                </div>
              )}

              {activeTab === 'System' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                   <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase opacity-60 tracking-widest">Localization & Protocol</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleLanguageChange('pt')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all text-left rounded-none bg-card",
                            locale === 'pt' ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇧🇷</span>
                            <div>
                              <p className="text-[10px] font-black uppercase">Português (Brasil)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Standard</p>
                            </div>
                          </div>
                          {locale === 'pt' && <Check size={16} className="text-primary" />}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('en')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all text-left rounded-none bg-card",
                            locale === 'en' ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇺🇸</span>
                            <div>
                              <p className="text-[10px] font-black uppercase">English (US)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Global</p>
                            </div>
                          </div>
                          {locale === 'en' && <Check size={16} className="text-primary" />}
                        </button>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <footer className="h-10 border-t border-border/30 bg-background/80 backdrop-blur-md flex items-center justify-center gap-6 text-[10px] text-muted-foreground/50 font-bold uppercase tracking-[0.3em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
          <span>Advanced Performance Engine</span>
        </footer>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("w-full justify-start rounded-none font-black uppercase text-[10px] tracking-[0.2em] h-12", active ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground")}>
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 border-2 transition-all cursor-pointer mb-3 rounded-none bg-card", active ? "border-primary bg-primary/10" : "border-white/5")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} className="border-white/20" />
         <div className="text-left">
           <p className="font-black text-[10px] uppercase tracking-widest text-white">{label}</p>
           <p className="text-[9px] text-white/40 uppercase mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-primary fill-primary" />}
    </label>
  );
}
