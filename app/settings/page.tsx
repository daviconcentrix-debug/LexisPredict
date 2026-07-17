"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Cpu,
  Palette,
  Archive,
  Trash2,
  Lock,
  Shield,
  Download,
  Loader2,
  Code2,
  FileJson,
  History,
  Waves,
  Layout,
  RefreshCcw,
  Zap,
  CheckCircle2
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
import { cn, getIdealTextColor, getIdealMutedTextColor } from '@/lib/utils';
import { 
  applyWallpaperUrl, 
  resetWallpaper, 
  loadVisualStateFromStorage,
} from '@/lib/visual-hardware';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { exportFullSourceCodeAction } from '@/app/actions/system-actions';
import { saveAs } from 'file-saver';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('Hardware');
  
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
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(false);

  const [exportPassword, setExportPassword] = useState('');
  const [isExportUnlocked, setIsExportUnlocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem('lexisPredict_preferred_ia') || 'xai');
    setIsMasterUnlocked(localStorage.getItem('lexis_master_unlock') === 'true');
    
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
      border: fontColor
    };
    applyGlobalTheme(customColors, radius, bgOpacity / 100, sidebarOpacity / 100, glassBlur);
    if (wallpaper) applyWallpaperUrl(wallpaper);
    toast({ title: "Hardware Visual Aplicado", description: "Configurações sincronizadas no root." });
  };

  const handleUnlockExport = () => {
    if (exportPassword === '25472053') {
      setIsExportUnlocked(true);
      toast({ title: "Acesso Autorizado", description: "Portal de Exportação Master liberado." });
    } else {
      toast({ title: "Acesso Negado", description: "Senha incorreta.", variant: "destructive" });
    }
  };

  const handleFullBackupZip = async () => {
    setIsExporting(true);
    toast({ title: "Iniciando Compilação", description: "Preparando arquivos de código e dados..." });
    
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
        
        saveAs(blob, result.filename || "LexisPredict_FullSystem.zip");
        toast({ title: "Download Concluído", description: "Pacote master gerado com sucesso." });
      } else {
        throw new Error(result.error || "Falha na geração do ZIP");
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
             <h1 className="font-bold text-sm tracking-[0.2em] uppercase">Gabinete Mission Control</h1>
          </div>
          <Badge variant="outline" className="text-primary text-[9px] uppercase font-black tracking-[0.3em] rounded-none px-3 py-1 border-primary/50">Elite Hardware v22.5</Badge>
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
                  <section className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Telemetry Preview</Label>
                    <div className="p-8 glass-card border border-border rounded-lg space-y-8 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                       <div className="flex items-center justify-between border-b border-border pb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                             <span className="text-sm font-bold uppercase tracking-tight" style={{ color: fontColor }}>Gabinete Operacional</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black rounded-none px-2 py-0.5 border-primary/40 text-primary">ELITE STATUS</Badge>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Primary Console</p>
                            <Button className="w-full h-12 rounded-sm font-black uppercase text-[10px] tracking-widest" style={{ backgroundColor: primaryColor, color: bgColor }}>Executive Action</Button>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Secondary Surfaces</p>
                            <div className="w-full h-12 rounded-sm border border-border flex items-center justify-center font-black uppercase text-[10px]" style={{ backgroundColor: bgSecondaryColor, color: fontMutedColor }}>Idle State</div>
                          </div>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Authority Presets</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                             "p-5 border border-border hover:border-primary/50 transition-all flex flex-col items-center gap-4 glass-card rounded-lg relative overflow-hidden group",
                             bgColor === p.colors.background && "border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                           )}
                         >
                            <div className="w-12 h-12 rounded-md border border-border group-hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: p.colors.background }}>
                               <div className="w-full h-1/2 rounded-t-md" style={{ backgroundColor: p.colors.primary }} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{p.name}</span>
                            {bgColor === p.colors.background && <CheckCircle2 className="absolute top-2 right-2 text-primary" size={14} />}
                         </button>
                       ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Hardware Customization</Label>
                    <div className="glass-card p-8 border border-border rounded-lg space-y-10 shadow-xl">
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

                  <section className="space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Atmosfera & Vidro</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 glass-card p-8 border border-border rounded-lg shadow-xl">
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
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Wallpaper Engine</Label>
                    <div className="glass-card p-8 border border-border rounded-lg shadow-xl flex flex-col sm:flex-row gap-6">
                       <div className="flex-1 space-y-2">
                          <Label className="text-[9px] uppercase font-black">URL da Imagem</Label>
                          <Input placeholder="https://..." value={wallpaper} onChange={(e) => setWallpaper(e.target.value)} className="bg-background/50 border-border rounded-md h-12 uppercase text-[10px] font-black" />
                       </div>
                       <div className="flex gap-3 items-end">
                          <Button onClick={handleApplyHardware} className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[10px] px-10 tracking-widest transition-all">
                             Sincronizar Hardware
                          </Button>
                          <Button variant="outline" onClick={async () => { await resetWallpaper(); setWallpaper(''); toast({ title: "Atmosfera Resetada" }); }} className="h-12 w-12 border-border hover:bg-destructive hover:text-destructive-foreground transition-all">
                             <Trash2 size={16} />
                          </Button>
                       </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-background/40 backdrop-blur-xl border border-border rounded-lg shadow-2xl animate-in slide-in-from-right-4 overflow-hidden">
                  <CardHeader className="border-b border-border bg-background/50">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Zap size={14} className="text-primary"/> Neural Mission Control</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <RadioGroup value={iaModel} onValueChange={(val) => { setIaModel(val); localStorage.setItem('lexisPredict_preferred_ia', val); toast({ title: "Motor Neural Alternado" }); }}>
                      <EngineOption id="xai" label="xAI GROK 4.5" desc="Raciocínio sênior de alta fidelidade para auditorias complexas." active={iaModel === 'xai'} />
                      <EngineOption id="airforce" label="AIRFORCE DEEPSEEK-V3" desc="Processamento ultra-veloz de dados e transcrição forense." active={iaModel === 'airforce'} />
                      <EngineOption id="groq-llama" label="GROQ LLAMA 3.3" desc="Comunicação fluida em tempo real para consultoria." active={iaModel === 'groq-llama'} />
                      <EngineOption id="groq-deepseek" label="GROQ DEEPSEEK R1" desc="Lógica profunda para análise de riscos e triagem técnica." active={iaModel === 'groq-deepseek'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
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
                           <h3 className="font-bold uppercase tracking-widest text-sm">Autenticação Master Requerida</h3>
                           <p className="text-[10px] font-medium text-muted-foreground uppercase">Insira a senha de provisionamento para liberar a exportação FULL.</p>
                        </div>
                        <div className="flex gap-2 w-full max-w-xs">
                          <Input 
                            type="password" 
                            placeholder="SENHA MESTRE..." 
                            value={exportPassword}
                            onChange={(e) => setExportPassword(e.target.value)}
                            className="bg-background/50 border-border rounded-md h-12 uppercase text-[10px] font-black"
                          />
                          <Button onClick={handleUnlockExport} className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[10px] px-6">
                            Liberar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-8">
                       <Card className="bg-background/40 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden border-t-4 border-t-primary">
                         <CardHeader className="border-b border-border bg-background/50">
                           <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Archive size={14}/> Portal de Exportação Master v8.5</CardTitle>
                         </CardHeader>
                         <CardContent className="p-8 space-y-8">
                            <div className="p-8 bg-primary/5 border-2 border-dashed border-primary/30 space-y-6 rounded-lg relative overflow-hidden">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-primary text-primary-foreground rounded-sm shadow-lg"><Code2 size={24}/></div>
                                  <div>
                                    <h4 className="font-black uppercase text-sm text-primary tracking-widest">Full Project Source (ZIP)</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Inclui Raiz, /SRC, /DOCS, JSONs e Configurações Globais.</p>
                                  </div>
                               </div>
                               
                               <p className="text-[10px] font-medium leading-relaxed uppercase opacity-70 border-l-2 border-primary/30 pl-4">
                                 Este procedimento consolida toda a arquitetura de programação do gabinete em um pacote pronto para GitHub. 
                                 Arquivos temporários e dependências instaladas (node_modules) são excluídos para máxima higiene.
                               </p>

                               <Button 
                                 onClick={handleFullBackupZip} 
                                 disabled={isExporting}
                                 className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[8px_8px_0px_rgba(var(--primary),0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                               >
                                 {isExporting ? <Loader2 className="animate-spin mr-3" /> : <Download className="mr-3" />}
                                 {isExporting ? "Compilando Sistema..." : "Baixar Código-Fonte Completo"}
                               </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <DataExportCard title="Banco de Casos" subtitle="DUMP JSON ATIVO" icon={<FileJson size={18}/>} onDownload={async () => { const data = await fetchRepoCases(); saveAs(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}), "cases_database.json"); }} />
                               <DataExportCard title="Base de Evidências" subtitle="LOGS ESTRATÉGICOS" icon={<History size={18}/>} onDownload={async () => { const data = await fetchRepoNotes(); saveAs(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}), "evidence_logs.json"); }} />
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

