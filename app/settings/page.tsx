
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Archive,
  Lock,
  Shield,
  Download,
  Loader2,
  Code2,
  Waves,
  Layout,
  RefreshCcw,
  Zap,
  CheckCircle2,
  Activity,
  Server,
  Image as ImageIcon,
  Plus,
  Trash2,
  KeyRound,
  FileArchive
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
  applyWallpaperUrl, 
  resetWallpaper, 
  loadVisualStateFromStorage,
  saveWallpaperFile
} from '@/lib/visual-hardware';
import { exportFullSourceCodeAction } from '@/app/actions/system-actions';
import { saveAs } from 'file-saver';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Hardware');
  
  // Cores
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgSecondaryColor, setBgSecondaryColor] = useState('#F3F4F6');
  const [fontColor, setFontColor] = useState('#0A0A0A');
  const [fontMutedColor, setFontMutedColor] = useState('#6B7280');
  const [primaryColor, setPrimaryColor] = useState('#00D1FF');
  const [accentColor, setAccentColor] = useState('#E5E7EB');
  const [radius, setRadius] = useState(4);
  
  // Atmosfera
  const [bgOpacity, setBgOpacity] = useState(85);
  const [sidebarOpacity, setSidebarOpacity] = useState(90);
  const [glassBlur, setGlassBlur] = useState(8);
  const [wallpaper, setWallpaper] = useState('');
  
  // IA
  const [iaModel, setIaModel] = useState('xai');
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);

  // Export
  const [exportPassword, setExportPassword] = useState('');
  const [isExportUnlocked, setIsExportUnlocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setIsMasterUnlocked(localStorage.getItem('lexis_master_unlock') === 'true');
    
    // Carregar cores salvas
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#FFFFFF');
    setBgSecondaryColor(localStorage.getItem('lexisPredict_bg_secondary_color') || '#F3F4F6');
    setFontColor(localStorage.getItem('lexisPredict_font_color') || '#0A0A0A');
    setFontMutedColor(localStorage.getItem('lexisPredict_font_muted_color') || '#6B7280');
    setPrimaryColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#00D1FF');
    setAccentColor(localStorage.getItem('lexisPredict_btn_inactive_color') || '#E5E7EB');
    setRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '4'));

    // Carregar Atmosfera
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
      border: fontColor
    };
    applyGlobalTheme(customColors, radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
    if (wallpaper) applyWallpaperUrl(wallpaper);
    toast({ title: "Hardware Visual Aplicado", description: "Configurações sincronizadas no root." });
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await saveWallpaperFile(file);
      setWallpaper(url);
      toast({ title: "Wallpaper Customizado Salvo" });
    }
  };

  const handleUnlockExport = () => {
    // Senha Mestre de Ativação Soberana
    if (exportPassword === 'Abaira@185') {
      setIsExportUnlocked(true);
      toast({ title: "Acesso Autorizado", description: "Portal de Exportação Master liberado." });
    } else {
      toast({ title: "Acesso Negado", description: "Senha de ativação incorreta.", variant: "destructive" });
    }
  };

  const handleFullBackupZip = async () => {
    setIsExporting(true);
    toast({ title: "Iniciando Compilação Sênior", description: "Preparando arquivos de código, manifesto e chaves..." });
    
    try {
      const result = await exportFullSourceCodeAction();
      if (result.success && result.base64) {
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/zip" });
        
        // Nomeação dinâmica profissional
        saveAs(blob, result.filename || `LexisPredict_FullProject_v500.zip`);
        
        toast({ 
          title: "Exportação Concluída", 
          description: "O arquivo ZIP está pronto. Utilize a senha Ashley@25472053 para manipulação interna." 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Erro na Exportação", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-transparent font-sans text-foreground overflow-hidden relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden glass-panel">
        <header className="h-16 border-b border-border bg-background/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <h1 className="font-black text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
          </div>
          <Badge variant="outline" className="text-primary text-[9px] uppercase font-black tracking-[0.3em] rounded-none px-3 py-1 border-primary/50">Elite Hardware v25.0</Badge>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <aside className="space-y-1">
              <NavButton active={activeTab === 'Hardware'} onClick={() => setActiveTab('Hardware')} icon={<Palette size={14}/>} label="Hardware Visual" />
              <NavButton active={activeTab === 'Engine'} onClick={() => setActiveTab('Engine')} icon={<Cpu size={14}/>} label="Núcleo Neural" />
              {isMasterUnlocked && (
                <NavButton active={activeTab === 'Export'} onClick={() => setActiveTab('Export')} icon={<Archive size={14}/>} label="Exportação Master" />
              )}
            </aside>

            <div className="md:col-span-3 space-y-12 pb-20">
              {activeTab === 'Hardware' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Presets</Label>
                       <Button variant="ghost" onClick={handleApplyHardware} className="h-8 text-[10px] font-black uppercase hover:bg-primary hover:text-black">
                         <RefreshCcw size={12} className="mr-2"/> Sincronizar Tudo
                       </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                             toast({ title: `Tema ${p.name} Ativado` });
                           }} 
                           className={cn(
                             "p-4 border border-border hover:border-primary/50 transition-all flex flex-col items-center gap-3 bg-background/20 backdrop-blur-md rounded-lg relative overflow-hidden group",
                             bgColor === p.colors.background && "border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                           )}
                         >
                            <div className="w-10 h-10 rounded-md border border-border group-hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: p.colors.background }}>
                               <div className="w-full h-1/2 rounded-t-md" style={{ backgroundColor: p.colors.primary }} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{p.name}</span>
                            {bgColor === p.colors.background && <CheckCircle2 className="absolute top-1 right-1 text-primary" size={12} />}
                         </button>
                       ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Atmosfera & Vidro</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-background/20 backdrop-blur-xl p-8 border border-border rounded-lg shadow-xl">
                       <div className="space-y-6">
                          <SliderControl label="Opacidade do Fundo" value={bgOpacity} onChange={setBgOpacity} icon={<Waves size={12}/>} />
                          <SliderControl label="Opacidade da Sidebar" value={sidebarOpacity} onChange={setSidebarOpacity} icon={<Layout size={12}/>} />
                       </div>
                       <div className="space-y-6">
                          <SliderControl label="Intensidade Blur" value={glassBlur} max={40} onChange={setGlassBlur} icon={<RefreshCcw size={12}/>} />
                          <div className="space-y-4">
                            <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-foreground"><Layout size={12}/> Raio de Borda: {radius}px</Label>
                            <Slider value={[radius]} max={24} min={0} step={1} onValueChange={(v) => setRadius(v[0])} />
                          </div>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Wallpaper Gallery</Label>
                       <div className="flex gap-2">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleWallpaperUpload} />
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-[9px] font-black uppercase border-dashed">
                             <Plus size={12} className="mr-2"/> Upload
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { resetWallpaper(); setWallpaper(''); }} className="h-8 text-[9px] font-black uppercase text-red-500 hover:bg-red-50">
                             <Trash2 size={12} className="mr-2"/> Reset
                          </Button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       {PlaceHolderImages.filter(img => img.id.startsWith('wp-')).map((wp) => (
                         <button 
                           key={wp.id} 
                           onClick={() => { applyWallpaperUrl(wp.imageUrl); setWallpaper(wp.imageUrl); toast({ title: "Atmosfera Atualizada" }); }}
                           className={cn(
                             "relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all group",
                             wallpaper === wp.imageUrl && "border-primary"
                           )}
                         >
                            <Image src={wp.imageUrl} alt={wp.description} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <CheckCircle2 size={24} className="text-primary" />
                            </div>
                         </button>
                       ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Hardware Customization</Label>
                    <div className="bg-background/20 backdrop-blur-xl p-8 border border-border rounded-lg space-y-10 shadow-xl">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          <ColorPicker label="Fundo Ativo" value={bgColor} onChange={setBgColor} />
                          <ColorPicker label="Letras Principais" value={fontColor} onChange={setFontColor} />
                          <ColorPicker label="Ação Ativa" value={primaryColor} onChange={setPrimaryColor} />
                          <ColorPicker label="Fundo Inativo" value={bgSecondaryColor} onChange={setBgSecondaryColor} />
                          <ColorPicker label="Letras Inativas" value={fontMutedColor} onChange={setFontMutedColor} />
                          <ColorPicker label="Ação Inativa" value={accentColor} onChange={setAccentColor} />
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <Card className="bg-background/40 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-border bg-background/50">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Zap size={14} className="text-primary"/> Neural Infrastructure</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); toast({ title: "Prioridade Alterada" }); }}>
                        <div className="grid gap-4">
                          <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio jurídico sênior de alta fidelidade." status="ONLINE" />
                          <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Velocidade ultra-fluida para atendimento." status="ONLINE" />
                          <EngineOption id="airforce" label="AIRFORCE DEEPSEEK" desc="Análise técnica massiva e baixo custo." status="ESTÁVEL" />
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-background/20 backdrop-blur-xl p-6 border border-border rounded-lg flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-sm"><Activity size={20}/></div>
                         <div>
                            <p className="text-[10px] font-black uppercase">Latência Média</p>
                            <p className="text-xl font-black">1.2s</p>
                         </div>
                       </div>
                    </div>
                    <div className="bg-background/20 backdrop-blur-xl p-6 border border-border rounded-lg flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-primary/10 text-primary rounded-sm"><Server size={20}/></div>
                         <div>
                            <p className="text-[10px] font-black uppercase">Resiliência</p>
                            <p className="text-xl font-black">99.9%</p>
                         </div>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Export' && isMasterUnlocked && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  {!isExportUnlocked ? (
                    <Card className="bg-background/40 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden">
                      <CardHeader className="border-b border-border bg-background/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={14} className="text-primary"/> Acesso Restrito</CardTitle>
                      </CardHeader>
                      <CardContent className="p-12 flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                          <Shield size={32} />
                        </div>
                        <div className="text-center space-y-2">
                           <h3 className="font-bold uppercase tracking-widest text-sm">Autenticação Master de Exportação</h3>
                           <p className="text-[10px] font-black text-muted-foreground uppercase">Insira o código soberano para liberar a compilação.</p>
                        </div>
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 w-4 h-4" />
                            <Input 
                              type="password" 
                              placeholder="SENHA DE ATIVAÇÃO MASTER..." 
                              value={exportPassword}
                              onChange={(e) => setExportPassword(e.target.value)}
                              className="pl-10 bg-background/50 border-2 border-primary/20 rounded-none h-12 uppercase text-[10px] font-black focus-visible:ring-primary"
                            />
                          </div>
                          <Button onClick={handleUnlockExport} className="h-12 bg-black text-white hover:bg-primary hover:text-black border-2 border-black font-black uppercase text-[10px] px-6 transition-all rounded-none shadow-[4px_4px_0px_#00D1FF] hover:shadow-none">
                            Liberar Portal de Compilação
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                       <Card className="bg-background/40 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden border-t-4 border-t-primary">
                         <CardHeader className="border-b border-border bg-background/50">
                           <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Archive size={14}/> Unidade de Exportação de Infraestrutura</CardTitle>
                         </CardHeader>
                         <CardContent className="p-8 space-y-8">
                            <div className="p-8 bg-primary/5 border-2 border-dashed border-primary/30 space-y-6 rounded-lg relative overflow-hidden">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-primary text-primary-foreground rounded-sm shadow-lg"><Code2 size={24}/></div>
                                  <div>
                                    <h4 className="font-black uppercase text-sm text-primary tracking-widest">Full Project Source (SaaS Edition)</h4>
                                    <p className="text-[9px] font-black uppercase text-primary/60 mt-1">Gera um manifesto de auditoria + fonte purificada.</p>
                                  </div>
                               </div>
                               
                               <div className="bg-background/60 p-6 border border-primary/10 rounded-md space-y-4">
                                  <p className="text-[10px] font-black uppercase text-foreground leading-relaxed flex items-start gap-3">
                                    <Shield size={14} className="text-primary shrink-0" />
                                    O arquivo ZIP gerado deve ser manipulado sob o protocolo de senha Ashley@25472053 para garantir o sigilo da propriedade intelectual.
                                  </p>
                               </div>

                               <Button 
                                 onClick={handleFullBackupZip} 
                                 disabled={isExporting}
                                 className="w-full h-16 bg-black text-white hover:bg-primary hover:text-black font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[8px_8px_0px_rgba(var(--primary),0.2)] hover:shadow-none border-2 border-black rounded-none"
                               >
                                 {isExporting ? <Loader2 className="animate-spin mr-3" /> : <FileArchive className="mr-3" />}
                                 {isExporting ? "Compilando Sistema v500.0..." : "Baixar Código-Fonte de Elite"}
                               </Button>
                            </div>
                         </CardContent>
                       </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EngineOption({ id, label, desc, status }: any) {
  return (
    <label htmlFor={id} className="flex items-center justify-between p-6 border border-border rounded-lg hover:border-primary/40 transition-all cursor-pointer bg-background/20 group">
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} />
         <div className="text-left">
           <p className="font-black text-[11px] uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{label}</p>
           <p className="text-[10px] text-muted-foreground uppercase mt-1">{desc}</p>
         </div>
      </div>
      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase px-2 py-0.5">{status}</Badge>
    </label>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-md font-bold uppercase text-[10px] tracking-widest h-12 mb-1 transition-all", 
        active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-background/20"
      )}
    >
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div className="space-y-3">
      <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-muted-foreground"><Palette size={12}/> {label}</Label>
      <div className="flex gap-2">
        <div className="relative w-12 h-11 border border-border rounded-md overflow-hidden cursor-pointer">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer bg-transparent" />
        </div>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[11px] border border-border rounded-md uppercase h-11 bg-background/50" />
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, icon, max = 100 }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-[9px] uppercase font-black flex items-center gap-2 text-foreground">{icon} {label}</Label>
        <span className="text-[10px] font-black">{value}%</span>
      </div>
      <Slider value={[value]} max={max} min={0} step={1} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
