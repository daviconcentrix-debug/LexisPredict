
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Shield, HardDrive, RefreshCcw, CheckCircle2, AlertCircle, Lock, Unlock, Cpu, Copyright, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { useAdmin } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Sync');
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('online');
  const [password, setPassword] = useState('');
  const [iaModel, setIaModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  
  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('lexisPredict_preferred_ia');
    if (saved === 'grok' || saved === 'gemini' || saved === 'openrouter') {
      setIaModel(saved as any);
    }
    handleManualSync();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const data = await fetchRepoCases();
      if (Array.isArray(data)) {
        setStatus('online');
        toast({ title: "Supabase Synced", description: `${data.length} records refreshed from cloud.` });
      } else {
        setStatus('offline');
      }
    } catch (e) {
      setStatus('offline');
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleIaChange = (value: 'gemini' | 'grok' | 'openrouter') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Motor IA Alterado", description: `Engine ${value.toUpperCase()} configurada como padrão.` });
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      toast({ title: "Admin Mode Active", description: "Full access granted." });
      setPassword('');
    } else {
      toast({ title: "Auth Failed", description: "Incorrect administrative password.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">System Settings</h1>
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase font-bold",
              status === 'online' ? "text-chart-3 border-chart-3/30" : "text-destructive border-destructive/30"
            )}>
              {status === 'online' ? "CRM OPERATIONAL" : "DATABASE OFFLINE"}
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 space-y-1">
              <NavSettingItem icon={<HardDrive size={18} />} label="Cloud Sync" active={activeTab === 'Sync'} onClick={() => setActiveTab('Sync')} />
              <NavSettingItem icon={<Cpu size={18} />} label="Intelligence" active={activeTab === 'IA'} onClick={() => setActiveTab('IA')} />
              <NavSettingItem icon={<Lock size={18} />} label="Admin Access" active={activeTab === 'Admin'} onClick={() => setActiveTab('Admin')} />
            </aside>

            <div className="md:col-span-3 space-y-8">
              {activeTab === 'IA' && (
                <Card className="bg-card border-border shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Cpu className="text-primary" />
                      <CardTitle className="text-white font-headline text-lg">AI OmniEngine Selection</CardTitle>
                    </div>
                    <CardDescription>Configure o motor de processamento para análises de processos.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={iaModel} onValueChange={(v) => handleIaChange(v as any)} className="grid gap-3">
                      <IaOption id="gemini" value="gemini" title="Google Gemini 2.0 Flash" desc="Alta velocidade e integração DataJud." active={iaModel === 'gemini'} />
                      <IaOption id="grok" value="grok" title="X.AI Grok (via Groq)" desc="Máxima performance e precisão técnica." active={iaModel === 'grok'} />
                      <IaOption id="openrouter" value="openrouter" title="OpenRouter (DeepSeek R1)" desc="Raciocínio lógico de elite e Deep Thinking." active={iaModel === 'openrouter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Admin' && (
                <Card className="bg-card border-border shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {isAdmin ? <Unlock className="text-primary" /> : <Lock className="text-muted-foreground" />}
                      <CardTitle className="text-white font-headline text-lg">Administrative Triage</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isAdmin ? (
                      <Button variant="destructive" onClick={logout} className="w-full font-bold">Exit Admin Mode</Button>
                    ) : (
                      <form onSubmit={handleAdminAuth} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="adminPass">Admin Password</Label>
                          <Input id="adminPass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-none" placeholder="••••••••" />
                        </div>
                        <Button type="submit" className="w-full font-bold">Authorize Access</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Sync' && (
                <Card className="bg-card border-border shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white font-headline text-lg">CRM Cloud Engine</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        {status === 'online' ? <CheckCircle2 className="w-5 h-5 text-chart-3" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
                        <div>
                          <p className="text-sm font-bold text-white">Supabase Connection</p>
                          <p className="text-xs text-muted-foreground">{status === 'online' ? "Ativo e Saudável" : "Erro de Configuração"}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleManualSync} disabled={syncing || !isAdmin} className="text-[10px] font-bold uppercase">
                        {syncing ? <RefreshCcw className="w-3 h-3 animate-spin mr-2" /> : "Force Refresh"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <footer className="pt-12 border-t border-border/30 text-center space-y-2 opacity-40">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Copyright size={10} /> 2024 W1 Capital. Todos os direitos reservados.
            </div>
            <p className="text-[8px] uppercase tracking-tighter font-medium text-primary">FUNDADOR DAVI ALVES FIGUEREDO</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function IaOption({ id, value, title, desc, active }: { id: string, value: string, title: string, desc: string, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
      active ? "bg-primary/10 border-primary shadow-lg" : "bg-secondary/20 border-border"
    )}>
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <div>
          <Label htmlFor={id} className="text-white font-bold cursor-pointer">{title}</Label>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      {active && <Badge className="bg-primary/20 text-primary text-[8px]">Ativo</Badge>}
    </div>
  );
}

function NavSettingItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all", active ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-secondary hover:text-white")}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
