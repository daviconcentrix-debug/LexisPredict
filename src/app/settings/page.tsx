"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  HardDrive, 
  Settings2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Database, 
  Zap, 
  KeyRound,
  Code2,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Cpu
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
  const url = \`https://api-publica.datajud.cnj.jus.br/api_publica_\${COURT_MAP[aliasPart]}/_search\`;
  
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
  
  // Orquestração de Motores de Gabinete
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
  
  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'gemini' || savedIA === 'grok' || savedIA === 'openrouter') {
      setIaModel(savedIA as any);
    }
    const savedThinking = localStorage.getItem('lexisPredict_deep_thinking');
    if (savedThinking === 'true') setDeepThinking(true);
  }, []);

  const handleIaChange = (value: 'gemini' | 'grok' | 'openrouter') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Núcleo Alterado", description: `Engine ${value.toUpperCase()} configurada.` });
  };

  const handleThinkingChange = (checked: boolean) => {
    setDeepThinking(checked);
    localStorage.setItem('lexisPredict_deep_thinking', checked ? 'true' : 'false');
    toast({ title: checked ? "Modo Profundo Ativado" : "Modo Profundo Desativado" });
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

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Configurações do Sistema</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] uppercase font-bold tracking-widest">v30.0 Handcrafted</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className="w-full justify-start rounded-md font-bold"><HardDrive size={18} className="mr-2" /> Sincronia Cloud</Button>
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className="w-full justify-start rounded-md font-bold"><Cpu size={18} className="mr-2" /> Núcleo Técnico</Button>
              <Button variant={activeTab === 'Admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('Admin')} className="w-full justify-start rounded-md font-bold"><Lock size={18} className="mr-2" /> Portal Admin</Button>
              {isAdmin && (
                <Button variant={activeTab === 'Code' ? 'default' : 'ghost'} onClick={() => setActiveTab('Code')} className="w-full justify-start rounded-md font-bold text-accent hover:text-accent"><Code2 size={18} className="mr-2" /> System Code</Button>
              )}
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Sync' && (
                <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden">
                  <CardHeader className="bg-secondary/20 border-b border-border">
                    <CardTitle className="text-white font-headline text-lg">Infraestrutura PostgreSQL</CardTitle>
                    <CardDescription>Status da conexão resiliente com o servidor de dados.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="p-6 bg-secondary/10 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-4">
                           <div className="text-sm font-bold text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-chart-3" />
                            Servidor Online
                          </div>
                          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 font-black uppercase text-[10px] px-4 py-1">Ativo</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-black/20 px-3 py-2 rounded border border-white/5">
                          id: seg*************************
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Engine' && (
                <div className="space-y-6">
                  <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden">
                    <CardHeader className="bg-secondary/20 border-b border-border">
                      <CardTitle className="text-white font-headline text-lg flex items-center gap-2">
                        <Settings2 className="text-primary" size={20} /> Seleção de Núcleo Técnico
                      </CardTitle>
                      <CardDescription>Escolha o motor de processamento para auditoria e triagem.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <RadioGroup value={iaModel} onValueChange={v => handleIaChange(v as any)} className="grid gap-3">
                        <IaOption id="gemini" value="gemini" title="Gemini 1.5 Flash" desc="Núcleo de Alta Velocidade para fluxos rotineiros." active={iaModel === 'gemini'} />
                        <IaOption id="grok" value="grok" title="Grok (Llama 3.3)" desc="Núcleo de Estruturação para dados complexos." active={iaModel === 'grok'} />
                        <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet" desc="Núcleo de Gabinete para máxima precisão técnica." active={iaModel === 'openrouter'} />
                      </RadioGroup>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Zap className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Processamento Profundo</p>
                          <p className="text-xs text-muted-foreground">Triagem avançada de andamentos processuais.</p>
                        </div>
                      </div>
                      <Switch checked={deepThinking} onCheckedChange={handleThinkingChange} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Admin' && (
                <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden">
                  <CardHeader className="bg-secondary/20 border-b border-border">
                    <CardTitle className="text-white font-headline text-lg flex items-center gap-2">
                      <KeyRound className="text-accent" size={20} /> Autenticação de Gestão
                    </CardTitle>
                    <CardDescription>Libera ferramentas de purga e visualização de dados protegidos.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {isAdmin ? (
                      <div className="space-y-6 text-center">
                        <div className="w-16 h-16 bg-chart-3/10 text-chart-3 rounded-full flex items-center justify-center mx-auto mb-4 border border-chart-3/20">
                          <Unlock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Sessão Administrativa Ativa</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">Você possui privilégios totais de gestão sobre a base W1 Capital.</p>
                        <Button variant="destructive" onClick={logout} className="w-full h-11 font-bold rounded-md">
                          Encerrar Acesso Administrativo
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha Mestre</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input 
                              id="password"
                              type="password" 
                              placeholder="Credencial de segurança..." 
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="pl-10 h-11 bg-secondary/50 border-border rounded-md text-white"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold rounded-md bg-primary hover:bg-primary/90 text-white">
                          Desbloquear Gestão
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium mt-4">
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
                    <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden border-t-2 border-t-destructive">
                       <CardHeader className="bg-destructive/5 border-b border-border">
                        <CardTitle className="text-white font-headline text-lg flex items-center gap-2">
                          <ShieldAlert className="text-destructive" size={20} /> Acesso Restrito de Nível 2
                        </CardTitle>
                        <CardDescription>Re-valide a credencial para exibir o código do núcleo técnico.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8">
                         <form onSubmit={handleUnlockCode} className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                               <Label htmlFor="codePass">Credencial de Segurança</Label>
                               <Input 
                                  id="codePass" 
                                  type="password" 
                                  placeholder="Confirmar senha..." 
                                  value={codePasswordInput}
                                  onChange={(e) => setCodePasswordInput(e.target.value)}
                                  className="bg-secondary/50 border-border h-11 text-center"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold bg-destructive hover:bg-destructive/90 text-white">
                               Desbloquear Código Fonte
                            </Button>
                         </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden border-t-2 border-t-accent">
                      <CardHeader className="bg-secondary/20 border-b border-border flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-white font-headline text-lg">Núcleo de Processamento (Source)</CardTitle>
                          <CardDescription>Lógica de triagem e integração DataJud oficial.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => setIsCodeAuthorized(false)} className="border-border text-muted-foreground hover:text-white">
                              Bloquear
                           </Button>
                           <Button variant="outline" size="sm" onClick={copyCode} className="border-accent/30 text-accent hover:bg-accent hover:text-white">
                              <Copy size={14} className="mr-2" /> Copiar Código
                           </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[500px] w-full bg-black/40">
                          <pre className="p-6 text-[11px] font-mono text-accent/90 leading-relaxed whitespace-pre-wrap">
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

        <footer className="h-16 border-t border-border bg-card flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-2">
            <span>2026 W1 Capital. Todos os direitos reservados.</span>
          </div>
          <span className="text-primary/70">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function IaOption({ id, value, title, desc, active }: { id: string, value: string, title: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn(
      "flex items-center justify-between p-4 rounded-md border transition-all cursor-pointer group", 
      active ? "bg-primary/5 border-primary" : "bg-secondary/10 border-border hover:border-primary/40"
    )}>
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} className="border-primary text-primary" />
        <div>
          <p className="text-white font-bold text-sm group-hover:text-primary transition-colors">{title}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
        </div>
      </div>
      {active && <CheckCircle2 className="text-primary" size={16} />}
    </label>
  );
}