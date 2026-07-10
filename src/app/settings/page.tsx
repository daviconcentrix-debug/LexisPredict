
"use client";

import React, { useState, useEffect } from 'react';
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
  Eye,
  Layout,
  MousePointer2,
  ShieldCheck,
  AppWindow,
  SunMoon,
  Layers
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
  
  // Neural Theme Architect
  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Operational Parameters
  const [longReadingMode, setLongReadingMode] = useState(false);
  const [cardOpacity, setCardOpacity] = useState(1);
  const [sidebarOpacity, setSidebarOpacity] = useState(1);
  const [borderRadius, setBorderRadius] = useState(4);

  // Manual Colors
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [btnBgColor, setBtnBgColor] = useState('#00D1FF');
  const [borderColor, setBorderColor] = useState('#E5E7EB');
  const [secondaryColor, setSecondaryColor] = useState('#F3F4F6');

  const [contrastRating, setContrastRating] = useState<'AAA' | 'AA' | 'FAIL'>('AAA');
  const { toast } = useToast();

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
      
      if (!theme || !theme.primary) {
        throw new Error("Resposta inválida do motor neural");
      }

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

      toast({ title: "Atmosfera Aplicada", description: theme.description });
      setThemePrompt('');
    } catch (e: any) {
      toast({ 
        title: "Motor Neural Instável", 
        description: "Não foi possível gerar o tema solicitado. Mantendo configuração atual.", 
        variant: "destructive" 
      });
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

  const updateManualSetting = (key: string, value: any, setter: any) => {
    setter(value);
    localStorage.setItem(key, String(value));
    
    const colors = {
      background: key === 'lexisPredict_bg_color' ? value : bgColor,
      foreground: key === 'lexisPredict_font_color' ? value : fontColor,
      primary: key === 'lexisPredict_btn_bg_color' ? value : btnBgColor,
      border: key === 'lexisPredict_border_color' ? value : borderColor,
      secondary: key === 'lexisPredict_secondary_color' ? value : secondaryColor,
      card: key === 'lexisPredict_bg_color' ? value : bgColor,
      accent: key === 'lexisPredict_btn_bg_color' ? value : btnBgColor,
    };

    const currentRadius = key === 'lexisPredict_border_radius' ? value : borderRadius;
    const currentLongMode = key === 'lexis_long_reading' ? value : longReadingMode;

    applyGlobalTheme(colors, currentRadius, currentLongMode);
    
    if (key === 'lexisPredict_card_opacity') {
       document.documentElement.style.setProperty('--card-opacity', String(value));
    }
    if (key === 'lexisPredict_sidebar_opacity') {
       document.documentElement.style.setProperty('--sidebar-opacity', String(value));
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">Configurações de Gabinete</h1>
            <Badge variant="outline" className="border-primary text-primary text-[9px] uppercase font-bold tracking-widest px-3 py-1">Mission Control v7.0</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handlePresetChange(AUTHORITY_PRESETS[0])} className="text-[10px] font-bold uppercase tracking-widest hover:text-primary">
            <RotateCcw size={12} className="mr-2" /> Restaurar Fábrica
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <aside className="space-y-1">
              <NavButton active={activeTab === 'Style'} onClick={() => setActiveTab('Style')} icon={<Palette size={14}/>} label="Interface Visual" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              <NavButton active={activeTab === 'System'} onClick={() => setActiveTab('System')} icon={<Globe size={14}/>} label="Sistema & Idioma" />
            </aside>

            <div className="md:col-span-3 space-y-10 pb-20">
              {activeTab === 'Style' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* AI ARCHITECT */}
                  <Card className="bg-black border-2 border-primary/20 rounded-none shadow-[10px_10px_0px_rgba(0,209,255,0.1)]">
                    <CardHeader className="py-4 border-b border-primary/10">
                      <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <Sparkles size={16} /> Neural Theme Architect
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          <Input 
                            placeholder="DESCREVA O TEMA (EX: LEWIS HAMILTON NA FERRARI)..." 
                            value={themePrompt}
                            onChange={(e) => setThemePrompt(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white font-black uppercase text-[10px] h-12 rounded-none focus-visible:ring-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyNeuralTheme()}
                          />
                          <Button 
                            onClick={handleApplyNeuralTheme}
                            disabled={isGeneratingTheme || !themePrompt.trim()}
                            className="h-12 px-8 bg-primary text-black font-black uppercase text-[10px] rounded-none hover:bg-primary/90 transition-all shadow-[4px_4px_0px_#000] hover:shadow-none"
                          >
                            {isGeneratingTheme ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                          O Grok analisará seu pedido e projetará um sistema harmônico validado contra WCAG AAA.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* LIVE PREVIEW - ALTA FIDELIDADE */}
                  <Card className="bg-card border-border/50 rounded-none overflow-hidden shadow-lg">
                    <CardHeader className="bg-secondary/30 border-b border-border/30 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
                        <Eye size={14} className="text-primary" /> Live Telemetry Preview
                      </CardTitle>
                      <Badge className={cn("text-[9px] font-bold uppercase border-none", 
                        contrastRating === 'FAIL' ? "bg-destructive text-white" : "bg-primary/20 text-primary"
                      )}>
                        {contrastRating === 'FAIL' ? <AlertTriangle size={10} className="mr-1"/> : <CheckCircle2 size={10} className="mr-1"/>}
                        Contraste {contrastRating}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-10 bg-background flex items-center justify-center min-h-[350px] border-b border-border/30">
                       <div style={{ borderRadius: `${borderRadius}px`, opacity: cardOpacity }} className="w-full max-w-md p-8 border border-border bg-card shadow-2xl transition-all duration-300">
                          <div className="flex items-center gap-4 mb-6">
                             <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-sm transition-all shadow-sm">
                                <Layout size={20} className="text-primary-foreground" />
                             </div>
                             <h4 className="font-bold uppercase text-xs tracking-widest text-foreground">Gabinete Real-Time</h4>
                          </div>
                          <div className="text-[11px] font-medium uppercase leading-relaxed tracking-wider mb-8 text-muted-foreground">
                             Esta simulação reflete fielmente o comportamento dos botões primários e secundários em todo o ecossistema.
                          </div>
                          <div className="flex gap-4">
                             <Button className="px-6 h-10 text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 rounded-sm">
                               Primary Action
                             </Button>
                             <Button variant="outline" className="px-6 h-10 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-accent hover:text-accent-foreground rounded-sm">
                               Secondary Action
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>

                  {/* PRESETS */}
                  <section className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Authority Series Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                       {AUTHORITY_PRESETS.map((p) => (
                         <button 
                          key={p.id} 
                          onClick={() => handlePresetChange(p)}
                          className={cn(
                            "p-4 bg-card border transition-all text-center flex flex-col items-center gap-3 rounded-none group hover:border-primary",
                            bgColor === p.colors.background ? "border-primary ring-1 ring-primary/20" : "border-border/50"
                          )}
                         >
                            <div className="w-8 h-8 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: p.colors.background }}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-60 group-hover:opacity-100 transition-colors">{p.name.split(' ')[0]}</span>
                         </button>
                       ))}
                    </div>
                  </section>

                  {/* HARDWARE PARAMETERS */}
                  <Card className="bg-card border-border/50 rounded-none shadow-sm">
                    <CardHeader className="border-b border-border/30 py-4">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest">Parâmetros de Hardware</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                       <div className="flex items-center justify-between p-4 bg-secondary/20 border border-border/50">
                          <div className="flex items-center gap-4">
                             <div className="p-2 bg-primary/10 rounded-none text-primary">
                                <Monitor size={18} />
                             </div>
                             <div>
                                <p className="font-bold text-[11px] uppercase tracking-widest">Long Duration Protocol</p>
                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Otimiza o contraste e reduz a fadiga para sessões prolongadas.</p>
                             </div>
                          </div>
                          <Switch checked={longReadingMode} onCheckedChange={(c) => updateManualSetting('lexis_long_reading', c, setLongReadingMode)} />
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-4">
                          <div className="space-y-6">
                             <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center justify-between">Geometria de Bordas ({borderRadius}px)</Label>
                             <Slider value={[borderRadius]} onValueChange={([v]) => updateManualSetting('lexisPredict_border_radius', v, setBorderRadius)} max={16} step={1} />
                          </div>
                          <div className="space-y-6">
                             <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center justify-between">Opacidade de Hardware ({Math.round(cardOpacity * 100)}%)</Label>
                             <Slider value={[cardOpacity]} onValueChange={([v]) => updateManualSetting('lexisPredict_card_opacity', v, setCardOpacity)} max={1} step={0.01} />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                          <ColorInput label="Fundo (Background)" value={bgColor} onChange={(v) => updateManualSetting('lexisPredict_bg_color', v, setBgColor)} />
                          <ColorInput label="Fonte (Text)" value={fontColor} onChange={(v) => updateManualSetting('lexisPredict_font_color', v, setFontColor)} />
                          <ColorInput label="Ação Primária" value={btnBgColor} onChange={(v) => updateManualSetting('lexisPredict_btn_bg_color', v, setBtnBgColor)} />
                          <ColorInput label="Ação Secundária" value={secondaryColor} onChange={(v) => updateManualSetting('lexisPredict_secondary_color', v, setSecondaryColor)} />
                          <ColorInput label="Bordas (Borders)" value={borderColor} onChange={(v) => updateManualSetting('lexisPredict_border_color', v, setBorderColor)} />
                       </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-card border-border/50 rounded-none shadow-sm">
                  <CardHeader className="border-b border-border/30 py-6">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.15em]">Orquestrador Neural (Pentade)</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest opacity-60">Seleção de modelos para auditoria e análise de gabinete.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                      <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior e precisão forense." active={iaModel === 'xai'} />
                      <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Velocidade extrema para fatiamento de dados." active={iaModel === 'airforce'} />
                      <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Linguagem natural de ultra-baixa latência." active={iaModel === 'groq-llama'} />
                      <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Pensamento profundo e lógica estruturada." active={iaModel === 'groq-deepseek'} />
                      <EngineOption id="puter" label="PUTER AI" desc="Operação local para tarefas de baixa complexidade." active={iaModel === 'puter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'System' && (
                <Card className="bg-card border-border/50 rounded-none shadow-sm">
                  <CardHeader className="border-b border-border/30 py-6">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Idioma e Localização</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={locale} onValueChange={(val) => updateManualSetting('lexisPredict_locale', val, setLocale)}>
                       <label htmlFor="pt" className={cn("p-4 border rounded-none cursor-pointer flex items-center gap-3", locale === 'pt' ? "border-primary bg-primary/10" : "border-border/50")}>
                         <RadioGroupItem value="pt" id="pt" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Português (Brasil)</span>
                       </label>
                       <label htmlFor="en" className={cn("p-4 border rounded-none cursor-pointer flex items-center gap-3", locale === 'en' ? "border-primary bg-primary/10" : "border-border/50")}>
                         <RadioGroupItem value="en" id="en" />
                         <span className="text-[10px] font-black uppercase tracking-widest">English (US)</span>
                       </label>
                    </RadioGroup>
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

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button 
      variant="ghost"
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-none font-bold uppercase text-[10px] tracking-widest h-10 transition-all border-none", 
        active ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      )}
    >
      <span className="mr-3">{icon}</span> {label}
    </Button>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</Label>
      <div className="flex items-center gap-2 p-1 bg-background border border-border/50 rounded-none transition-all hover:border-primary">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-8 h-8 bg-transparent border-none cursor-pointer p-0"
        />
        <span className="text-[10px] font-mono uppercase font-bold">{value}</span>
      </div>
    </div>
  );
}

function EngineOption({ id, label, desc, active }: { id: string, label: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 border rounded-none cursor-pointer transition-all", active ? "border-primary bg-primary/10" : "border-border/50 hover:border-border")}>
      <div className="flex items-center gap-4">
         <RadioGroupItem value={id} id={id} />
         <div>
           <p className="font-bold text-[11px] uppercase">{label}</p>
           <p className="text-[9px] text-muted-foreground uppercase">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-primary fill-primary" />}
    </label>
  );
}
