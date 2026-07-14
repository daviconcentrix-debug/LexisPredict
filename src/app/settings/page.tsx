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
  Type,
  MousePointer2
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

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Hardware');
  
  // Custom theme states
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgSecondaryColor, setBgSecondaryColor] = useState('#F3F4F6');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [fontMutedColor, setFontMutedColor] = useState('#6B7280');
  const [primaryColor, setPrimaryColor] = useState('#00D1FF');
  const [accentColor, setAccentColor] = useState('#E5E7EB');
  const [radius, setRadius] = useState(4);
  
  const [bgOpacity, setBgOpacity] = useState(85);
  const [sidebarOpacity, setSidebarOpacity] = useState(90);
  const [glassBlur, setGlassBlur] = useState(8);
  const [wallpaper, setWallpaper] = useState('');
  
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState('pt');

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    // Carregar preferências
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setLocale(localStorage.getItem('lexisPredict_locale') || 'pt');
    
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
    setBgSecondaryColor(localStorage.getItem('lexisPredict_bg_secondary_color') || '#F3F4F6');
    setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
    setFontMutedColor(localStorage.getItem('lexisPredict_font_muted_color') || '#6B7280');
    setPrimaryColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
    setAccentColor(localStorage.getItem('lexisPredict_btn_inactive_color') || '#E5E7EB');
    setRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));

    const visual = loadVisualStateFromStorage();
    setWallpaper(visual.wallpaper);
    setBgOpacity(Math.round(visual.bgOpacity01 * 100));
    setSidebarOpacity(Math.round(visual.sidebarOpacity01 * 100));
    setGlassBlur(visual.glassBlur);
  }, []);

  const handleApplyHardware = () => {
    const customColors = {
      background: bgColor,
      bgSecondary: bgSecondaryColor,
      foreground: fontColor,
      fontMuted: fontMutedColor,
      primary: primaryColor,
      accent: accentColor,
      border: fontColor // Borda segue a cor do texto principal por padrão técnico
    };
    applyGlobalTheme(customColors, radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
    if (wallpaper) applyWallpaperUrl(wallpaper);
    toast({ title: "Hardware Visual Aplicado", description: "O sistema foi reconfigurado com sucesso." });
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
          <Badge variant="outline" className="border-black border-2 text-black text-[9px] uppercase font-black tracking-[0.3em] rounded-none px-3 py-1">Elite v20.0</Badge>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* NAVEGAÇÃO LATERAL */}
            <aside className="space-y-1">
              <NavButton active={activeTab === 'Hardware'} onClick={() => setActiveTab('Hardware')} icon={<Palette size={14}/>} label="Hardware Visual" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              <NavButton active={activeTab === 'System'} onClick={() => setActiveTab('System')} icon={<Globe size={14}/>} label="Localização" />
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="md:col-span-3 space-y-12 pb-20">
              {activeTab === 'Hardware' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  
                  {/* PREVISÃO TÉCNICA */}
                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Telemetry Preview</Label>
                    <div className="p-8 glass-card border-2 border-black rounded-none space-y-8 shadow-[10px_10px_0px_#000]">
                       <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4" style={{ backgroundColor: primaryColor }} />
                             <span className="text-sm font-black text-black uppercase" style={{ color: fontColor }}>Gabinete Operacional</span>
                          </div>
                          <Badge className="bg-green-600 text-white border-none text-[8px] font-black rounded-none px-2 py-0.5">CONTRASTE AAA</Badge>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: fontMutedColor }}>Componentes Ativos</p>
                            <Button className="w-full h-12 rounded-none border-2 border-black shadow-[4px_4px_0px_#000] font-black uppercase text-[10px]" style={{ backgroundColor: primaryColor, color: bgColor }}>Ação Ativa</Button>
                            <p className="text-[10px] font-black uppercase leading-relaxed" style={{ color: fontColor }}>O texto principal do sistema seguirá esta tonalidade técnica.</p>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: fontMutedColor }}>Componentes Inativos</p>
                            <Button className="w-full h-12 rounded-none border-2 border-black font-black uppercase text-[10px] bg-white" style={{ backgroundColor: accentColor, color: fontMutedColor }}>Ação Inativa</Button>
                            <p className="text-[10px] font-black uppercase leading-relaxed" style={{ color: fontMutedColor }}>Elementos de fundo e detalhes secundários usarão estes tons.</p>
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* ARQUITETURA DE CORES */}
                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Hardware de Cores</Label>
                    <div className="glass-card p-8 border-2 border-black rounded-none shadow-[6px_6px_0px_#000] space-y-10">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          <ColorPicker label="Fundo Ativo" value={bgColor} onChange={setBgColor} />
                          <ColorPicker label="Letras Ativas" value={fontColor} onChange={setFontColor} />
                          <ColorPicker label="Ação Ativa" value={primaryColor} onChange={setPrimaryColor} />
                          <ColorPicker label="Fundo Inativo" value={bgSecondaryColor} onChange={setBgSecondaryColor} />
                          <ColorPicker label="Letras Inativas" value={fontMutedColor} onChange={setFontMutedColor} />
                          <ColorPicker label="Ação Inativa" value={accentColor} onChange={setAccentColor} />
                       </div>
                    </div>
                  </section>

                  {/* SLIDERS DE OPACIDADE E BLUR */}
                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Mecânica de Vidro & Borda</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 glass-card p-8 border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                       <div className="space-y-6">
                          <SliderControl label="Opacidade do Fundo" value={bgOpacity} onChange={setBgOpacity} icon={<Waves size={12}/>} />
                          <SliderControl label="Opacidade da Sidebar" value={sidebarOpacity} onChange={setSidebarOpacity} icon={<Layout size={12}/>} />
                       </div>
                       <div className="space-y-6">
                          <SliderControl label="Intensidade Blur" value={glassBlur} max={40} onChange={setGlassBlur} icon={<RefreshCcw size={12}/>} />
                          <div className="space-y-4">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-black"><Layout size={12}/> Raio de Borda: {radius}px</Label>
                            <Slider value={[radius]} max={24} min={0} step={1} onValueChange={(v) => setRadius(v[0])} className="[&_[role=slider]]:bg-black" />
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* ATMOSFERA E FINALIZAÇÃO */}
                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Atmosfera & Wallpaper</Label>
                    <div className="glass-card p-8 border-2 border-black rounded-none shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row gap-6">
                       <div className="flex-1 space-y-2">
                          <Label className="text-[9px] uppercase font-black">URL do Wallpaper</Label>
                          <Input placeholder="https://..." value={wallpaper} onChange={(e) => setWallpaper(e.target.value)} className="border-2 border-black rounded-none h-12 uppercase text-[10px] font-black" />
                       </div>
                       <div className="flex gap-3 items-end">
                          <Button onClick={handleApplyHardware} className="h-12 bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black uppercase text-[10px] px-10 rounded-none shadow-[4px_4px_0px_#00D1FF] transition-all">
                             Aplicar Hardware
                          </Button>
                          <Button variant="outline" onClick={async () => { await resetWallpaper(); setWallpaper(''); toast({ title: "Reset Concluído" }); }} className="h-12 w-12 border-2 border-black rounded-none hover:bg-red-600 hover:text-white">
                             <Trash2 size={16} />
                          </Button>
                       </div>
                    </div>
                  </section>

                  {/* PRESETS */}
                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button 
                           key={p.id} 
                           onClick={() => {
                             setBgColor(p.colors.background);
                             setBgSecondaryColor(p.colors.bgSecondary);
                             setFontColor(p.colors.foreground);
                             setFontMutedColor(p.colors.fontMuted);
                             setPrimaryColor(p.colors.primary);
                             setAccentColor(p.colors.accent);
                             setRadius(p.radius);
                             applyGlobalTheme(p.colors, p.radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
                             toast({ title: `Preset ${p.name} Ativado` });
                           }} 
                           className="p-5 border-2 border-black/10 hover:border-black transition-all flex flex-col items-center gap-3 glass-card rounded-none bg-white/40"
                         >
                            <div className="w-10 h-10 border-2 border-black shadow-[2px_2px_0px_#000]" style={{ backgroundColor: p.colors.background }} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-center">{p.name.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                  </section>

                </div>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black rounded-none shadow-[10px_10px_0px_#000] animate-in slide-in-from-right-4 overflow-hidden">
                  <CardHeader className="bg-black text-white py-4 border-b-2 border-black">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Neural Mission Control</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); toast({ title: "Motor Neural Selecionado" }); }}>
                      <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade para auditorias complexas." active={iaModel === 'xai'} />
                      <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-veloz de dados e transcrição forense." active={iaModel === 'airforce'} />
                      <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real para consultoria." active={iaModel === 'groq-llama'} />
                      <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise de riscos e triagem técnica." active={iaModel === 'groq-deepseek'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'System' && (
                <Card className="bg-white border-2 border-black rounded-none shadow-[10px_10px_0px_#000] animate-in slide-in-from-right-4 overflow-hidden">
                  <CardHeader className="bg-black text-white py-4 border-b-2 border-black">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Idioma & Protocolo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <LanguageButton label="Português (BR)" lang="pt" flag="🇧🇷" active={locale === 'pt'} onClick={() => { setLocale('pt'); localStorage.setItem('lexisPredict_locale', 'pt'); window.location.reload(); }} />
                       <LanguageButton label="English (US)" lang="en" flag="🇺🇸" active={locale === 'en'} onClick={() => { setLocale('en'); localStorage.setItem('lexisPredict_locale', 'en'); window.location.reload(); }} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** COMPONENTES DE INTERFACE TÉCNICA **/

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-none border-2 font-black uppercase text-[10px] tracking-[0.2em] h-12 mb-1 transition-all", 
        active ? "bg-black text-white border-black shadow-[4px_4px_0px_#00D1FF]" : "text-muted-foreground border-transparent hover:border-black/10"
      )}
    >
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div className="space-y-3">
      <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Palette size={12}/> {label}</Label>
      <div className="flex gap-2">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-11 p-1 border-2 border-black rounded-none cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[11px] border-2 border-black rounded-none uppercase h-11 bg-white" />
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, icon, max = 100 }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-black">{icon} {label}</Label>
        <span className="text-[10px] font-black">{value}%</span>
      </div>
      <Slider value={[value]} max={max} min={0} step={1} onValueChange={(v) => onChange(v[0])} className="[&_[role=slider]]:bg-black" />
    </div>
  );
}

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-6 border-2 transition-all cursor-pointer mb-3 rounded-none", active ? "border-black bg-black/5" : "border-black/5")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} className="border-black/20" />
         <div className="text-left">
           <p className="font-black text-[11px] uppercase tracking-widest text-black">{label}</p>
           <p className="text-[10px] text-black/40 uppercase mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-black fill-black" />}
    </label>
  );
}

function LanguageButton({ label, flag, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex items-center justify-between p-6 border-2 transition-all rounded-none text-left w-full", active ? "border-black bg-black/5" : "border-black/10 bg-white hover:border-black")}>
       <div className="flex items-center gap-4">
          <span className="text-2xl">{flag}</span>
          <span className="font-black uppercase text-[11px] text-black">{label}</span>
       </div>
       {active && <Check size={16} className="text-black" />}
    </button>
  );
}
