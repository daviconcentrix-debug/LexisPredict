
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  HardDrive, 
  Settings2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Zap, 
  KeyRound,
  Code2,
  Copy,
  ShieldAlert,
  Cpu,
  Palette,
  Image as ImageIcon,
  Copyright
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const VEREDITO_SOURCE_CODE = `'use server';
/**
 * MOTOR DE PROCESSAMENTO TÉCNICO v28.0 ELITE - DATAJUD INTEGRAL
 * Proprietário: W1 Capital | Fundador: Davi Alves Figueredo
 */

// --- SERVIÇO DATAJUD (API KEY INCLUÍDA) ---
const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

export async function fetchDataJud(cnj) {
  const cnjLimpo = cnj.replace(/\\D/g, '');
  const aliasPart = \`\${cnjLimpo[13]}.\${cnjLimpo.substring(14, 16)}\`;
  const url = \`https://api-publica.datajud.cnj.jus.br/api_publica_\${aliasPart}/_search\`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'APIKey ' + DATAJUD_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { term: { "numeroProcesso.keyword": cnjLimpo } } })
  });
  return response.json();
}

// --- FLUXO DE ANÁLISE ---
export const vereditoAIFlow = ai.defineFlow({
  name: 'vereditoAIFlow',
  inputSchema: z.object({ cnj: z.string(), preferredModel: z.string() }),
  outputSchema: VereditoOutputSchema,
}, async (input) => {
  const dataJudData = await fetchDataJud(input.cnj);
  
  const { output } = await ai.generate({
    model: input.preferredModel,
    system: "Você é o Analista Jurídico Sênior da W1 Capital...",
    prompt: \`DADOS REAIS: \${JSON.stringify(dataJudData)}\`,
    output: { schema: VereditoOutputSchema }
  });
  
  return output;
});`;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Sync');
  const [passwordInput, setPasswordInput] = useState('');
  const [codePasswordInput, setCodePasswordInput] = useState('');
  const [isCodeAuthorized, setIsCodeAuthorized] = useState(false);
  const [iaModel, setIaModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [deepThinking, setDeepThinking] = useState(false);
  
  // Personalização
  const [bgColor, setBgColor] = useState('#f3f2f2');
  const [wallpaper, setWallpaper] = useState('');

  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'gemini' || savedIA === 'grok' || savedIA === 'openrouter') {
      setIaModel(savedIA as any);
    }
    const savedThinking = localStorage.getItem('lexisPredict_deep_thinking');
    if (savedThinking === 'true') setDeepThinking(true);

    const savedColor = localStorage.getItem('lexisPredict_bg_color');
    if (savedColor) setBgColor(savedColor);
    const savedWallpaper = localStorage.getItem('lexisPredict_wallpaper');
    if (savedWallpaper) setWallpaper(savedWallpaper);
  }, []);

  const handleIaChange = (value: 'gemini' | 'grok' | 'openrouter') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Núcleo Técnico Alterado", description: `Motor ${value.toUpperCase()} ativado.` });
  };

  const handleThinkingChange = (checked: boolean) => {
    setDeepThinking(checked);
    localStorage.setItem('lexisPredict_deep_thinking', checked ? 'true' : 'false');
    toast({ title: checked ? "Processamento Profundo Ativado" : "Processamento Profundo Desativado" });
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBgColor(val);
    localStorage.setItem('lexisPredict_bg_color', val);
    window.dispatchEvent(new Event('storage'));
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWallpaper(val);
    localStorage.setItem('lexisPredict_wallpaper', val);
    window.dispatchEvent(new Event('storage'));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(passwordInput);
    if (success) {
      toast({ title: "Acesso Concedido", description: "Privilégios Administrativos ativados." });
      setPasswordInput('');
    } else {
      toast({ title: "Erro de Autenticação", description: "Senha mestre incorreta.", variant: "destructive" });
    }
  };

  const handleUnlockCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (codePasswordInput === 'Ashley@25472053') {
      setIsCodeAuthorized(true);
      toast({ title: "Código Desbloqueado", description: "Código-fonte integral liberado." });
      setCodePasswordInput('');
    } else {
      toast({ title: "Acesso Negado", description: "Senha de segurança incorreta.", variant: "destructive" });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(VEREDITO_SOURCE_CODE);
    toast({ title: "Copiado", description: "Código copiado para a área de transferência." });
  };

  const resetAppearance = () => {
    setBgColor('#f3f2f2');
    setWallpaper('');
    localStorage.removeItem('lexisPredict_bg_color');
    localStorage.removeItem('lexisPredict_wallpaper');
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Aparência Resetada" });
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Configuração Sistema</h1>
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v47.0 Elite</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className={cn("w-full justify-start rounded-sm font-black uppercase text-xs h-10", activeTab === 'Sync' ? "bg-black text-white" : "text-black hover:bg-black hover:text-white")}>
                <HardDrive size={18} className="mr-2" /> Sincronia Cloud
              </Button>
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className={cn("w-full justify-start rounded-sm font-black uppercase text-xs h-10", activeTab === 'Engine' ? "bg-black text-white" : "text-black hover:bg-black hover:text-white")}>
                <Cpu size={18} className="mr-2" /> Núcleo Técnico
              </Button>
              <Button variant={activeTab === 'Style' ? 'default' : 'ghost'} onClick={() => setActiveTab('Style')} className={cn("w-full justify-start rounded-sm font-black uppercase text-xs h-10", activeTab === 'Style' ? "bg-black text-white" : "text-black hover:bg-black hover:text-white")}>
                <Palette size={18} className="mr-2" /> Personalização
              </Button>
              <Button variant={activeTab === 'Admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('Admin')} className={cn("w-full justify-start rounded-sm font-black uppercase text-xs h-10", activeTab === 'Admin' ? "bg-black text-white" : "text-black hover:bg-black hover:text-white")}>
                <Lock size={18} className="mr-2" /> Portal Admin
              </Button>
              {isAdmin && (
                <Button variant={activeTab === 'Code' ? 'default' : 'ghost'} onClick={() => setActiveTab('Code')} className={cn("w-full justify-start rounded-sm font-black uppercase text-xs h-10", activeTab === 'Code' ? "bg-black text-white" : "text-black hover:bg-black hover:text-white")}>
                  <Code2 size={18} className="mr-2" /> System Code
                </Button>
              )}
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Sync' && (
                <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Infraestrutura PostgreSQL</CardTitle>
                    <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Status da conexão resiliente com o servidor W1 Capital.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-6 bg-[#f3f2f2] rounded-sm border border-black group hover:bg-black transition-all cursor-default">
                      <div className="flex items-center justify-between mb-4">
                         <div className="text-sm font-black text-black group-hover:text-white uppercase flex items-center gap-2 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          Database Online
                        </div>
                        <Badge className="bg-green-600 text-white border-none font-black uppercase text-[9px] px-3">Ativo</Badge>
                      </div>
                      <div className="text-[10px] text-black/40 group-hover:text-white/40 uppercase font-black tracking-widest bg-white/10 px-3 py-2 rounded-sm border border-black group-hover:border-white/20 transition-all">
                        ID: segjskjlbeydlljnefai
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Engine' && (
                <div className="space-y-6">
                  <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b border-black">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Settings2 size={18} /> Seleção de Núcleo Técnico
                      </CardTitle>
                      <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Escolha o motor de processamento para auditoria e triagem.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <RadioGroup value={iaModel} onValueChange={v => handleIaChange(v as any)} className="grid gap-3">
                        <IaOption id="gemini" value="gemini" title="Gemini 1.5 Flash" desc="Núcleo de Alta Velocidade para fluxos rotineiros." active={iaModel === 'gemini'} />
                        <IaOption id="grok" value="grok" title="Grok (Llama 3.3)" desc="Núcleo de Estruturação para dados complexos." active={iaModel === 'grok'} />
                        <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet" desc="Núcleo de Gabinete para máxima precisão técnica." active={iaModel === 'openrouter'} />
                      </RadioGroup>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden group hover:bg-black transition-all cursor-default">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="icon-3d-wrapper">
                          <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                            <Zap className="text-white group-hover:text-black w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-black text-black group-hover:text-white uppercase transition-colors">Processamento Profundo</p>
                          <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">Triagem avançada de andamentos processuais.</p>
                        </div>
                      </div>
                      <Switch checked={deepThinking} onCheckedChange={handleThinkingChange} className="data-[state=checked]:bg-black border-black" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Style' && (
                <div className="space-y-6">
                  <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b border-black">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Palette size={18} /> Aparência do Sistema
                      </CardTitle>
                      <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Personalize o ambiente de trabalho do W1 Capital CRM.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase">Cor de Fundo Principal</Label>
                        <div className="flex gap-4 items-center">
                          <input 
                            type="color" 
                            value={bgColor} 
                            onChange={handleBgColorChange}
                            className="h-10 w-20 border-none cursor-pointer"
                          />
                          <Input 
                            value={bgColor} 
                            onChange={handleBgColorChange}
                            className="font-mono border-black text-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-black text-xs uppercase">Wallpaper (URL da Imagem)</Label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                          <Input 
                            placeholder="https://exemplo.com/imagem.jpg" 
                            value={wallpaper}
                            onChange={handleWallpaperChange}
                            className="pl-10 border-black text-black"
                          />
                        </div>
                        <p className="text-[9px] text-black/40 font-black uppercase">Dica: Use imagens em alta resolução para melhor efeito imersivo.</p>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={resetAppearance}
                        className="w-full border-black text-black font-black uppercase text-xs hover:bg-black hover:text-white"
                      >
                        Resetar Preferências Visuais
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Admin' && (
                <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b border-black">
                    <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                      <KeyRound size={18} /> Autenticação de Gestão
                    </CardTitle>
                    <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Libera ferramentas de purga e visualização de dados protegidos.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {isAdmin ? (
                      <div className="space-y-6 text-center group cursor-default">
                        <div className="icon-3d-wrapper w-fit mx-auto mb-4">
                          <div className="icon-3d-block black w-16 h-16 rounded-sm">
                            <Unlock size={32} className="text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-black uppercase tracking-tight">Sessão Administrativa Ativa</h3>
                        <p className="text-xs text-black/60 font-black uppercase max-w-sm mx-auto">Você possui privilégios totais de gestão sobre a base W1 Capital.</p>
                        <Button variant="destructive" onClick={logout} className="w-full h-11 font-black uppercase text-xs rounded-sm">
                          Encerrar Acesso Administrativo
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleAdminLogin} className="space-y-4 max-w-sm mx-auto">
                        <div className="space-y-2">
                          <Label htmlFor="password" className="font-black uppercase text-[10px]">Senha Mestre</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                            <Input 
                              id="password"
                              type="password" 
                              placeholder="CREDENCIAL DE SEGURANÇA..." 
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="pl-10 h-11 border-black rounded-sm text-black font-black uppercase text-sm"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-black bg-black hover:bg-gray-800 text-white uppercase text-xs rounded-sm">
                          Desbloquear Gestão
                        </Button>
                        <p className="text-[9px] text-center text-black/40 uppercase tracking-widest font-black mt-4">
                          Restrito ao Fundador Davi Alves Figueredo
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Code' && isAdmin && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {!isCodeAuthorized ? (
                    <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden border-t-2 border-t-red-600">
                       <CardHeader className="bg-red-50/50 border-b border-black">
                        <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                          <ShieldAlert className="text-red-600" size={18} /> Acesso Restrito de Nível 2
                        </CardTitle>
                        <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Re-valide a credencial para exibir o código do núcleo técnico.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8">
                         <form onSubmit={handleUnlockCode} className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                               <Label htmlFor="codePass" className="font-black uppercase text-[10px]">Credencial de Segurança</Label>
                               <Input 
                                  id="codePass" 
                                  type="password" 
                                  placeholder="CONFIRMAR SENHA..." 
                                  value={codePasswordInput}
                                  onChange={(e) => setCodePasswordInput(e.target.value)}
                                  className="border-black h-11 text-center font-black uppercase text-sm"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 font-black bg-red-600 hover:bg-red-700 text-white uppercase text-xs rounded-sm">
                               Desbloquear Código Fonte
                            </Button>
                         </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-white border-black shadow-sm rounded-sm overflow-hidden border-t-2 border-t-black">
                      <CardHeader className="bg-[#f8f9fb] border-b border-black flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-black font-black uppercase text-sm">Núcleo de Processamento (Source)</CardTitle>
                          <CardDescription className="text-black/60 font-bold uppercase text-[10px]">Lógica de triagem e integração DataJud oficial.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => setIsCodeAuthorized(false)} className="border-black text-black font-black uppercase text-[9px] h-7 hover:bg-black hover:text-white">
                              Bloquear
                           </Button>
                           <Button variant="outline" size="sm" onClick={copyCode} className="border-black text-black font-black uppercase text-[9px] h-7 hover:bg-black hover:text-white">
                              <Copy size={12} className="mr-2" /> Copiar Código
                           </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[500px] w-full bg-[#f3f2f2]">
                          <pre className="p-6 text-[11px] font-mono text-black leading-relaxed whitespace-pre-wrap">
                            {VEREDITO_SOURCE_CODE}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:text-black transition-colors cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30" />
          <span className="text-black uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function IaOption({ id, value, title, desc, active }: { id: string, value: string, title: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn(
      "flex items-center justify-between p-4 rounded-sm border transition-all cursor-pointer group", 
      active ? "bg-black border-black" : "bg-white border-[#dddbda] hover:border-black"
    )}>
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} className={cn("border-black", active ? "text-white border-white" : "text-black")} />
        <div>
          <p className={cn("font-black text-xs uppercase transition-colors", active ? "text-white" : "text-black")}>{title}</p>
          <p className={cn("text-[9px] font-black uppercase transition-colors", active ? "text-white/60" : "text-black/40")}>{desc}</p>
        </div>
      </div>
      {active && <CheckCircle2 className="text-white" size={16} />}
    </label>
  );
}
