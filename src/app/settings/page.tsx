
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { HardDrive, Cpu, Lock, Unlock, RefreshCcw, CheckCircle2, AlertCircle, BrainCircuit, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="font-headline font-bold text-xl">System Settings</h1>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className="w-full justify-start"><HardDrive size={18} className="mr-2" /> Sync</Button>
              <Button variant={activeTab === 'IA' ? 'default' : 'ghost'} onClick={() => setActiveTab('IA')} className="w-full justify-start"><Cpu size={18} className="mr-2" /> Intelligence</Button>
              <Button variant={activeTab === 'Admin' ? 'default' : 'ghost'} onClick={() => setActiveTab('Admin')} className="w-full justify-start"><Lock size={18} className="mr-2" /> Admin</Button>
            </aside>

            <div className="md:col-span-3 space-y-6">
              {activeTab === 'IA' && (
                <>
                  <Card className="bg-card">
                    <CardHeader><CardTitle>AI OmniEngine Selection</CardTitle></CardHeader>
                    <CardContent>
                      <RadioGroup value={iaModel} onValueChange={v => handleIaChange(v as any)} className="grid gap-3">
                        <IaOption id="gemini" value="gemini" title="Google Gemini 1.5 Flash" desc="Alta velocidade." active={iaModel === 'gemini'} />
                        <IaOption id="grok" value="grok" title="Groq (Llama 3.3)" desc="Performance em JSON." active={iaModel === 'grok'} />
                        <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet (Elite)" desc="Raciocínio jurídico superior." active={iaModel === 'openrouter'} />
                      </RadioGroup>
                    </CardContent>
                  </Card>
                  <Card className="bg-card">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="text-primary" />
                        <div>
                          <p className="text-sm font-bold">Modo Pensamento Profundo</p>
                          <p className="text-xs text-muted-foreground">Ativa o Chain-of-Thought jurídico.</p>
                        </div>
                      </div>
                      <Switch checked={deepThinking} onCheckedChange={handleThinkingChange} />
                    </CardContent>
                  </Card>
                </>
              )}
              {activeTab === 'Admin' && (
                <Card className="bg-card">
                  <CardHeader><CardTitle>Admin Access</CardTitle></CardHeader>
                  <CardContent>
                    {isAdmin ? <Button variant="destructive" onClick={logout} className="w-full">Sair do Admin</Button> : <p className="text-sm opacity-50">Acesse via senha nas páginas restritas.</p>}
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
    <div className={cn("flex items-center justify-between p-4 rounded-xl border", active ? "bg-primary/10 border-primary" : "bg-secondary/20")}>
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <div>
          <Label htmlFor={id} className="text-white font-bold">{title}</Label>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}