function DataExportCard({ title, subtitle, icon, onDownload }: any) {
  return (
    <div className="p-6 border border-border rounded-lg space-y-4 bg-background/20 group hover:border-primary/40 transition-all">
      <div className="flex items-center gap-3">
        <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
        <div className="text-left">
          <h4 className="font-bold uppercase text-[10px] tracking-widest">{title}</h4>
          <p className="text-[8px] font-black text-muted-foreground uppercase">{subtitle}</p>
        </div>
      </div>
      <Button variant="outline" onClick={onDownload} className="w-full text-[9px] font-black uppercase h-10 border-border hover:border-primary/50 transition-all rounded-sm bg-background/50">Download JSON</Button>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "w-full justify-start rounded-md font-bold uppercase text-[10px] tracking-widest h-12 mb-1 transition-all", 
        active ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      )}
    >
      <span className="mr-4">{icon}</span> {label}
    </Button>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[9px] uppercase font-black flex items-center gap-2"><Palette size={12}/> {label}</Label>
      </div>
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

function EngineOption({ id, label, desc, active }: any) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-6 border transition-all cursor-pointer mb-3 rounded-lg bg-background/20", active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
      <div className="flex items-center gap-5">
         <RadioGroupItem value={id} id={id} />
         <div className="text-left">
           <p className="font-black text-[11px] uppercase tracking-widest text-foreground">{label}</p>
           <p className="text-[10px] text-muted-foreground uppercase mt-1">{desc}</p>
         </div>
      </div>
      {active && <Zap size={14} className="text-primary fill-primary" />}
    </label>
  );
}