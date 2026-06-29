"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  HardDrive, 
  Cpu,
  Palette,
  Image as ImageIcon,
  Users,
  UserPlus,
  Trash2,
  Video,
  Upload,
  Skull,
  ShieldAlert,
  CheckCircle2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Sync');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [isMasterActive, setIsMasterActive] = useState(false);
  const [iaModel, setIaModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [empresaUsers, setEmpresaUsers] = useState<UserProfile[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddUser] = useState(false);
  
  const [wpMode, setWpMode] = useState<'global' | 'separate' | 'main_only' | 'sidebar_only'>('global');
  const [mainWpUrl, setMainWpUrl] = useState('');
  const [sideWpUrl, setSideWpUrl] = useState('');
  const [mainWpType, setMainWpType] = useState<'image' | 'video'>('image');
  const [sideWpType, setSideWpType] = useState<'image' | 'video'>('image');
  const [wpOpacity, setWpOpacity] = useState(1);
  const [bgColor, setBgColor] = useState('#f3f2f2');

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const sideFileInputRef = useRef<HTMLInputElement>(null);
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
    
    setIaModel((localStorage.getItem('lexisPredict_preferred_ia') as any) || 'gemini');
    setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2');
    setWpMode((localStorage.getItem('lexis_wp_mode') as any) || 'global');
    setMainWpUrl(localStorage.getItem('lexis_wp_main_url') || '');
    setSideWpUrl(localStorage.getItem('lexis_wp_sidebar_url') || '');
    setMainWpType((localStorage.getItem('lexis_wp_main_type') as any) || 'image');
    setSideWpType((localStorage.getItem('lexis_wp_sidebar_type') as any) || 'image');
    setWpOpacity(parseFloat(localStorage.getItem('lexis_wp_opacity') || '1'));

    const cookies = document.cookie.split('; ');
    const masterUnlock = cookies.find(row => row.startsWith('lexis_master_unlock='))?.split('=')[1];
    if (masterUnlock === '40028922' && isDevAccount) {
      setIsMasterActive(true);
    }

    loadUsers();
    return () => { isMounted.current = false; };
  }, [profile?.empresa_id]);

  const loadUsers = async () => {
    const users = await getEmpresaUsers();
    if (isMounted.current) setEmpresaUsers(users);
  };

  const handleIaChange = (value: 'gemini' | 'grok' | 'openrouter') => {
    setIaModel(value);
    localStorage.setItem('lexisPredict_preferred_ia', value);
    toast({ title: "Núcleo Técnico Alterado", description: `Motor ${value.toUpperCase()} ativado.` });
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBgColor(val);
    localStorage.setItem('lexisPredict_bg_color', val);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLocalFile = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'side') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageKey = target === 'main' ? 'main_wallpaper_blob' : 'side_wallpaper_blob';
      const success = await browserStorage.saveAsset(storageKey, file);
      
      if (success) {
        if (target === 'main') setMainWpUrl('LOCAL_ASSET');
        else setSideWpUrl('LOCAL_ASSET');
        toast({ title: "Arquivo Local Carregado", description: "O wallpaper foi salvo no banco local." });
      }
    } catch (err) {
      toast({ title: "Erro de Armazenamento", description: "Não foi possível processar o arquivo.", variant: "destructive" });
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
    toast({ title: "Configurações Salvas", description: "Atmosfera de gabinete atualizada." });
  };

  const handleUnlockMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasswordInput === '40028922') {
      const cookieParams = "path=/; max-age=31536000; samesite=lax";
      document.cookie = `lexis_master_unlock=40028922; ${cookieParams}`;
      document.cookie = `lexis_master_email=daviconcentrix@gmail.com; ${cookieParams}`;
      setIsMasterActive(true);
      toast({ title: "Gabinete Master Desbloqueado" });
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast({ title: "Token Inválido", variant: "destructive" });
    }
  };

  const handleLockMaster = () => {
    document.cookie = "lexis_master_unlock=; path=/; max-age=0";
    document.cookie = "lexis_master_email=; path=/; max-age=0";
    setIsMasterActive(false);
    window.location.reload();
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

      const profilePayload = {
        auth_user_id: authData.user?.id,
        empresa_id: profile.empresa_id,
        nome: newUserForm.nome.trim().toUpperCase(),
        email: cleanEmail,
        cargo: newUserForm.cargo
      };

      await supabase.from('usuarios').insert(profilePayload);
      toast({ title: "Operador Adicionado" });
      setIsAddUserModalOpen(false);
      setNewUserForm({ nome: '', email: '', password: '', cargo: 'Operador' });
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
       if (success) {
          toast({ title: "Usuário Removido" });
          loadUsers();
       }
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Configuração Sistema</h1>
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v98.0 Elite Local</Badge>
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
                      <Palette size={18} /> Atmosfera de Gabinete (IndexedDB)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="space-y-4">
                      <Label className="font-black text-black text-xs uppercase">Modo de Aplicação</Label>
                      <RadioGroup value={wpMode} onValueChange={(v: any) => setWpMode(v)} className="grid grid-cols-2 gap-4">
                        <WpModeOption id="global" value="global" label="Mesmo WP (Conteúdo + Menu)" />
                        <WpModeOption id="separate" value="separate" label="Diferentes (Main/Side)" />
                        <WpModeOption id="main_only" value="main_only" label="Apenas Conteúdo" />
                        <WpModeOption id="sidebar_only" value="sidebar_only" label="Apenas Sidebar" />
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      {(wpMode === 'global' || wpMode === 'main_only' || wpMode === 'separate') && (
                        <div className="space-y-4 p-4 border-2 border-black bg-gray-50">
                          <Label className="font-black uppercase text-[10px]">Wallpaper Principal</Label>
                          <div className="flex gap-2">
                             <Button size="sm" variant={mainWpType === 'image' ? 'default' : 'outline'} onClick={() => setMainWpType('image')} className="flex-1 font-black text-[9px] h-8 rounded-none border-black border-2">IMAGEM</Button>
                             <Button size="sm" variant={mainWpType === 'video' ? 'default' : 'outline'} onClick={() => setMainWpType('video')} className="flex-1 font-black text-[9px] h-8 rounded-none border-black border-2">VÍDEO</Button>
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              value={mainWpUrl === 'LOCAL_ASSET' ? 'Arquivo Local Selecionado' : mainWpUrl} 
                              onChange={e => setMainWpUrl(e.target.value)} 
                              placeholder="URL Externa..." 
                              className="flex-1 border-black font-black text-[10px] rounded-none h-10 uppercase" 
                            />
                            <Button size="icon" variant="outline" onClick={() => mainFileInputRef.current?.click()} className="border-black border-2 h-10 w-10 shrink-0 hover:bg-black hover:text-white transition-all"><Upload size={14}/></Button>
                            <input type="file" ref={mainFileInputRef} onChange={e => handleLocalFile(e, 'main')} className="hidden" accept="video/*,image/*" />
                          </div>
                        </div>
                      )}

                      {(wpMode === 'sidebar_only' || wpMode === 'separate') && (
                        <div className="space-y-4 p-4 border-2 border-black bg-gray-50">
                          <Label className="font-black uppercase text-[10px]">Wallpaper Sidebar</Label>
                          <div className="flex gap-2">
                             <Button size="sm" variant={sideWpType === 'image' ? 'default' : 'outline'} onClick={() => setSideWpType('image')} className="flex-1 font-black text-[9px] h-8 rounded-none border-black border-2">IMAGEM</Button>
                             <Button size="sm" variant={sideWpType === 'video' ? 'default' : 'outline'} onClick={() => setSideWpType('video')} className="flex-1 font-black text-[9px] h-8 rounded-none border-black border-2">VÍDEO</Button>
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              value={sideWpUrl === 'LOCAL_ASSET' ? 'Arquivo Local Selecionado' : sideWpUrl} 
                              onChange={e => setSideWpUrl(e.target.value)} 
                              placeholder="URL Externa..." 
                              className="flex-1 border-black font-black text-[10px] rounded-none h-10 uppercase" 
                            />
                            <Button size="icon" variant="outline" onClick={() => sideFileInputRef.current?.click()} className="border-black border-2 h-10 w-10 shrink-0 hover:bg-black hover:text-white transition-all"><Upload size={14}/></Button>
                            <input type="file" ref={sideFileInputRef} onChange={e => handleLocalFile(e, 'side')} className="hidden" accept="video/*,image/*" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <Label className="font-black text-black text-xs uppercase">Opacidade ({Math.round(wpOpacity * 100)}%)</Label>
                      <Slider value={[wpOpacity]} onValueChange={([v]) => setWpOpacity(v)} max={1} step={0.01} className="[&_[role=slider]]:bg-black" />
                    </div>

                    <div className="space-y-4 pt-4 border-t-2 border-black">
                      <Label className="font-black text-black text-xs uppercase">Cor de Fundo Base</Label>
                      <div className="flex gap-4 items-center">
                        <input type="color" value={bgColor} onChange={handleBgColorChange} className="h-12 w-20 border-2 border-black cursor-pointer bg-white" />
                        <Input value={bgColor} readOnly className="font-mono border-2 border-black text-black font-black rounded-none h-12 uppercase" />
                      </div>
                    </div>

                    <Button onClick={saveWpSettings} className="w-full h-12 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Sincronizar Gabinete</Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Sync' && (
                 <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Silo SaaS Multi-Tenant</CardTitle>
                    <CardDescription className="text-black font-bold uppercase text-[10px]">Identidade corporativa vinculada ao seu gabinete.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-6 bg-[#f3f2f2] rounded-none border-2 border-black">
                      <div className="flex items-center justify-between mb-4">
                         <div className="text-sm font-black text-black uppercase flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          Sistema Online e Blindado
                        </div>
                        <Badge className="bg-green-600 text-white border-none font-black uppercase text-[9px] px-3 rounded-none">Cloud Active</Badge>
                      </div>
                      <div className="text-[10px] text-black/40 uppercase font-black tracking-widest bg-white/10 px-3 py-2 border border-black">
                        Tenant ID: {profile?.empresa_id || 'MASTER_TENANT'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Núcleo Neural</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={iaModel} onValueChange={handleIaChange} className="grid grid-cols-1 gap-4">
                      <IaOption id="gemini" value="gemini" title="Gemini 1.5 Flash" desc="Alta performance em auditorias de longo prazo." active={iaModel === 'gemini'} />
                      <IaOption id="grok" value="grok" title="Grok (Llama 3.3)" desc="Raciocínio lógico militar e assertividade." active={iaModel === 'grok'} />
                      <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet" desc="Elite em nuances jurídicas e redação." active={iaModel === 'openrouter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Users' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-black font-black uppercase text-sm">Corpo Técnico</CardTitle>
                    </div>
                    {isAdmin && (
                       <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                         <DialogTrigger asChild>
                           <Button size="sm" className="bg-white text-black border-2 border-black h-9 uppercase text-[10px] font-black hover:bg-black transition-all rounded-none px-6 shadow-[4px_4px_0px_#000] hover:shadow-none">
                              <UserPlus size={12} className="mr-2" /> Novo Operador
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="bg-white border-2 border-black text-black rounded-none">
                           <form onSubmit={handleCreateOperator}>
                             <DialogHeader>
                               <DialogTitle className="text-black font-black uppercase">Provisionar Acesso</DialogTitle>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                               <div className="grid gap-1">
                                 <Label className="text-[10px] font-black uppercase">Nome</Label>
                                 <Input value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} className="border-2 border-black text-black font-black uppercase rounded-none" required />
                               </div>
                               <div className="grid gap-1">
                                 <Label className="text-[10px] font-black uppercase">E-mail</Label>
                                 <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="border-2 border-black text-black font-black uppercase rounded-none" required />
                               </div>
                               <div className="grid gap-1">
                                 <Label className="text-[10px] font-black uppercase">Senha</Label>
                                 <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="border-2 border-black text-black rounded-none" required />
                               </div>
                               <div className="grid gap-1">
                                 <Label className="text-[10px] font-black uppercase">Cargo</Label>
                                 <Select value={newUserForm.cargo} onValueChange={val => setNewUserForm({...newUserForm, cargo: val as any})}>
                                   <SelectTrigger className="border-2 border-black text-black font-black uppercase rounded-none">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="bg-white border-2 border-black rounded-none">
                                     <SelectItem value="Operador" className="text-black font-black uppercase">Operador</SelectItem>
                                     <SelectItem value="Administrador" className="text-black font-black uppercase">Administrador</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                             <DialogFooter>
                               <Button type="submit" disabled={isAddingUser} className="w-full bg-black text-white font-black uppercase h-12 rounded-none hover:bg-white hover:text-black border-2 border-black transition-all">
                                 {isAddingUser ? "Provisionando..." : "Criar Acesso Supabase"}
                               </Button>
                             </DialogFooter>
                           </form>
                         </DialogContent>
                       </Dialog>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y-2 divide-black/10">
                      {empresaUsers.map((u) => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-black group transition-all cursor-default">
                           <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-none bg-[#f3f2f2] group-hover:bg-white flex items-center justify-center font-black text-xs text-black border-2 border-black uppercase">
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
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-black/20 group-hover:text-red-500 hover:bg-transparent h-8 w-8">
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

              {isDevAccount && activeTab === 'Master' && (
                <Card className="bg-white border-2 border-red-600 shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-red-50 border-b-2 border-red-600">
                    <CardTitle className="text-red-600 font-black uppercase text-sm flex items-center gap-2">
                       <Skull size={18} /> Protocolo Master
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                     {!isMasterActive ? (
                        <form onSubmit={handleUnlockMaster} className="space-y-4">
                           <div className="space-y-2">
                              <Label className="text-red-600 font-black uppercase text-[10px]">Chave Global</Label>
                              <Input type="password" value={masterPasswordInput} onChange={e => setMasterPasswordInput(e.target.value)} className="border-2 border-red-600 h-12 text-red-600 font-black rounded-none bg-white uppercase text-center tracking-widest text-lg" placeholder="TOKEN..." />
                           </div>
                           <Button type="submit" className="w-full bg-red-600 text-white font-black uppercase h-12 rounded-none hover:bg-black transition-all">Liberar Bypass</Button>
                        </form>
                     ) : (
                        <div className="space-y-6">
                           <div className="p-6 bg-red-600 text-white text-center rounded-none font-black uppercase animate-pulse">
                              <ShieldAlert size={48} className="mx-auto mb-4" />
                              <p className="text-lg">Bypass Global Ativado</p>
                           </div>
                           <Button onClick={handleLockMaster} className="w-full bg-white text-red-600 border-2 border-red-600 font-black uppercase h-12 rounded-none hover:bg-red-50 transition-all">Revogar Privilégios</Button>
                        </div>
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

function WpModeOption({ id, value, label }: { id: string, value: string, label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 p-3 border-2 border-black bg-white cursor-pointer hover:bg-black group transition-all">
      <RadioGroupItem value={value} id={id} className="border-black group-hover:border-white" />
      <span className="text-[10px] font-black uppercase group-hover:text-white transition-colors">{label}</span>
    </label>
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
      {active && <CheckCircle2 className="text-white" size={16} />}
    </label>
  );
}
