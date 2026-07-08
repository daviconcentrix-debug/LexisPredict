
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  HardDrive, 
  Cpu,
  Palette,
  Users,
  UserPlus,
  Trash2,
  Zap,
  Bot,
  Layers,
  Skull,
  ShieldCheck,
  Upload,
  FileVideo,
  ImageIcon,
  Link as LinkIcon,
  Sparkles,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { getEmpresaUsers, removeEmpresaUser } from '@/lib/server-db';
import { UserProfile, supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { browserStorage } from '@/lib/browser-storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Engine');
  const [iaModel, setIaModel] = useState<'grok' | 'xai' | 'puter' | 'airforce'>('xai');
  const [empresaUsers, setEmpresaUsers] = useState<UserProfile[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddUser] = useState(false);
  
  const [visualMode, setVisualMode] = useState<'elite' | 'aura'>('elite');
  const [wpMode, setWpMode] = useState<'global' | 'separate' | 'main_only' | 'sidebar_only'>('global');
  const [mainWpUrl, setMainWpUrl] = useState('');
  const [sideWpUrl, setSideWpUrl] = useState('');
  const [mainWpType, setMainWpType] = useState<'image' | 'video'>('image');
  const [sideWpType, setSideWpType] = useState<'image' | 'video'>('image');
  const [wpOpacity, setWpOpacity] = useState(1);
  
  const [autoTheme, setAutoTheme] = useState(false);
  const [containerOpacity, setContainerOpacity] = useState(1);

  const isMounted = useRef(true);
  const mainFileInput = useRef<HTMLInputElement>(null);
  const sideFileInput = useRef<HTMLInputElement>(null);

  const [newUserForm, setNewUserForm] = useState({
    nome: '',
    email: '',
    password: '',
    cargo: 'Operador' as any
  });

  const { isAdmin, profile } = useAdmin();
  const { toast } = useToast();

  const isDevAccount = profile?.email?.toLowerCase() === 'daviconcentrix@gmail.com';

  useEffect(() => {
    isMounted.current = true;
    
    const loadSettings = () => {
      const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
      if (savedIA === 'grok' || savedIA === 'xai' || savedIA === 'puter' || savedIA === 'airforce') {
        setIaModel(savedIA as any);
      } else {
        setIaModel('xai');
      }

      setVisualMode((localStorage.getItem('lexis_visual_mode') as any) || 'elite');
      setContainerOpacity(parseFloat(localStorage.getItem('lexisPredict_container_opacity') || '1'));
      setAutoTheme(localStorage.getItem('lexis_auto_theme') === 'true');

      setWpMode((localStorage.getItem('lexis_wp_mode') as any) || 'global');
      setMainWpUrl(localStorage.getItem('lexis_wp_main_url') || '');
      setSideWpUrl(localStorage.getItem('lexis_wp_sidebar_url') || '');
      setMainWpType((localStorage.getItem('lexis_wp_main_type') as any) || 'image');
      setSideWpType((localStorage.getItem('lexis_wp_sidebar_type') as any) || 'image');
      setWpOpacity(parseFloat(localStorage.getItem('lexis_wp_opacity') || '1'));
    };

    loadSettings();
    loadUsers();
    return () => { isMounted.current = false; };
  }, [profile?.empresa_id]);

  const loadUsers = async () => {
    const users = await getEmpresaUsers();
    if (isMounted.current) setEmpresaUsers(users);
  };

  const handleIaChange = (value: 'grok' | 'xai' | 'puter' | 'airforce') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Núcleo Técnico Alterado", description: `Motor ${value.toUpperCase()} ativado.` });
  };

  const handleVisualModeChange = (mode: 'elite' | 'aura') => {
    setVisualMode(mode);
    localStorage.setItem('lexis_visual_mode', mode);
    window.dispatchEvent(new Event('storage'));
    toast({ title: mode === 'aura' ? "Aura Minimalist Ativado" : "Elite Edition Ativado" });
  };

  const handleOpacityChange = (value: number) => {
    setContainerOpacity(value);
    localStorage.setItem('lexisPredict_container_opacity', value.toString());
    window.dispatchEvent(new Event('storage'));
  };

  const handleAutoThemeToggle = (checked: boolean) => {
    setAutoTheme(checked);
    localStorage.setItem('lexis_auto_theme', checked ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'side') => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({ title: "Processando Mídia..." });
    const key = target === 'main' ? 'main_wallpaper_blob' : 'side_wallpaper_blob';
    const success = await browserStorage.saveAsset(key, file);

    if (success) {
      if (target === 'main') {
        setMainWpUrl('LOCAL_ASSET');
        setMainWpType(file.type.includes('video') ? 'video' : 'image');
      } else {
        setSideWpUrl('LOCAL_ASSET');
        setSideWpType(file.type.includes('video') ? 'video' : 'image');
      }
      toast({ title: "Mídia Sincronizada" });
    }
  };

  const saveWpSettings = () => {
    localStorage.setItem('lexis_wp_mode', wpMode);
    localStorage.setItem('lexis_wp_main_url', mainWpUrl);
    localStorage.setItem('lexis_wp_sidebar_url', sideWpUrl);
    localStorage.setItem('lexis_wp_main_type', mainWpType);
    localStorage.setItem('lexis_wp_sidebar_type', sideWpType);
    localStorage.setItem('lexis_wp_opacity', wpOpacity.toString());
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Atmosfera Sincronizada" });
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingUser || !profile?.empresa_id) return;
    setIsAddUser(true);
    try {
      const cleanEmail = newUserForm.email.trim().toLowerCase();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: newUserForm.password,
        options: { data: { full_name: newUserForm.nome } }
      });
      if (authError) throw authError;
      await supabase.from('usuarios').insert({
        auth_user_id: authData.user?.id,
        empresa_id: profile.empresa_id,
        nome: newUserForm.nome.trim().toUpperCase(),
        email: cleanEmail,
        cargo: newUserForm.cargo
      });
      toast({ title: "Operador Adicionado" });
      setIsAddUserModalOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsAddUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.id) return;
    if (confirm("Remover este usuário?")) {
       const success = await removeEmpresaUser(userId);
       if (success) { loadUsers(); toast({ title: "Usuário Removido" }); }
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Configuração Sistema</h1>
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v620.0 Elite Supremacy</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Engine' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Cpu size={18} className="mr-2" /> Núcleo Técnico
              </Button>
              <Button variant={activeTab === 'Style' ? 'default' : 'ghost'} onClick={() => setActiveTab('Style')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Style' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Palette size={18} className="mr-2" /> Atmosfera Multimídia
              </Button>
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Sync' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <HardDrive size={18} className="mr-2" /> Infraestrutura Cloud
              </Button>
              <Button variant={activeTab === 'Users' ? 'default' : 'ghost'} onClick={() => setActiveTab('Users')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Users' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Users size={18} className="mr-2" /> Gestão de Equipe
              </Button>
              {isDevAccount && (
                <Button variant={activeTab === 'Master' ? 'default' : 'ghost'} onClick={() => setActiveTab('Master')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-l-4 border-l-red-600 border-2 border-transparent", activeTab === 'Master' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                  <Skull size={18} className="mr-2 text-red-600" /> Gabinete Master
                </Button>
              )}
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Tríade de Inteligência</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase">Motores de processamento em redundância circular.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={iaModel} onValueChange={handleIaChange as any} className="grid grid-cols-1 gap-4">
                      <IaOption id="xai" value="xai" title="xAI GROK 4.5" desc="Núcleo de soberania e raciocínio jurídico avançado." active={iaModel === 'xai'} />
                      <IaOption id="grok" value="grok" title="GROQ (LLAMA 3.3)" desc="Redundância ultra-rápida para triagem em massa." active={iaModel === 'grok'} />
                      <IaOption id="airforce" value="airforce" title="AIRFORCE (DEEPSEEK V3)" desc="Redundância quaternária de alta fidelidade." active={iaModel === 'airforce'} />
                      <IaOption id="puter" value="puter" title="PUTER AI (CLAUDE)" desc="Reserva de emergência para alta disponibilidade." active={iaModel === 'puter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Style' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                      <Palette size={18} /> Atmosfera de Gabinete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="space-y-4">
                      <Label className="font-black text-black text-xs uppercase flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-500" /> Modo de Experiência Visual
                      </Label>
                      <RadioGroup value={visualMode} onValueChange={(v: any) => handleVisualModeChange(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label htmlFor="mode-elite" className={cn(
                          "flex items-center gap-3 p-5 border-2 border-black bg-white cursor-pointer transition-all",
                          visualMode === 'elite' ? "bg-black text-white" : "hover:bg-gray-50"
                        )}>
                          <RadioGroupItem value="elite" id="mode-elite" className={visualMode === 'elite' ? "border-white" : "border-black"} />
                          <div>
                            <p className="font-black text-[10px] uppercase">Elite Edition</p>
                            <p className="text-[8px] uppercase opacity-60">Shadows, Cantos Secos, 3D Isométrico.</p>
                          </div>
                        </label>
                        <label htmlFor="mode-aura" className={cn(
                          "flex items-center gap-3 p-5 border-2 border-black bg-white cursor-pointer transition-all",
                          visualMode === 'aura' ? "bg-black text-white" : "hover:bg-gray-50"
                        )}>
                          <RadioGroupItem value="aura" id="mode-aura" className={visualMode === 'aura' ? "border-white" : "border-black"} />
                          <div>
                            <p className="font-black text-[10px] uppercase">Aura Minimalist</p>
                            <p className="text-[8px] uppercase opacity-60">Glassmorphism, Rounds, Ultra Clean.</p>
                          </div>
                        </label>
                      </RadioGroup>
                    </div>

                    <div className="p-5 bg-black border-2 border-black flex items-center justify-between group transition-all cursor-default shadow-[8px_8px_0px_#facc15]">
                       <div className="flex items-center gap-4">
                          <div className="bg-white p-2 border-2 border-black">
                            <Zap size={24} className="text-black animate-pulse" />
                          </div>
                          <div>
                            <p className="font-black text-xs uppercase text-white tracking-widest">Sincronização Cromática IA</p>
                            <p className="text-[9px] font-black uppercase text-white/60">Adapta cores ao background quadro a quadro.</p>
                          </div>
                       </div>
                       <Switch checked={autoTheme} onCheckedChange={handleAutoThemeToggle} className="data-[state=checked]:bg-yellow-400 border-2 border-white" />
                    </div>

                    <div className="space-y-8 pt-4 border-t-2 border-black">
                       <div className="space-y-4">
                          <Label className="font-black text-black text-xs uppercase">Wallpaper Principal (Conteúdo)</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                   <Badge variant="outline" className={cn("text-[8px] font-black uppercase cursor-pointer", mainWpType === 'image' ? "bg-black text-white" : "")} onClick={() => setMainWpType('image')}>Imagem</Badge>
                                   <Badge variant="outline" className={cn("text-[8px] font-black uppercase cursor-pointer", mainWpType === 'video' ? "bg-black text-white" : "")} onClick={() => setMainWpType('video')}>Vídeo</Badge>
                                </div>
                                <div className="relative">
                                   <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                                   <Input placeholder="URL EXTERNA..." value={mainWpUrl === 'LOCAL_ASSET' ? 'ARQUIVO LOCAL CARREGADO' : mainWpUrl} onChange={e => setMainWpUrl(e.target.value)} className="pl-10 border-2 border-black h-11 text-[10px] font-black uppercase rounded-none" />
                                </div>
                             </div>
                             <div className="flex flex-col justify-end">
                                <input type="file" ref={mainFileInput} className="hidden" onChange={e => handleFileUpload(e, 'main')} accept="image/*,video/*" />
                                <Button onClick={() => mainFileInput.current?.click()} variant="outline" className="border-2 border-black h-11 font-black uppercase text-[10px] rounded-none hover:bg-black hover:text-white transition-all">
                                   <Upload size={14} className="mr-2" /> Upload Local
                                </Button>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6 pt-4 border-t-2 border-black/5">
                          <Label className="font-black text-black text-xs uppercase flex items-center gap-2"><Layers size={14}/> Opacidade do Fundo ({Math.round(wpOpacity * 100)}%)</Label>
                          <Slider value={[wpOpacity]} onValueChange={([v]) => setWpOpacity(v)} max={1} step={0.01} className="[&_[role=slider]]:bg-black" />
                       </div>

                       <div className="space-y-6">
                          <Label className="font-black text-black text-xs uppercase flex items-center gap-2"><Layers size={14}/> Opacidade dos Containers ({Math.round(containerOpacity * 100)}%)</Label>
                          <Slider value={[containerOpacity]} onValueChange={([v]) => handleOpacityChange(v)} max={1} step={0.01} className="[&_[role=slider]]:bg-black" />
                       </div>
                    </div>

                    <Button onClick={saveWpSettings} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Sincronizar Atmosfera</Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Sync' && (
                 <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Infraestrutura Blindada</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-8 bg-[#f3f2f2] rounded-none border-2 border-black border-dashed flex flex-col items-center justify-center text-center space-y-4">
                      <ShieldCheck size={48} className="text-green-600" />
                      <div>
                        <p className="font-black text-black uppercase text-sm">Gabinete Cloud Sincronizado</p>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Conexão SaaS Multi-Tenant Blindada</p>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black uppercase text-[10px] px-6 py-1.5 rounded-none shadow-[4px_4px_0px_#000]">Status: Operacional</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Users' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black flex flex-row items-center justify-between">
                    <CardTitle className="text-black font-black uppercase text-sm">Corpo Técnico</CardTitle>
                    {isAdmin && (
                       <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                         <DialogTrigger asChild>
                           <Button size="sm" className="bg-white text-black border-2 border-black h-9 uppercase text-[10px] font-black hover:bg-black transition-all rounded-none px-6">
                              <UserPlus size={12} className="mr-2" /> Novo Operador
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="bg-white border-2 border-black text-black rounded-none">
                            <form onSubmit={handleCreateOperator}>
                             <DialogHeader>
                               <DialogTitle className="text-black font-black uppercase">Provisionar Acesso</DialogTitle>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                               <Input value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} placeholder="NOME" className="border-2 border-black font-black rounded-none" required />
                               <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} placeholder="E-MAIL" className="border-2 border-black font-black rounded-none" required />
                               <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="SENHA" className="border-2 border-black font-black rounded-none" required />
                             </div>
                             <DialogFooter>
                               <Button type="submit" disabled={isAddingUser} className="w-full bg-black text-white font-black uppercase h-12 rounded-none">Provisionar</Button>
                             </DialogFooter>
                           </form>
                         </DialogContent>
                       </Dialog>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y-2 divide-black/10">
                      {empresaUsers.map((u) => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-black group transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-9 h-9 bg-[#f3f2f2] group-hover:bg-white flex items-center justify-center font-black text-xs border-2 border-black uppercase">
                                 {u.nome?.substring(0, 2) || '??'}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-black group-hover:text-white uppercase">{u.nome}</p>
                                 <p className="text-[9px] font-bold text-black/40 group-hover:text-white/40">{u.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-2 border-black text-black group-hover:bg-white group-hover:text-black font-black uppercase text-[8px] h-6 rounded-none">
                                 {u.cargo}
                              </Badge>
                              {isAdmin && u.id !== profile?.id && (
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-black/20 group-hover:text-red-50 hover:bg-transparent h-8 w-8">
                                    <Trash2 size={14} />
                                 </Button>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
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
      "flex items-center justify-between p-5 rounded-none border-2 transition-all cursor-pointer group", 
      active ? "bg-black border-black" : "bg-white border-black/10 hover:border-black shadow-[4px_4px_0px_#000]"
    )}>
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} className={cn("border-2 border-black", active ? "text-white border-white" : "text-black")} />
        <div>
          <p className={cn("font-black text-xs uppercase transition-colors", active ? "text-white" : "text-black")}>{title}</p>
          <p className={cn("text-[9px] font-black uppercase transition-colors", active ? "text-white/60" : "text-black/40")}>{desc}</p>
        </div>
      </div>
      {active && <Zap className="text-yellow-400 fill-yellow-400" size={16} />}
    </label>
  );
}
