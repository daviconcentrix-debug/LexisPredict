
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
  Type,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AUTHORITY_PRESETS, applyGlobalTheme, hexToHsl } from '@/lib/theme';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Style');
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState('pt');
  
  // Custom theme states
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
      document.documentElement.style.backgroundSize = 'cover';
      document.documentElement.style.backgroundAttachment = 'fixed';
    } else {
      localStorage.removeItem('lexisPredict_wallpaper');
      document.documentElement.style.backgroundImage = 'none';
    }
    toast({ title: "Custom Hardware Applied" });
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <h1 className="font-bold text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
          <Badge variant="outline" className="border-primary text-primary text-[9px] uppercase font-bold tracking-[0.3em]">Elite v14.0</Badge>
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
                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Telemetry Preview</Label>
                    <div className="p-8 bg-card border border-border rounded-xl space-y-6 shadow-sm border-2">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-primary rounded-sm" />
                             <span className="text-sm font-black text-foreground uppercase">Gabinete Real-Time</span>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-none text-[8px]">CONTRASTE AAA</Badge>
                       </div>
                       <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">
                          Esta simulação reflete o comportamento dos botões primários e secundários em tempo real.
                       </p>
                       <div className="flex gap-4">
                          <button className="flex-1 h-11 text-[9px] font-black uppercase bg-primary text-primary-foreground rounded-lg shadow-lg">PRIMARY ACTION</button>
                          <button className="flex-1 h-11 text-[9px] font-black uppercase border-2 border-border text-foreground hover:bg-accent rounded-lg">SECONDARY ACTION</button>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Custom Hardware Overrides</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-card p-6 border border-border rounded-xl">
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Fundo (Background)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Texto (Foreground)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="font-mono text-xs" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Destaque (Primary)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold flex items-center gap-2"><ImageIcon size={12}/> Plano de Fundo (Wallpaper URL)</Label>
                            <Input placeholder="https://..." value={wallpaper} onChange={(e) => setWallpaper(e.target.value)} className="text-xs" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold flex items-center gap-2"><Layout size={12}/> Raio de Borda (Radius: {radius}px)</Label>
                            <Input type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} />
                          </div>
                          <Button onClick={handleManualApply} className="w-full bg-black text-white hover:bg-primary hover:text-black font-black uppercase text-[10px] h-12 mt-4 transition-all">
                             Aplicar Modificações
                          </Button>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Series Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button key={p.id} onClick={() => handlePresetChange(p)} className="p-4 border-2 border-border/50 hover:border-primary transition-all flex flex-col items-center gap-3 bg-card rounded-xl">
                            <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: p.colors.background }}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{p.name.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <div className="bg-[#0F1117] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-right-4">
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Pentade Neural Mission Control</h3>
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
                      <Label className="text-[10px] font-black uppercase opacity-60 tracking-widest">Localização & Fuso Horário</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleLanguageChange('pt')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all rounded-xl text-left",
                            locale === 'pt' ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇧🇷</span>
                            <div>
                              <p className="text-[10px] font-black uppercase">Português (Brasil)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Idioma Padrão</p>
                            </div>
                          </div>
                          {locale === 'pt' && <Check size={16} className="text-primary" />}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('en')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all rounded-xl text-left",
                            locale === 'en' ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇺🇸</span>
                            <div>
                              <p className="text-[10px] font-black uppercase">English (US)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">International Protocol</p>
                            </div>
                          </div>
                          {locale === 'en' && <Check size={16} className="text-primary" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border"> 
                      <div className="flex items-center justify-between"> 
                        <div> 
                          <div className="font-black uppercase text-[10px]">Fuso Horário do Gabinete</div> 
                          <div className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-1">América/São Paulo (BRT)</div> 
                        </div> 
                        <div className="text-[8px] px-3 py-1 rounded-none border border-border text-muted-foreground font-black uppercase"> Automático </div> 
                      </div> 
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("w-full justify-start rounded-xl font-black uppercase text-[10px] tracking-[0.2em] h-12", active ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground")}>
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 border-2 transition-all cursor-pointer mb-3 rounded-xl", active ? "border-[#6366F1] bg-[#6366F1]/10" : "border-white/5")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} className="border-white/20" />
         <div className="text-left">
           <p className="font-black text-[10px] uppercase tracking-widest text-white">{label}</p>
           <p className="text-[9px] text-white/40 uppercase mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-[#6366F1] fill-[#6366F1]" />}
    </label>
  );
}
