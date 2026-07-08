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
  RefreshCcw,
  Paintbrush,
  Type,
  Square,
  Maximize
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
  const [borderRadius, setBorderRadius] = useState(0);
  const [hardShadow, setHardShadow] = useState(true);

  // Cores Manuais
  const [bgColor, setBgColor] = useState('#f3f2f2');
  const [fontColor, setFontColor] = useState('#000000');
  const [btnBgColor, setBtnBgColor] = useState('#000000');
  const [borderColor, setBorderColor] = useState('#000000');

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

  useEffect(() => {
    isMounted.current = true;
    
    const loadSettings = () => {
      setIaModel((localStorage.getItem('lexisPredict_preferred_ia') as any) || 'xai');
      setVisualMode((localStorage.getItem('lexis_visual_mode') as any) || 'elite');
      setContainerOpacity(parseFloat(localStorage.getItem('lexisPredict_container_opacity') || '1'));
      setBorderRadius(parseInt(localStorage.getItem('lexisPredict_border_radius') || '0'));
      setHardShadow(localStorage.getItem('lexisPredict_hard_shadow') !== 'false');
      setAutoTheme(localStorage.getItem('lexis_auto_theme') === 'true');
      setWpMode((localStorage.getItem('lexis_wp_mode') as any) || 'global');
      setMainWpUrl(localStorage.getItem('lexis_wp_main_url') || '');
      setSideWpUrl(localStorage.getItem('lexis_wp_sidebar_url') || '');
      setMainWpType((localStorage.getItem('lexis_wp_main_type') as any) || 'image');
      setSideWpType((localStorage.getItem('lexis_wp_sidebar_type') as any) || 'image');
      setWpOpacity(parseFloat(localStorage.getItem('lexis_wp_opacity') || '1'));

      setBgColor(localStorage.getItem('lexisPredict_bg_color') || '#f3f2f2');
      setFontColor(localStorage.getItem('lexisPredict_font_color') || '#000000');
      setBtnBgColor(localStorage.getItem('lexisPredict_btn_bg_color') || '#000000');
      setBorderColor(localStorage.getItem('lexisPredict_border_color') || '#000000');
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

  const updateSetting = (key: string, value: any, setter: any) => {
    setter(value);
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'side') => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Sincronizando Mídia..." });
    const key = target === 'main' ? 'main_wallpaper_blob' : 'side_wallpaper_blob';
    const success = await browserStorage.saveAsset(key, file);
    if (success) {
      if (target === 'main') { setMainWpUrl('LOCAL_ASSET'); setMainWpType(file.type.includes('video') ? 'video' : 'image'); }
      else { setSideWpUrl('LOCAL_ASSET'); setSideWpType(file.type.includes('video') ? 'video' : 'image'); }
      toast({ title: "Mídia Atualizada" });
    }
  };

  const saveWpSettings = () => {
    localStorage.setItem('lexis_wp_mode', wpMode);
    localStorage.setItem('lexis_wp_main_url', mainWpUrl);
    localStorage.setItem('lexis_wp_sidebar_url', sideWpUrl);
    localStorage.setItem('lexis_wp_main_type', mainWpType);
    localStorage.setItem('lexis_wp_sidebar_type', sideWpType);
    localStorage.setItem('lexis_wp_opacity', wpOpacity.toString());
    localStorage.setItem('lexisPredict_container_opacity', containerOpacity.toString());
    localStorage.setItem('lexisPredict_border_radius', borderRadius.toString());
    localStorage.setItem('lexisPredict_hard_shadow', hardShadow.toString());
    window.dispatchEvent(new Event('storage'));
    toast({ title: "Atmosfera de Gabinete Sincronizada" });
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
      const { data: authData, error: authError } = await tempClient.auth.signUp({ email: cleanEmail, password: newUserForm.password, options: { data: { full_name: newUserForm.nome } } });
      if (authError) throw authError;
      await supabase.from('usuarios').insert({ auth_user_id: authData.user?.id, empresa_id: profile.empresa_id, nome: newUserForm.nome.trim().toUpperCase(), email: cleanEmail, cargo: newUserForm.cargo });
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
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v800.0 Elite Granular</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Engine' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Cpu size={18} className="mr-2" /> Núcleo Técnico
              </Button>
              <Button variant={activeTab === 'Style' ? 'default' : 'ghost'} onClick={() => setActiveTab('Style')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Style' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Palette size={18} className="mr-2" /> Atmosfera & Visual
              </Button>
              <Button variant={activeTab === 'Users' ? 'default' : 'ghost'} onClick={() => setActiveTab('Users')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Users' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Users size={18} className="mr-2" /> Gestão de Equipe
              </Button>
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Sync' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <HardDrive size={18} className="mr-2" /> Infraestrutura
              </Button>
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Engine' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-4">
                    <CardTitle className="text-black font-black uppercase text-sm">Tríade de Inteligência</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase">Motores de processamento em redundância circular.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={iaModel} onValueChange={handleIaChange as any} className="grid grid-cols-1 gap-4">
                      <IaOption id="xai" value="xai" title="xAI GROK 4.5" desc="Núcleo de soberania e raciocínio jurídico avançado." active={iaModel === 'xai'} />
                      <IaOption id="airforce" value="airforce" title="AIRFORCE (DEEPSEEK V3)" desc="Alta performance em extração e triagem de contratos." active={iaModel === 'airforce'} />
                      <IaOption id="grok" value="grok" title="GROQ (LLAMA 3.3)" desc="Redundância ultra-rápida para processamento em lote." active={iaModel === 'grok'} />
                      <IaOption id="puter" value="puter" title="PUTER AI (CLAUDE)" desc="Reserva de emergência para alta disponibilidade via Claude." active={iaModel === 'puter'} />
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Style' && (
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-4">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-500" /> Arquitetura Visual Granular
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div className="p-5 bg-black border-2 border-black flex items-center justify-between group transition-all cursor-default shadow-[8px_8px_0px_#facc15]">
                         <div className="flex items-center gap-4">
                            <Zap size={24} className="text-white animate-pulse" />
                            <div>
                              <p className="font-black text-xs uppercase text-white tracking-widest">Sincronização Cromática IA</p>
                              <p className="text-[9px] font-black uppercase text-white/60">Cores adaptadas ao background em tempo real.</p>
                            </div>
                         </div>
                         <Switch checked={autoTheme} onCheckedChange={(c) => updateSetting('lexis_auto_theme', c, setAutoTheme)} className="data-[state=checked]:bg-yellow-400 border-2 border-white" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-black/5">
                        <div className="space-y-6">
                           <Label className="font-black text-black text-xs uppercase flex items-center gap-2"><Square size={14}/> Arredondamento (Radius: {borderRadius}px)</Label>
                           <Slider value={[borderRadius]} onValueChange={([v]) => updateSetting('lexisPredict_border_radius', v, setBorderRadius)} max={24} step={1} className="[&_[role=slider]]:bg-black" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-dashed border-black/20">
                           <Label className="font-black text-black text-[10px] uppercase">Efeito Hard Shadow 3D</Label>
                           <Switch checked={hardShadow} onCheckedChange={(c) => updateSetting('lexisPredict_hard_shadow', c, setHardShadow)} />
                        </div>
                      </div>

                      {!autoTheme && (
                        <div className="space-y-6 pt-6 border-t-2 border-black animate-in fade-in duration-500">
                          <Label className="font-black text-black text-xs uppercase flex items-center gap-2"><Paintbrush size={14}/> Customização Cromática Manual</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ColorInput label="Fundo (Background)" value={bgColor} onChange={(v) => updateSetting('lexisPredict_bg_color', v, setBgColor)} />
                            <ColorInput label="Texto (Font)" value={fontColor} onChange={(v) => updateSetting('lexisPredict_font_color', v, setFontColor)} />
                            <ColorInput label="Botões (Primary)" value={btnBgColor} onChange={(v) => updateSetting('lexisPredict_btn_bg_color', v, setBtnBgColor)} />
                            <ColorInput label="Bordas (Border)" value={borderColor} onChange={(v) => updateSetting('lexisPredict_border_color', v, setBorderColor)} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-black font-black uppercase text-sm">Controle Multimídia</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                       <div className="space-y-4">
                          <Label className="font-black text-black text-xs uppercase">Wallpaper do Gabinete</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                   <Badge variant="outline" className={cn("text-[8px] font-black uppercase cursor-pointer", mainWpType === 'image' ? "bg-black text-white" : "")} onClick={() => setMainWpType('image')}>Imagem</Badge>
                                   <Badge variant="outline" className={cn("text-[8px] font-black uppercase cursor-pointer", mainWpType === 'video' ? "bg-black text-white" : "")} onClick={() => setMainWpType('video')}>Vídeo</Badge>
                                </div>
                                <div className="relative">
                                   <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                                   <Input placeholder="URL EXTERNA..." value={mainWpUrl === 'LOCAL_ASSET' ? 'ARQUIVO LOCAL' : mainWpUrl} onChange={e => setMainWpUrl(e.target.value)} className="pl-10 border-2 border-black h-11 text-[10px] font-black uppercase rounded-none" />
                                </div>
                             </div>
                             <div className="flex flex-col justify-end">
                                <input type="file" ref={mainFileInput} className="hidden" onChange={e => handleFileUpload(e, 'main')} accept="image/*,video/*" />
                                <Button onClick={() => mainFileInput.current?.click()} variant="outline" className="border-2 border-black h-11 font-black uppercase text-[10px] rounded-none hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000] hover:shadow-none">
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
                          <Slider value={[containerOpacity]} onValueChange={([v]) => setContainerOpacity(v)} max={1} step={0.01} className="[&_[role=slider]]:bg-black" />
                       </div>

                       <Button onClick={saveWpSettings} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Sincronizar Atmosfera</Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Users' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black flex flex-row items-center justify-between py-4">
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
                             <DialogHeader><DialogTitle className="text-black font-black uppercase">Provisionar Acesso</DialogTitle></DialogHeader>
                             <div className="grid gap-4 py-4">
                               <Input value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} placeholder="NOME" className="border-2 border-black font-black rounded-none" required />
                               <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} placeholder="E-MAIL" className="border-2 border-black font-black rounded-none" required />
                               <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="SENHA" className="border-2 border-black font-black rounded-none" required />
                             </div>
                             <DialogFooter><Button type="submit" disabled={isAddingUser} className="w-full bg-black text-white font-black uppercase h-12 rounded-none">Provisionar</Button></DialogFooter>
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
                              <div className="w-9 h-9 bg-[#f3f2f2] group-hover:bg-white flex items-center justify-center font-black text-xs border-2 border-black uppercase">{u.nome?.substring(0, 2) || '??'}</div>
                              <div>
                                 <p className="text-xs font-black text-black group-hover:text-white uppercase">{u.nome}</p>
                                 <p className="text-[9px] font-bold text-black/40 group-hover:text-white/40">{u.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-2 border-black text-black group-hover:bg-white group-hover:text-black font-black uppercase text-[8px] h-6 rounded-none">{u.cargo}</Badge>
                              {isAdmin && u.id !== profile?.id && (
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-black/20 group-hover:text-red-50 hover:bg-transparent h-8 w-8"><Trash2 size={14} /></Button>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Sync' && (
                 <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black"><CardTitle className="text-black font-black uppercase text-sm">Infraestrutura Blindada</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    <div className="p-12 bg-[#f3f2f2] rounded-none border-2 border-black border-dashed flex flex-col items-center justify-center text-center space-y-4">
                      <ShieldCheck size={48} className="text-green-600" />
                      <div>
                        <p className="font-black text-black uppercase text-sm">Gabinete Cloud Sincronizado</p>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Conexão SaaS Multi-Tenant Operacional</p>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black uppercase text-[10px] px-8 py-2 rounded-none shadow-[4px_4px_0px_#000]">ATIVO</Badge>
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

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase">{label}</Label>
      <div className="flex gap-3">
        <div className="w-11 h-11 border-2 border-black relative rounded-none overflow-hidden shrink-0">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
        </div>
        <Input value={value.toUpperCase()} onChange={(e) => onChange(e.target.value)} className="border-2 border-black h-11 font-mono text-xs font-black uppercase rounded-none" maxLength={7} />
      </div>
    </div>
  );
}

function IaOption({ id, value, title, desc, active }: { id: string, value: string, title: string, desc: string, active: boolean }) {
  return (
    <label htmlFor={id} className={cn("flex items-center justify-between p-5 rounded-none border-2 transition-all cursor-pointer group", active ? "bg-black border-black shadow-none" : "bg-white border-black/10 hover:border-black shadow-[4px_4px_0px_#000]")}>
      <div className="flex items-center gap-4">
        <RadioGroupItem value={value} id={id} className={cn("border-2", active ? "border-white text-white" : "border-black text-black")} />
        <div>
          <p className={cn("font-black text-xs uppercase transition-colors", active ? "text-white" : "text-black")}>{title}</p>
          <p className={cn("text-[9px] font-black uppercase transition-colors", active ? "text-white/60" : "text-black/40")}>{desc}</p>
        </div>
      </div>
      {active && <Zap className="text-yellow-400 fill-yellow-400" size={16} />}
    </label>
  );
}
