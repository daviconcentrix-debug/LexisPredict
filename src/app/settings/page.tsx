"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Globe,
  Zap,
  Image as ImageIcon,
  Layout,
  Waves,
  RefreshCcw,
  Trash2,
  Check,
  ShieldCheck,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { AUTHORITY_PRESETS, applyGlobalTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { 
  persistOpacity, 
  applyWallpaperUrl, 
  resetWallpaper, 
  saveWallpaperFile, 
  loadVisualStateFromStorage,
  setCssOpacityVars
} from '@/lib/visual-hardware';

/**
 * COMPONENTES AUXILIARES DE NAVEGAÇÃO
 */
function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-none border-2 font-black uppercase text-[10px] tracking-[0.2em] h-12 mb-1", 
        active ? "bg-black text-white border-black" : "text-muted-foreground border-transparent hover:border-black/10"
      )}
    >
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 border-2 transition-all cursor-pointer mb-3 rounded-none", active ? "border-black bg-black/5" : "border-black/5")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} className="border-black/20" />
         <div className="text-left">
           <p className="font-black text-[10px] uppercase tracking-widest text-black">{label}</p>
           <p className="text-[9px] text-black/40 uppercase mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-black fill-black" />}
    </label>
  );
}

/**
 * PÁGINA PRINCIPAL DE CONFIGURAÇÕES
 */
