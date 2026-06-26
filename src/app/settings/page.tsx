"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { HardDrive, Cpu, Lock, Unlock, RefreshCcw, CheckCircle2, AlertCircle, BrainCircuit, Zap, KeyRound } from 'lucide-react';
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Sync');
  const [passwordInput, setPasswordInput] = useState('');
  const [iaModel, setIaModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [deepThinking, setDeepThinking] = useState(false);
  
  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA) setIaModel(savedIA as any);
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

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl">System Settings</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] uppercase font-bold tracking-widest">v18.0 Elite</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className="w-full justify-start rounded-xl font-bold"><HardDrive size={18} className="mr-2" /> Sync</Button>
              <Button variant={activeTab === 'IA' ? 'default' : 'ghost'} onClick={() => setActiveTab('IA')} className="w-full justify-start rounded-xl font-bold"><Cpu size={18} className="mr-2" /> Intelligence</Button>
              <Button variant={activeTab === 'Admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('Admin')} className="w-full justify-start rounded-xl font-bold"><Lock size={18} className="mr-2" /> Admin Portal</Button>
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Sync' && (
                <Card className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-secondary/20">
                    <CardTitle className="text-white font-headline">Cloud Infrastructure</CardTitle>
                    <CardDescription>Status da conexão com o banco de dados PostgreSQL (Supabase).</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-xl border border-border shadow-inner">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          Database Online
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] bg-black/20 px-2 py-1 rounded w-fit">
                          seg*************************
                        </p>
                      </div>
                      <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 font-black uppercase text-[10px] px-4 py-1">Ativo</Badge>
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
                    <CardDescription>O modo Admin libera ferramentas de purga de dados e importação em massa.</CardDescription>
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
                              placeholder="Digite a senha de 8 dígitos..." 
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
            </div>
          </div>
        </div>
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
