"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Check,
  Zap,
  Layout,
  Crown,
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  ShieldCheck,
  Loader2,
  ImageIcon,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AUTHORITY_PRESETS, applyGlobalTheme, applyWallpaper } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { generateFullBackupAction, restoreBackupAction } from '@/app/actions/case-actions';
import Image from 'next/image';

const PREDEFINED_WALLPAPERS = [
  { id: 'carbon', name: 'Carbon Fiber', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  { id: 'desk', name: 'Executive Desk', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop' },
  { id: 'library', name: 'Legal Library', url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop' },
  { id: 'abstract', name: 'Noir Abstract', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop' }
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Style');
  const [iaModel, setIaModel] = useState('xai');
  const [locale, setLocale] = useState('pt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customWpUrl, setCustomWpUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom theme states
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [primaryColor, setPrimaryColor] = useState('#00D1FF');
  const [radius, setRadius] = useState(4);

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setLocale(localStorage.getItem('lexisPredict_locale') || 'pt');
    
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
    setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
    setPrimaryColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
    setRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));
    setCustomWpUrl(localStorage.getItem('lexisPredict_wallpaper') || '');
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLocale(lang);
    localStorage.setItem('lexisPredict_locale', lang);
    toast({ title: "Idioma Alterado", description: "Sincronizando ambiente..." });
    setTimeout(() => window.location.reload(), 800);
  };

  const handlePresetChange = (preset: any) => {
    if (!preset) return;
    setBgColor(preset.colors.background);
    setFontColor(preset.colors.foreground);
    setPrimaryColor(preset.colors.primary);
    setRadius(preset.radius);
    applyGlobalTheme(preset);
    toast({ title: `${preset.name} Ativado`, description: preset.description });
  };

  const handleWallpaperChange = (url: string) => {
    applyWallpaper(url);
    setCustomWpUrl(url);
    toast({ title: url ? "Wallpaper Aplicado" : "Wallpaper Removido" });
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
    
    const customPreset = {
      id: 'custom-manual',
      name: 'Custom Hardware',
      colors: customColors,
      radius: radius
    };
    
    applyGlobalTheme(customPreset);
    toast({ title: "Configuração Manual Aplicada" });
  };

  const handleExportBackup = async () => {
    setIsProcessing(true);
    try {
      const backup = await generateFullBackupAction();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LexisPredict_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast({ title: "Backup Gerado", description: "Repositório exportado com sucesso." });
    } catch (e) {
      toast({ title: "Falha no Backup", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = await restoreBackupAction(json.data);
        if (result.success) {
          toast({ title: "Base Restaurada", description: "Sincronizando gabinete..." });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error(result.message);
        }
      } catch (err: any) {
        toast({ title: "Falha na Importação", description: "Arquivo corrompido ou inválido.", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
             <h1 className="font-black text-sm tracking-[0.2em] uppercase text-foreground">Gabinete Mission Control</h1>
             <Badge variant="outline" className="border-primary text-primary text-[9px] uppercase font-black tracking-[0.3em]">Elite v32.0</Badge>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportBackup} 
                disabled={isProcessing}
                className="hidden sm:flex h-9 border-2 border-primary text-primary font-black uppercase text-[10px] px-6 hover:bg-primary hover:text-primary-foreground transition-all"
             >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />}
                Quick Backup
             </Button>
             <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-foreground hover:bg-primary hover:text-primary-foreground border-2 border-border h-10 w-10">
                <Zap size={16} />
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <aside className="space-y-2">
              <NavButton active={activeTab === 'Style'} onClick={() => setActiveTab('Style')} icon={<Palette size={14}/>} label="Hardware Visual" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              <NavButton active={activeTab === 'System'} onClick={() => setActiveTab('System')} icon={<Database size={14}/>} label="Infraestrutura" />
            </aside>

            <div className="md:col-span-3 space-y-12 pb-20">
              {activeTab === 'Style' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-foreground">Seletor de Autoridade (Presets)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       <button 
                        onClick={() => handlePresetChange(AUTHORITY_PRESETS.find(p => p.id === 'executive-aston'))}
                        className="group relative p-6 bg-[#0a0a0a] border-2 border-[#c9a227]/20 hover:border-[#c9a227] transition-all text-left overflow-hidden rounded-none"
                       >
                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                            <Crown className="text-[#c9a227]" size={20} />
                          </div>
                          <h4 className="text-[#c9a227] font-black text-xs uppercase tracking-widest mb-1">Executivo</h4>
                          <p className="text-white/40 text-[9px] uppercase font-bold">Matte & Dourado</p>
                       </button>

                       <button 
                        onClick={() => handlePresetChange(AUTHORITY_PRESETS.find(p => p.id === 'minimal-steel'))}
                        className="group relative p-6 bg-white border-2 border-gray-100 hover:border-blue-400 transition-all text-left rounded-none"
                       >
                          <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Sun className="text-gray-400" size={16} />
                          </div>
                          <h4 className="text-black font-black text-xs uppercase tracking-widest mb-1">Padrão</h4>
                          <p className="text-black/40 text-[9px] uppercase font-bold">Aço Minimalista</p>
                       </button>

                       <button 
                        onClick={() => handlePresetChange(AUTHORITY_PRESETS.find(p => p.id === 'midnight-pro'))}
                        className="group relative p-6 bg-[#020617] border-2 border-indigo-500/20 hover:border-indigo-500 transition-all text-left rounded-none"
                       >
                          <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Moon className="text-indigo-400" size={16} />
                          </div>
                          <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-1">Nocturno</h4>
                          <p className="text-white/40 text-[9px] uppercase font-bold">Deep Indigo</p>
                       </button>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-foreground">Wallpaper de Gabinete</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {PREDEFINED_WALLPAPERS.map((wp) => (
                        <button 
                          key={wp.id} 
                          onClick={() => handleWallpaperChange(wp.url)}
                          className={cn(
                            "relative aspect-video border-2 overflow-hidden transition-all rounded-none",
                            customWpUrl === wp.url ? "border-primary scale-[0.98]" : "border-border/40 hover:border-primary/50"
                          )}
                        >
                          <Image src={wp.url} alt={wp.name} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-white uppercase">{wp.name}</span>
                          </div>
                          {customWpUrl === wp.url && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground p-0.5">
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 w-4 h-4" />
                        <Input 
                          placeholder="URL DO WALLPAPER CUSTOMIZADO..." 
                          value={customWpUrl} 
                          onChange={(e) => setCustomWpUrl(e.target.value)} 
                          className="pl-10 h-12 border-2 border-border font-black uppercase text-[10px] rounded-none bg-background" 
                        />
                      </div>
                      <Button onClick={() => handleWallpaperChange(customWpUrl)} className="bg-primary text-primary-foreground font-black uppercase h-12 px-8 rounded-none">Aplicar</Button>
                      <Button variant="ghost" onClick={() => handleWallpaperChange('')} className="border-2 border-border h-12 px-4 rounded-none text-foreground"><X size={16} /></Button>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-foreground">Custom Hardware Overrides</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-card p-6 border-2 border-border rounded-none shadow-md">
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Fundo (Background)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs bg-background" />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold">Destaque (Primary)</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs bg-background" />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold flex items-center gap-2"><Layout size={12}/> Raio de Borda (Radius: {radius}px)</Label>
                            <Input type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="accent-primary" />
                          </div>
                          <Button onClick={handleManualApply} className="w-full bg-primary text-primary-foreground font-black uppercase text-[10px] h-12 mt-4 transition-all rounded-none shadow-[4px_4px_0px_#000]">
                             Aplicar Modificações
                          </Button>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <div className="bg-card border-2 border-border rounded-none p-8 animate-in slide-in-from-right-4 shadow-xl">
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2"><Cpu size={18} className="text-primary" /> Pentade Neural Mission Control</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Selecione o motor de IA principal para as operações de gabinete.</p>
                  </div>
                  <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); }}>
                    <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade." active={iaModel === 'xai'} />
                    <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-veloz de dados." active={iaModel === 'airforce'} />
                    <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real." active={iaModel === 'groq-llama'} />
                    <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise forense." active={iaModel === 'groq-deepseek'} />
                  </RadioGroup>
                </div>
              )}

              {activeTab === 'System' && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                   <div className="bg-card border-2 border-border p-8 rounded-none shadow-xl space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Database size={18} className="text-primary" /> Infraestrutura de Dados</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Gestão de redundância e backups do gabinete.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="p-6 bg-muted/30 border-2 border-dashed border-border space-y-4">
                            <div className="w-10 h-10 bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
                               <Download size={20} />
                            </div>
                            <h4 className="font-black text-[11px] uppercase">Exportação Forense</h4>
                            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-bold">Baixe um arquivo JSON com todos os processos e notas estratégicas para backup offline.</p>
                            <Button 
                              onClick={handleExportBackup} 
                              disabled={isProcessing}
                              className="w-full h-10 bg-primary text-primary-foreground font-black uppercase text-[9px] rounded-none"
                            >
                               {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Download size={14} className="mr-2" />}
                               Gerar Backup Global
                            </Button>
                         </div>

                         <div className="p-6 bg-muted/30 border-2 border-dashed border-border space-y-4">
                            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                               <Upload size={20} />
                            </div>
                            <h4 className="font-black text-[11px] uppercase">Restauração de Base</h4>
                            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-bold">Injete um arquivo de backup anterior para restaurar o estado completo do gabinete.</p>
                            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportBackup} />
                            <Button 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="w-full h-10 border-2 border-border font-black uppercase text-[9px] rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                               {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                               Restaurar do Arquivo
                            </Button>
                         </div>
                      </div>

                      <div className="p-6 bg-primary/5 border-2 border-primary/20 flex gap-4 items-center">
                         <ShieldCheck className="text-primary" size={24} />
                         <div>
                            <p className="text-[10px] font-black uppercase text-primary">Compliance de Dados W1 Capital</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Seus dados são isolados por tenant e protegidos por criptografia em repouso no Supabase.</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleLanguageChange('pt')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all rounded-none text-left bg-card shadow-md",
                            locale === 'pt' ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇧🇷</span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-foreground">Português (Brasil)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Idioma Nativo</p>
                            </div>
                          </div>
                          {locale === 'pt' && <Check size={16} className="text-primary" />}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('en')}
                          className={cn(
                            "flex items-center justify-between p-5 border-2 transition-all rounded-none text-left bg-card shadow-md",
                            locale === 'en' ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">🇺🇸</span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-foreground">English (US)</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">International Protocol</p>
                            </div>
                          </div>
                          {locale === 'en' && <Check size={16} className="text-primary" />}
                        </button>
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
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-none font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all", 
        active ? "bg-primary text-primary-foreground shadow-md border-l-4 border-primary-foreground" : "text-muted-foreground hover:bg-muted"
      )}
    >
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 border-2 transition-all cursor-pointer mb-3 rounded-none bg-background hover:border-primary", active ? "border-primary bg-primary/5" : "border-border/50")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} className="border-primary" />
         <div className="text-left">
           <p className="font-black text-[10px] uppercase tracking-widest text-foreground">{label}</p>
           <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-primary fill-current" />}
    </label>
  );
}