export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Style');
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState('pt');
  
  // Custom theme states
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [primaryColor, setPrimaryColor] = useState('#00D1FF');
  const [radius, setRadius] = useState(4);
  const [bgOpacity, setBgOpacity] = useState(85);
  const [sidebarOpacity, setSidebarOpacity] = useState(90);
  const [glassBlur, setGlassBlur] = useState(8);
  const [wallpaper, setWallpaper] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setLocale(localStorage.getItem('lexisPredict_locale') || 'pt');
    
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
    setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
    setPrimaryColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
    setRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));

    const visual = loadVisualStateFromStorage();
    setWallpaper(visual.wallpaper);
    setBgOpacity(Math.round(visual.bgOpacity01 * 100));
    setSidebarOpacity(Math.round(visual.sidebarOpacity01 * 100));
    setGlassBlur(visual.glassBlur);
    
    setCssOpacityVars(visual.bgOpacity01, visual.sidebarOpacity01, visual.glassBlur);
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
    applyGlobalTheme(preset.colors, preset.radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
    toast({ title: `${preset.name} Ativado` });
  };

  const handleBgOpacity = (val: number[]) => {
    const pct = val[0];
    setBgOpacity(pct);
    persistOpacity(pct / 100, sidebarOpacity / 100, glassBlur);
  };

  const handleSidebarOpacity = (val: number[]) => {
    const pct = val[0];
    setSidebarOpacity(pct);
    persistOpacity(bgOpacity / 100, pct / 100, glassBlur);
  };

  const handleGlassBlur = (val: number[]) => {
    const px = val[0];
    setGlassBlur(px);
    persistOpacity(bgOpacity / 100, sidebarOpacity / 100, px);
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
    applyGlobalTheme(customColors, radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
    if (wallpaper) {
      applyWallpaperUrl(wallpaper);
    }
    toast({ title: "Hardware Visual Aplicado" });
  };

  const handleWallpaperFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await saveWallpaperFile(file);
      setWallpaper(url);
      toast({ title: "Wallpaper Enviado" });
    } catch (e) {
      toast({ title: "Falha no Upload", variant: "destructive" });
    }
  };

  const handleResetWallpaperAction = async () => {
    await resetWallpaper();
    setWallpaper('');
    toast({ title: "Atmosfera Resetada" });
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-transparent font-sans text-black overflow-hidden relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden glass-panel">
        <header className="h-16 border-b border-black/10 bg-white/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <h1 className="font-black text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black text-[9px] uppercase font-black tracking-[0.3em] rounded-none px-3 py-1">Elite v17.0</Badge>
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
                    <div className="p-8 glass-card border-2 border-black rounded-none space-y-6 shadow-[8px_8px_0px_#000]">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-black rounded-none" style={{ backgroundColor: primaryColor }} />
                             <span className="text-sm font-black text-black uppercase">Gabinete Real-Time</span>
                          </div>
                          <Badge className="bg-green-600 text-white border-none text-[8px] font-black rounded-none px-2 py-0.5">CONTRASTE AAA</Badge>
                       </div>
                       <p className="text-xs text-black font-black uppercase tracking-widest leading-relaxed">
                          Opacidade Atual: {bgOpacity}% | Blur: {glassBlur}px
                       </p>
                       <div className="flex gap-4">
                          <button className="flex-1 h-12 text-[9px] font-black uppercase bg-black text-white rounded-none shadow-lg border-2 border-black hover:bg-white hover:text-black transition-all">AÇÃO ATIVA</button>
                          <button className="flex-1 h-12 text-[9px] font-black uppercase border-2 border-black text-black hover:bg-black hover:text-white transition-all rounded-none bg-white">AÇÃO INATIVA</button>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Transparência & Glassmorphism</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 glass-card p-6 border-2 border-black rounded-none shadow-[4px_4px_0px_#000]">
                       <div className="space-y-4">
                          <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-black"><Waves size={12}/> Fundo Principal: {bgOpacity}%</Label>
                          <Slider value={[bgOpacity]} max={100} min={20} step={1} onValueChange={handleBgOpacity} className="[&_[role=slider]]:bg-black" />
                       </div>
                       <div className="space-y-4">
                          <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-black"><Layout size={12}/> Sidebar: {sidebarOpacity}%</Label>
                          <Slider value={[sidebarOpacity]} max={100} min={20} step={1} onValueChange={handleSidebarOpacity} className="[&_[role=slider]]:bg-black" />
                       </div>
                       <div className="space-y-4">
                          <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-black"><RefreshCcw size={12}/> Blur Intensidade: {glassBlur}px</Label>
                          <Slider value={[glassBlur]} max={30} min={0} step={1} onValueChange={handleGlassBlur} className="[&_[role=slider]]:bg-black" />
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Custom Hardware Overrides</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 glass-card p-6 border-2 border-black rounded-none shadow-[4px_4px_0px_#000]">
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Palette size={12}/> Fundo (Background)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 p-1 border-2 border-black rounded-none" />
                              <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs border-2 border-black rounded-none uppercase" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Type size={12}/> Texto (Foreground)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-12 h-10 p-1 border-2 border-black rounded-none" />
                              <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="font-mono text-xs border-2 border-black rounded-none uppercase" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Zap size={12}/> Destaque (Primary)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 border-2 border-black rounded-none" />
                              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs border-2 border-black rounded-none uppercase" />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2"><ImageIcon size={12}/> Wallpaper URL</Label>
                            <Input placeholder="https://..." value={wallpaper} onChange={(e) => setWallpaper(e.target.value)} className="text-xs border-2 border-black rounded-none" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Layout size={12}/> Raio de Borda: {radius}px</Label>
                            <Input type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="accent-black" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button onClick={handleManualApply} className="flex-1 bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black uppercase text-[10px] h-12 rounded-none transition-all shadow-[4px_4px_0px_#000] hover:shadow-none">
                               Aplicar Hardware
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleResetWallpaperAction} className="h-12 w-12 border-2 border-black rounded-none hover:bg-red-600 hover:text-white" title="Resetar Wallpaper">
                               <Trash2 size={16} />
                            </Button>
                          </div>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Presets Authority Series</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button key={p.id} onClick={() => handlePresetChange(p)} className="p-4 border-2 border-black/10 hover:border-black transition-all flex flex-col items-center gap-3 glass-card rounded-none bg-white/40">
                            <div className="w-8 h-8 rounded-full border-2 border-black/20" style={{ backgroundColor: p.colors.background }}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-center">{p.name.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] animate-in slide-in-from-right-4">
                  <CardHeader className="bg-black text-white border-b-2 border-black py-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Neural Mission Control</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); toast({ title: "Motor Neural Alternado" }); }}>
                      <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade para contratos complexos." active={iaModel === 'xai'} />
                      <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-veloz de dados e transcrição forense." active={iaModel === 'airforce'} />
                      <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real para atendimento ao cliente." active={iaModel === 'groq-llama'} />
                      <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise de riscos e triagem técnica." active={iaModel === 'groq-deepseek'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'System' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                   <div className="space-y-6">
                      <Label className="text-[10px] font-black uppercase opacity-60 tracking-widest">Localização & Protocolo</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button onClick={() => handleLanguageChange('pt')} className={cn("flex items-center justify-between p-6 border-2 transition-all rounded-none text-left", locale === 'pt' ? "border-black bg-black/5" : "border-black/10 bg-white")}>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇧🇷</span>
                            <div className="font-black uppercase text-[10px] text-black">Português (BR)</div>
                          </div>
                          {locale === 'pt' && <Check size={16} className="text-black" />}
                        </button>
                        <button onClick={() => handleLanguageChange('en')} className={cn("flex items-center justify-between p-6 border-2 transition-all rounded-none text-left", locale === 'en' ? "border-black bg-black/5" : "border-black/10 bg-white")}>
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇺🇸</span>
                            <div className="font-black uppercase text-[10px] text-black">English (US)</div>
                          </div>
                          {locale === 'en' && <Check size={16} className="text-black" />}
                        </button>
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
