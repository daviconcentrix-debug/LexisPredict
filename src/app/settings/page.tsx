
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Globe,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Sparkles,
  Loader2,
  Layout,
  ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  ShieldCheck,
  MousePointer2,
  Languages,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, getIdealTextColor, getAccessibilityRating } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Locale } from '@/lib/i18n';
import { AUTHORITY_PRESETS, applyGlobalTheme } from '@/lib/theme';
import { generateNeuralTheme } from '@/ai/flows/theme-architect-flow';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Style');
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState<Locale>('pt');
  
  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  const [longReadingMode, setLongReadingMode] = useState(false);
  const [cardOpacity, setCardOpacity] = useState(1);
  const [sidebarOpacity, setSidebarOpacity] = useState(1);
  const [borderRadius, setBorderRadius] = useState(4);
  const [wallpaper, setWallpaper] = useState('');
  const [wallpaperBrightness, setWallpaperBrightness] = useState(1);

  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [btnBgColor, setBtnBgColor] = useState('#00D1FF');
  const [borderColor, setBorderColor] = useState('#E5E7EB');
  const [secondaryColor, setSecondaryColor] = useState('#F3F4F6');

  const [contrastRating, setContrastRating] = useState<'AAA' | 'AA' | 'FAIL'>('AAA');
  const { toast } = useToast();
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const loadSettings = () => {
      setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
      setLocale((localStorage.getItem('lexisPredict_locale') as any) || 'pt');
      setCardOpacity(parseFloat(localStorage.getItem('lexisPredict_card_opacity') || '1'));
      setSidebarOpacity(parseFloat(localStorage.getItem('lexisPredict_sidebar_opacity') || '1'));
      setBorderRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));
      setLongReadingMode(localStorage.getItem('lexis_long_reading') === 'true');
      setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
      setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
      setBtnBgColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
      setBorderColor(localStorage.getItem('lexisPredict_border_color') || '#E5E7EB');
      setSecondaryColor(localStorage.getItem('lexisPredict_secondary_color') || '#F3F4F6');
      setWallpaper(localStorage.getItem('lexisPredict_wallpaper') || '');
      setWallpaperBrightness(parseFloat(localStorage.getItem('lexisPredict_wallpaper_brightness') || '1'));
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (mounted) {
      setContrastRating(getAccessibilityRating(bgColor, fontColor));
    }
  }, [bgColor, fontColor, mounted]);

  const handleApplyNeuralTheme = async () => {
    if (!themePrompt.trim() || isGeneratingTheme) return;
    setIsGeneratingTheme(true);
    
    try {
      const theme = await generateNeuralTheme(themePrompt);
      
      setBgColor(theme.background);
      setFontColor(theme.foreground);
      setBtnBgColor(theme.primary);
      setSecondaryColor(theme.secondary);
      setBorderColor(theme.border);
      setBorderRadius(theme.radius);

      applyGlobalTheme({
        background: theme.background,
        foreground: theme.foreground,
        primary: theme.primary,
        secondary: theme.secondary,
        border: theme.border,
        card: theme.background,
        accent: theme.primary
      }, theme.radius, longReadingMode);

      toast({ title: "Atmosfera Neural Aplicada", description: theme.description });
      setThemePrompt('');
    } catch (e: any) {
      toast({ title: "Motor Neural Instável", description: "Ativando modo de segurança...", variant: "destructive" });
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handlePresetChange = (preset: typeof AUTHORITY_PRESETS[0]) => {
    setBgColor(preset.colors.background);
    setFontColor(preset.colors.foreground);
    setBtnBgColor(preset.colors.primary);
    setBorderColor(preset.colors.border);
    setSecondaryColor(preset.colors.secondary);
    setBorderRadius(preset.radius);

    applyGlobalTheme(preset.colors, preset.radius, longReadingMode);
    toast({ title: `${preset.name} Ativado` });
  };

  const handleLanguageChange = (newLang: string) => {
    const lang = newLang.startsWith('pt') ? 'pt' : 'en';
    setLocale(lang as any);
    localStorage.setItem('lexisPredict_locale', lang);
    toast({ title: "Idioma Alterado", description: "Sincronizando fuso horário do gabinete..." });
    setTimeout(() => window.location.reload(), 800);
  };

  const handleLocalWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        updateManualSetting('lexisPredict_wallpaper', result, setWallpaper);
        toast({ title: "Atmosfera Local Sincronizada" });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateManualSetting = (key: string, value: any, setter: any) => {
    setter(value);
    localStorage.setItem(key, String(value));
    
    if (key.includes('color')) {
      const colors = {
        background: key === 'lexisPredict_bg_color' ? value : bgColor,
        foreground: key === 'lexisPredict_font_color' ? value : fontColor,
        primary: key === 'lexisPredict_btn_bg_color' ? value : btnBgColor,
        border: key === 'lexisPredict_border_color' ? value : borderColor,
        secondary: key === 'lexisPredict_secondary_color' ? value : secondaryColor,
        card: key === 'lexisPredict_bg_color' ? value : bgColor,
        accent: key === 'lexisPredict_btn_bg_color' ? value : btnBgColor,
      };
      applyGlobalTheme(colors, borderRadius, longReadingMode);
    }

    if (key === 'lexisPredict_border_radius') document.documentElement.style.setProperty('--radius', `${value}px`);
    if (key === 'lexisPredict_card_opacity') document.documentElement.style.setProperty('--card-opacity', String(value));
    if (key === 'lexisPredict_sidebar_opacity') document.documentElement.style.setProperty('--sidebar-opacity', String(value));
    if (key === 'lexisPredict_wallpaper') {
       document.documentElement.style.backgroundImage = value ? `url(${value})` : 'none';
       document.documentElement.style.backgroundSize = 'cover';
       document.documentElement.style.backgroundAttachment = 'fixed';
    }
    if (key === 'lexisPredict_wallpaper_brightness') document.documentElement.style.setProperty('--wallpaper-brightness', String(value));
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background/90 font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
            <Badge variant="outline" className="border-primary text-primary text-[9px] uppercase font-bold tracking-[0.3em] px-3 py-1">Elite v10.5</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handlePresetChange(AUTHORITY_PRESETS[0])} className="text-[10px] font-bold uppercase tracking-widest hover:text-primary">
            <RotateCcw size={12} className="mr-2" /> Reset Factory
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <aside className="space-y-1">
              <NavButton active={activeTab === 'Style'} onClick={() => setActiveTab('Style')} icon={<Palette size={14}/>} label="Hardware Visual" />
              <NavButton active={activeTab === 'Wallpaper'} onClick={() => setActiveTab('Wallpaper')} icon={<ImageIcon size={14}/>} label="Atmosfera (Fundo)" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              <NavButton active={activeTab === 'System'} onClick={() => setActiveTab('System')} icon={<Globe size={14}/>} label="Localização" />
            </aside>

            <div className="md:col-span-3 space-y-12 pb-24">
              {activeTab === 'Style' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <Card className="bg-black border-2 border-primary/20 rounded-none">
                    <CardHeader className="py-4 border-b border-primary/10">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                        <Sparkles size={16} /> Neural Theme Architect
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Input 
                          placeholder="EX: LEWIS HAMILTON NA FERRARI..." 
                          value={themePrompt}
                          onChange={(e) => setThemePrompt(e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white font-black uppercase text-[10px] h-12 rounded-none focus-visible:ring-primary"
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyNeuralTheme()}
                        />
                        <Button onClick={handleApplyNeuralTheme} disabled={isGeneratingTheme || !themePrompt.trim()} className="h-12 px-10 bg-primary text-black font-black uppercase text-[10px] rounded-none">
                          {isGeneratingTheme ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Telemetry Preview</Label>
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                      {wallpaper && (
                        <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-20" style={{ backgroundImage: `url(${wallpaper})`, filter: `brightness(${wallpaperBrightness})` }} />
                      )}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded-sm" />
                            <span className="text-sm font-medium text-foreground uppercase tracking-tight">GABINETE REAL-TIME</span>
                          </div>
                          <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                            CONTRASTE AAA
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 uppercase font-bold tracking-widest leading-relaxed">
                          Esta simulação reflete fielmente o comportamento dos botões primários e secundários.
                        </p>
                        <div className="flex gap-3">
                          <button className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.985]">
                            PRIMARY ACTION
                          </button>
                          <button className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border border-border text-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.985]">
                            SECONDARY ACTION
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Series Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button key={p.id} onClick={() => handlePresetChange(p)} className={cn("p-4 border-2 transition-all flex flex-col items-center gap-3 rounded-none bg-card", bgColor === p.colors.background ? "border-primary ring-2 ring-primary/10" : "border-border/50")}>
                            <div className="w-8 h-8 rounded-full border border-black/5" style={{ backgroundColor: p.colors.background }}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{p.name.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Wallpaper' && (
                <div className="space-y-12 animate-in slide-in-from-right-4">
                  <Card className="bg-card border-border/50 rounded-none">
                    <CardHeader className="py-6 border-b border-border/30">
                      <CardTitle className="text-xs font-black uppercase tracking-[0.3em]">Atmosfera de Gabinete</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase opacity-60">Upload de Imagem Local</Label>
                            <div onClick={() => wallpaperInputRef.current?.click()} className="border-2 border-dashed border-border/50 p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/30 transition-all rounded-none group">
                              <Upload size={24} className="mb-2 opacity-40 group-hover:text-primary transition-all" />
                              <p className="text-[9px] font-black uppercase">Sincronizar Arquivo</p>
                              <input type="file" accept="image/*" className="hidden" ref={wallpaperInputRef} onChange={handleLocalWallpaperUpload} />
                            </div>
                         </div>
                         <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase opacity-60">URL Customizada</Label>
                            <Input value={wallpaper.startsWith('data:') ? 'IMAGEM LOCAL ATIVA' : wallpaper} onChange={(e) => updateManualSetting('lexisPredict_wallpaper', e.target.value, setWallpaper)} placeholder="HTTPS://..." className="bg-secondary/20 border-border h-11 text-[10px] font-black uppercase" />
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-black uppercase">
                                  <span>Brilho da Atmosfera</span>
                                  <span>{Math.round(wallpaperBrightness * 100)}%</span>
                               </div>
                               <Slider value={[wallpaperBrightness]} onValueChange={([v]) => updateManualSetting('lexisPredict_wallpaper_brightness', v, setWallpaperBrightness)} min={0.1} max={1.2} step={0.01} />
                            </div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-[#0F1117] border border-white/10 rounded-2xl p-5 animate-in slide-in-from-right-4">
                  <CardHeader className="py-4 border-b border-white/5">
                    <CardTitle className="text-sm font-semibold text-white uppercase tracking-widest">Pentade Neural Mission Control</CardTitle>
                    <CardDescription className="text-[11px] text-white/50 uppercase">Selecione o motor de IA principal para auditorias.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                      <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade para auditorias complexas." active={iaModel === 'xai'} />
                      <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-rápido de grandes volumes de dados." active={iaModel === 'airforce'} />
                      <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real com baixa latência." active={iaModel === 'groq-llama'} />
                      <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise de riscos e casos críticos." active={iaModel === 'groq-deepseek'} />
                      <EngineOption id="puter" label="PUTER AI" desc="Operação local e edge para privacidade e redundância." active={iaModel === 'puter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'System' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-widest">Idioma do Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleLanguageChange('pt-BR')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          locale === 'pt' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇧🇷</span>
                          <div className="text-left">
                            <div className="font-medium text-sm uppercase">Português (Brasil)</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Idioma padrão</div>
                          </div>
                        </div>
                        {locale === 'pt' && <div className="text-primary"><Check size={16} /></div>}
                      </button>

                      <button
                        onClick={() => handleLanguageChange('en-US')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          locale === 'en' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🇺🇸</span>
                          <div className="text-left">
                            <div className="font-medium text-sm uppercase">English (United States)</div>
                            <div className="text-[10px] text-muted-foreground uppercase">International Protocol</div>
                          </div>
                        </div>
                        {locale === 'en' && <div className="text-primary"><Check size={16} /></div>}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                      <div>
                        <div className="font-medium text-sm uppercase tracking-widest">Fuso Horário Operacional</div>
                        <div className="text-[10px] text-muted-foreground uppercase mt-1">América/São Paulo (BRT - UTC-3)</div>
                      </div>
                      <div className="text-[9px] px-3 py-1 rounded-full bg-muted text-muted-foreground font-black uppercase">
                        Automático
                      </div>
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

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn("w-full justify-start rounded-none font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all relative border-none", active ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:bg-secondary/30")}>
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />}
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function EngineOption({ id, label, desc, active }: { id: string, label: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn(
      "flex items-center justify-between p-4 border transition-all cursor-pointer mb-2 rounded-xl",
      active ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.015]"
    )}>
      <div className="flex items-center gap-4">
         <RadioGroupItem value={id} id={id} className="border-white/20" />
         <div>
           <p className="font-bold text-xs text-white uppercase tracking-tight">{label}</p>
           <p className="text-[10px] text-white/50 uppercase mt-0.5 leading-tight">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-primary fill-primary animate-pulse" />}
    </label>
  );
}
