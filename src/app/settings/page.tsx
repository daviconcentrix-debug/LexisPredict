
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  HardDrive, 
  Cpu, 
  Lock, 
  Unlock, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  BrainCircuit, 
  Zap, 
  KeyRound,
  Code2,
  Copy,
  ShieldCheck
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

// Código Integral do Veredito AI + DataJud API para exibição no portal de desenvolvedor
const VEREDITO_SOURCE_CODE = `'use server';
/**
 * MOTOR DE INTELIGÊNCIA JURÍDICA v28.0 ELITE - DATAJUD INTEGRAL
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

// --- FLUXO DE INTELIGÊNCIA (AI FLOW) ---
export const vereditoAIFlow = ai.defineFlow({
  name: 'vereditoAIFlow',
  inputSchema: z.object({ cnj: z.string(), preferredModel: z.string() }),
  outputSchema: VereditoOutputSchema,
}, async (input) => {
  const dataJudData = await fetchDataJud(input.cnj);
  
  // Orquestração Multi-Engine (Grok/Claude/Gemini)
  const { output } = await ai.generate({
    model: input.preferredModel,
    system: "Você é o Veredito AI v28.0 Elite da W1 Capital...",
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
    toast({ title: "Motor IA Alterado", description: `Engine ${value.toUpperCase()} configurada.` });
  };

  const handleThinkingChange = (checked: boolean) => {
    setDeepThinking(checked);
    localStorage.setItem('lexisPredict_deep_thinking', checked ? 'true' : 'false');
    toast({ title: checked ? "Deep Thinking Ativo" : "Deep Thinking Desligado" });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(passwordInput);
    if (success) {
      toast({ title: "Acesso Concedido", description: "Privilégios de Administrador ativados." });
      setPasswordInput('');
    } else {
      toast({ title: "Erro de Autenticação", description: "Senha mestre incorreta.", variant: "destructive" });
    }
  };

  const handleUnlockCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (codePasswordInput === 'Ashley@25472053') {
      setIsCodeAuthorized(true);
      toast({ title: "Acesso Autorizado", description: "Código-fonte integral desbloqueado." });
      setCodePasswordInput('');
    } else {
      toast({ title: "Acesso Negado", description: "Senha de segurança incorreta.", variant: "destructive" });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(VEREDITO_SOURCE_CODE);
    toast({ title: "Código Copiado", description: "O motor integral está na sua área de transferência." });
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl">System Settings</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] uppercase font-bold tracking-widest">v28.0 Elite</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className="w-full justify-start rounded-xl font-bold"><HardDrive size={18} className="mr-2" /> Sync</Button>
              <Button variant={activeTab === 'IA' ? 'default' : 'ghost'} onClick={() => setActiveTab('IA')} className="w-full justify-start rounded-xl font-bold"><Cpu size={18} className="mr-2" /> Intelligence</Button>
              <Button variant={activeTab === 'Admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('Admin')} className="w-full justify-start rounded-xl font-bold"><Lock size={18} className="mr-2" /> Admin Portal</Button>
              {isAdmin && (
                <Button variant={activeTab === 'Code' ? 'default' : 'ghost'} onClick={() => setActiveTab('Code')} className="w-full justify-start rounded-xl font-bold text-accent hover:text-accent"><Code2 size={18} className="mr-2" /> System Code</Button>
              )}
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Sync' && (
                <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-secondary/20">
                    <CardTitle className="text-white font-headline">Cloud Infrastructure</CardTitle>
                    <CardDescription>Status da conexão com o banco de dados PostgreSQL (Supabase).</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="p-6 bg-secondary/30 rounded-xl border border-border shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                           <div className="text-sm font-bold text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            Database Online
                          </div>
                          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 font-black uppercase text-[10px] px-4 py-1">Ativo</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] bg-black/20 px-3 py-2 rounded border border-white/5">
                          seg*************************
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'IA' && (
                <div className="space-y-6">
                  <Card className="bg-card border-border shadow-2xl rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white font-headline flex items-center gap-2">
                        <Cpu className="text-primary" size={20} /> AI OmniEngine Selection
                      </CardTitle>
                      <CardDescription>Escolha o motor de processamento para análises jurídicas e documentos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={iaModel} onValueChange={v => handleIaChange(v as any)} className="grid gap-3">
                        <IaOption id="gemini" value="gemini" title="Google Gemini 1.5 Flash" desc="Alta velocidade e baixa latência." active={iaModel === 'gemini'} />
                        <IaOption id="grok" value="grok" title="Groq (Llama 3.3 70B)" desc="Performance superior em estruturação de dados." active={iaModel === 'grok'} />
                        <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet (Elite)" desc="Raciocínio jurídico superior e fidelidade visual." active={iaModel === 'openrouter'} />
                      </RadioGroup>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BrainCircuit className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Modo Pensamento Profundo</p>
                          <p className="text-xs text-muted-foreground">Ativa o Chain-of-Thought para casos complexos.</p>
                        </div>
                      </div>
                      <Switch checked={deepThinking} onCheckedChange={handleThinkingChange} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Admin' && (
                <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-secondary/20">
                    <CardTitle className="text-white font-headline flex items-center gap-2">
                      <KeyRound className="text-accent" size={20} /> Autenticação Administrativa
                    </CardTitle>
                    <CardDescription>O modo Admin libera ferramentas de purga de dados e acesso ao código-fonte.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {isAdmin ? (
                      <div className="space-y-6 text-center">
                        <div className="w-16 h-16 bg-chart-3/10 text-chart-3 rounded-full flex items-center justify-center mx-auto mb-4 border border-chart-3/20 shadow-inner">
                          <Unlock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Sessão Admin Ativa</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">Você possui privilégios totais de gestão sobre a base de dados W1 Capital.</p>
                        <Button variant="destructive" onClick={logout} className="w-full h-12 font-bold rounded-xl shadow-lg shadow-destructive/20">
                          Encerrar Sessão Administrativa
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
                              placeholder="Digite a senha de administrador..." 
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="pl-10 h-12 bg-secondary/50 border-border rounded-xl focus-visible:ring-primary text-white"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-12 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                          Desbloquear Privilégios
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
                    <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden border-t-4 border-t-destructive">
                       <CardHeader className="bg-destructive/5">
                        <CardTitle className="text-white font-headline flex items-center gap-2">
                          <ShieldCheck className="text-destructive" size={20} /> Acesso de Nível 2
                        </CardTitle>
                        <CardDescription>Esta área contém segredos de estado. Re-insira a senha mestre para descriptografar o código.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-8">
                         <form onSubmit={handleUnlockCode} className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                               <Label htmlFor="codePass">Senha de Segurança</Label>
                               <Input 
                                  id="codePass" 
                                  type="password" 
                                  placeholder="Confirmar senha..." 
                                  value={codePasswordInput}
                                  onChange={(e) => setCodePasswordInput(e.target.value)}
                                  className="bg-secondary/50 border-border h-12 text-center"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold bg-destructive hover:bg-destructive/90 text-white">
                               Desbloquear Código Fonte
                            </Button>
                         </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden border-t-4 border-t-accent">
                      <CardHeader className="bg-secondary/20 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-white font-headline">Veredito AI Source (API Integral)</CardTitle>
                          <CardDescription>Código de programação do motor e integração DataJud.</CardDescription>
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
                        <ScrollArea className="h-[450px] w-full bg-black/40">
                          <pre className="p-6 text-[11px] font-mono text-accent/80 leading-relaxed whitespace-pre-wrap">
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

        <footer className="h-12 border-t border-border/30 bg-sidebar/30 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest shrink-0">
          <span>2026 W1 Capital. Todos os direitos reservados.</span>
          <span className="w-1 h-1 bg-muted-foreground rounded-full opacity-30" />
          <span className="text-primary/70">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function IaOption({ id, value, title, desc, active }: { id: string, value: string, title: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group", 
      active ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(37,99,235,0.1)]" : "bg-secondary/20 border-border hover:border-primary/50"
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
