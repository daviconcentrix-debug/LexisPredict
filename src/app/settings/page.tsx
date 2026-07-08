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
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState('Sync');
  const [iaModel, setIaModel] = useState<'grok' | 'openrouter'>('grok');
  const [empresaUsers, setEmpresaUsers] = useState<UserProfile[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddUser] = useState(false);
  
  const [wpMode, setWpMode] = useState<'global' | 'separate' | 'main_only' | 'sidebar_only'>('global');
  const [mainWpUrl, setMainWpUrl] = useState('');
  const [sideWpUrl, setSideWpUrl] = useState('');
  const [mainWpType, setMainWpType] = useState<'image' | 'video'>('image');
  const [sideWpType, setSideWpType] = useState<'image' | 'video'>('image');
  const [wpOpacity, setWpOpacity] = useState(1);
  
  const [autoTheme, setAutoTheme] = useState(false);
  const [bgColor, setBgColor] = useState('#f3f2f2');
  const [fontColor, setFontColor] = useState('#000000');
  const [unselectedFontColor, setUnselectedFontColor] = useState('#000000');
  const [btnBgColor, setBtnBgColor] = useState('#000000');
  const [unselectedBtnBgColor, setUnselectedBtnBgColor] = useState('#ffffff');
  const [btnTextColor, setBtnTextColor] = useState('#ffffff');
  const [iconColor, setIconColor] = useState('#000000');
  const [borderColor, setBorderColor] = useState('#000000');
  const [containerOpacity, setContainerOpacity] = useState(1);

  const isMounted = useRef(true);

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
      if (savedIA === 'grok' || savedIA === 'openrouter') {
        setIaModel(savedIA as any);
      } else {
        setIaModel('grok');
      }

      setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2');
      setFontColor(localStorage.getItem('lexisPredict_font_color') || '#000000');
      setUnselectedFontColor(localStorage.getItem('lexisPredict_unselected_font_color') || '#000000');
      setBtnBgColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#000000');
      setUnselectedBtnBgColor(localStorage.getItem('lexisPredict_unselected_btn_bg_color') || '#ffffff');
      setBtnTextColor(localStorage.getItem('lexisPredict_btn_text_color') || '#ffffff');
      setIconColor(localStorage.getItem('lexisPredict_icon_color') || '#000000');
      setBorderColor(localStorage.getItem('lexisPredict_border_color') || '#000000');
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

  const handleIaChange = (value: 'grok' | 'openrouter') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Núcleo Técnico Alterado", description: `Motor ${value.toUpperCase()} ativado.` });
  };

  const handleColorChange = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('storage'));
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

  const saveWpSettings = () => {
    localStorage.setItem('lexis_wp_mode', wpMode);
    localStorage.setItem('lexis_wp_main_url', mainWpUrl);
    localStorage.setItem('lexis_wp_sidebar_url', sideWpUrl);
    localStorage.setItem('lexis_wp_main_type', mainWpType);
    localStorage.setItem('lexis_wp_sidebar_type', sideWpType);
    localStorage.setItem('lexis_wp_opacity', wpOpacity.toString());
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Configurações Salvas" });
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
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v390.0 Elite Resiliente</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Sync' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <HardDrive size={18} className="mr-2" /> Infraestrutura Cloud
              </Button>
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Engine' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Cpu size={18} className="mr-2" /> Núcleo Técnico
              </Button>
              <Button variant={activeTab === 'Style' ? 'default' : 'ghost'} onClick={() => setActiveTab('Style')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Style' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Palette size={18} className="mr-2" /> Atmosfera Multimídia
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
              {activeTab === 'Style' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                      <Palette size={18} /> Atmosfera de Gabinete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    
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

                    <div className="space-y-4">
                      <Label className="font-black text-black text-xs uppercase">Modo de Aplicação de Fundo</Label>
                      <RadioGroup value={wpMode} onValueChange={(v: any) => setWpMode(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <WpModeOption id="global" value="global" label="Mesmo WP (Conteúdo + Menu)" />
                        <WpModeOption id="separate" value="separate" label="Diferentes (Main/Side)" />
                        <WpModeOption id="main_only" value="main_only" label="Apenas Conteúdo" />
                        <WpModeOption id="sidebar_only" value="sidebar_only" label="Apenas Sidebar" />
                      </RadioGroup>
                    </div>

                    <div className="space-y-6">
                      <Label className="font-black text-black text-xs uppercase flex items-center gap-2"><Layers size={14}/> Opacidade dos Containers ({Math.round(containerOpacity * 100)}%)</Label>
                      <Slider value={[containerOpacity]} onValueChange={([v]) => handleOpacityChange(v)} max={1} step={0.01} className="[&_[role=slider]]:bg-black" />
                    </div>

                    <div className="pt-4 border-t-2 border-black space-y-8 relative">
                       {autoTheme && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center p-8 text-center border-2 border-black m-[-2px]">
                            <div className="bg-black text-white p-8 border-2 border-black shadow-[15px_15px_0px_#facc15] flex flex-col items-center gap-4">
                               <Bot size={48} className="animate-bounce text-yellow-400" />
                               <p className="text-sm font-black uppercase tracking-tighter">IA NO COMANDO</p>
                               <Button size="sm" onClick={() => handleAutoThemeToggle(false)} className="bg-yellow-400 text-black font-black uppercase text-[10px] rounded-none border-2 border-black hover:bg-white transition-all w-full h-10">Desativar Automático</Button>
                            </div>
                         </div>
                       )}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                          <ColorPicker label="Fundo Base" value={bgColor} onChange={(v) => handleColorChange('lexisPredict_bg_color', v, setBgColor)} />
                          <ColorPicker label="Letras (Ativo)" value={fontColor} onChange={(v) => handleColorChange('lexisPredict_font_color', v, setFontColor)} />
                          <ColorPicker label="Letras (Inativa)" value={unselectedFontColor} onChange={(v) => handleColorChange('lexisPredict_unselected_font_color', v, setUnselectedFontColor)} />
                          <ColorPicker label="Botão (Ativo)" value={btnBgColor} onChange={(v) => handleColorChange('lexisPredict_btn_bg_color', v, setBtnBgColor)} />
                          <ColorPicker label="Botão (Inativo)" value={unselectedBtnBgColor} onChange={(v) => handleColorChange('lexisPredict_unselected_btn_bg_color', v, setUnselectedBtnBgColor)} />
                          <ColorPicker label="Texto Botão" value={btnTextColor} onChange={(v) => handleColorChange('lexisPredict_btn_text_color', v, setBtnTextColor)} />
                          <ColorPicker label="Cor dos Ícones" value={iconColor} onChange={(v) => handleColorChange('lexisPredict_icon_color', v, setIconColor)} />
                          <ColorPicker label="Cor das Bordas" value={borderColor} onChange={(v) => handleColorChange('lexisPredict_border_color', v, setBorderColor)} />
                       </div>
                    </div>

                    <Button onClick={saveWpSettings} className="w-full h-12 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Sincronizar Atmosfera</Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Núcleo Neural Elite</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase">Motores de processamento resilientes v390.0.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={iaModel} onValueChange={handleIaChange} className="grid grid-cols-1 gap-4">
                      <IaOption id="grok" value="grok" title="Grok (Llama 3.3)" desc="Raciocínio lógico militar e alta velocidade de resposta." active={iaModel === 'grok'} />
                      <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet" desc="Elite em nuances jurídicas e redação estratégica de gabinete." active={iaModel === 'openrouter'} />
                    </RadioGroup>
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
                               <DialogDescription className="sr-only">Formulário de criação de novo operador de gabinete.</DialogDescription>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                               <Input value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} placeholder="NOME" className="border-2 border-black font-black rounded-none" required />
                               <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} placeholder="E-MAIL" className="border-2 border-black font-black rounded-none" required />
                               <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="SENHA" className="border-2 border-black rounded-none" required />
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

function WpModeOption({ id, value, label }: { id: string, value: string, label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 p-3 border-2 border-black bg-white cursor-pointer hover:bg-black group transition-all">
      <RadioGroupItem value={value} id={id} className="border-black group-hover:border-white" />
      <span className="text-[10px] font-black uppercase group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
       <Label className="text-[9px] font-black uppercase text-black/50">{label}</Label>
       <div className="flex gap-2 items-center">
         <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 border-2 border-black cursor-pointer bg-white" />
         <Input value={value} readOnly className="font-mono border-2 border-black text-black font-black rounded-none h-9 uppercase text-[9px]" />
       </div>
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
