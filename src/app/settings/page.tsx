
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
  Copyright,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Skull
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
import { getEmpresaUsers, removeEmpresaUser } from '@/lib/server-db';
import { UserProfile, supabase } from '@/lib/supabase';
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

const VEREDITO_SOURCE_CODE = `'use server';
/**
 * MOTOR DE PROCESSAMENTO TÉCNICO v80.0 SAAS ELITE - DATAJUD INTEGRAL
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
  inputSchema: z.object({ cnj: z.string(), preferredModel: z.string(), empresa_id: z.string() }),
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
  const [codePasswordInput, setCodePasswordInput] = useState('');
  const [isCodeAuthorized, setIsCodeAuthorized] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [isMasterActive, setIsMasterActive] = useState(false);
  const [iaModel, setIaModel] = useState<'gemini' | 'grok' | 'openrouter'>('gemini');
  const [empresaUsers, setEmpresaUsers] = useState<UserProfile[]>([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddUser] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState({
    nome: '',
    email: '',
    password: '',
    cargo: 'Operador' as any
  });

  const [bgColor, setBgColor] = useState('#f3f2f2');

  const { isAdmin, profile } = useAdmin();
  const { toast } = useToast();

  const isDevAccount = profile?.email?.toLowerCase() === 'daviconcentrix@gmail.com';

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia');
    if (savedIA === 'gemini' || savedIA === 'grok' || savedIA === 'openrouter') setIaModel(savedIA as any);
    const savedColor = localStorage.getItem('lexisPredict_bg_color');
    if (savedColor) setBgColor(savedColor);

    // Checar Persistência de Auditoria Global
    const checkMaster = () => {
      const cookies = document.cookie.split('; ');
      const masterUnlock = cookies.find(row => row.startsWith('lexis_master_unlock='))?.split('=')[1];
      const masterEmail = cookies.find(row => row.startsWith('lexis_master_email='))?.split('=')[1];
      
      if (masterUnlock === '40028922' && masterEmail === 'daviconcentrix@gmail.com') {
        setIsMasterActive(true);
      } else {
        setIsMasterActive(false);
      }
    };

    checkMaster();
    loadUsers();
  }, [profile?.empresa_id]);

  const loadUsers = async () => {
    const users = await getEmpresaUsers();
    setEmpresaUsers(users);
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

  const handleUnlockMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasswordInput === '40028922') {
      // Grava Cookies de Auditoria Global com Escopo Total e Samesite
      const cookieParams = "path=/; max-age=31536000; samesite=lax";
      document.cookie = `lexis_master_unlock=40028922; ${cookieParams}`;
      document.cookie = `lexis_master_email=daviconcentrix@gmail.com; ${cookieParams}`;
      
      setIsMasterActive(true);
      toast({ title: "Gabinete Master Desbloqueado", description: "Bypass de Auditoria Global Ativado." });
      setMasterPasswordInput('');
      
      // Sincronização Síncrona: Força o reload para o servidor processar os novos cookies
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast({ title: "Autorização Negada", description: "Token de segurança incorreto.", variant: "destructive" });
    }
  };

  const handleLockMaster = () => {
    document.cookie = "lexis_master_unlock=; path=/; max-age=0";
    document.cookie = "lexis_master_email=; path=/; max-age=0";
    setIsMasterActive(false);
    toast({ title: "Gabinete Master Bloqueado" });
    window.location.reload();
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

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingUser || !profile?.empresa_id) return;
    setIsAddUser(true);

    try {
      const cleanEmail = newUserForm.email.trim().toLowerCase();
      
      // 1. Criação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: newUserForm.password,
        options: { data: { full_name: newUserForm.nome } }
      });

      if (authError) throw authError;

      // 2. Upsert Atômico no Perfil de Gabinete
      const { error: profileError } = await supabase
        .from('usuarios')
        .upsert({
          auth_user_id: authData.user?.id,
          empresa_id: profile.empresa_id,
          nome: newUserForm.nome.trim().toUpperCase(),
          email: cleanEmail,
          cargo: newUserForm.cargo
        }, { onConflict: 'auth_user_id' });

      if (profileError) throw profileError;

      toast({ title: "Operador Adicionado", description: "Conta provisionada no silo da empresa." });
      setIsAddUserModalOpen(false);
      setNewUserForm({ nome: '', email: '', password: '', cargo: 'Operador' });
      loadUsers();
    } catch (error: any) {
      toast({ title: "Falha ao Adicionar", description: error.message, variant: "destructive" });
    } finally {
      setIsAddUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.id) {
       toast({ title: "Ação Negada", description: "Você não pode excluir seu próprio perfil.", variant: "destructive" });
       return;
    }
    if (confirm("Deseja remover este usuário da empresa?")) {
       const success = await removeEmpresaUser(userId);
       if (success) {
          toast({ title: "Usuário Removido" });
          loadUsers();
       }
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Configuração Sistema</h1>
            <Badge variant="outline" className="border-black text-black text-[10px] uppercase font-black tracking-widest">v80.0 SaaS Elite</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="space-y-1">
              <Button variant={activeTab === 'Sync' ? 'default' : 'ghost'} onClick={() => setActiveTab('Sync')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Sync' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <HardDrive size={18} className="mr-2" /> Infraestrutura Cloud
              </Button>
              <Button variant={activeTab === 'Engine' ? 'default' : 'ghost'} onClick={() => setActiveTab('Engine')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Engine' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Cpu size={18} className="mr-2" /> Núcleo Técnico
              </Button>
              <Button variant={activeTab === 'Style' ? 'default' : 'ghost'} onClick={() => setActiveTab('Style')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Style' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Palette size={18} className="mr-2" /> Personalização
              </Button>
              <Button variant={activeTab === 'Users' ? 'default' : 'ghost'} onClick={() => setActiveTab('Users')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Users' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                <Users size={18} className="mr-2" /> Gestão de Equipe
              </Button>
              {isDevAccount && (
                <Button variant={activeTab === 'Master' ? 'default' : 'ghost'} onClick={() => setActiveTab('Master')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-l-4 border-l-red-600 border-2 border-transparent", activeTab === 'Master' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                  <Skull size={18} className="mr-2 text-red-600" /> Gabinete Master
                </Button>
              )}
              {isAdmin && (
                <Button variant={activeTab === 'Code' ? 'default' : 'ghost'} onClick={() => setActiveTab('Code')} className={cn("w-full justify-start rounded-none font-black uppercase text-xs h-10 border-2 border-transparent", activeTab === 'Code' ? "bg-black text-white border-black" : "text-black hover:bg-black hover:text-white")}>
                  <Code2 size={18} className="mr-2" /> System Code
                </Button>
              )}
            </aside>

            <div className="md:col-span-3 space-y-6 pb-20">
              {activeTab === 'Sync' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                    <CardTitle className="text-black font-black uppercase text-sm">Silo Multi-Tenant Ativo</CardTitle>
                    <CardDescription className="text-black font-bold uppercase text-[10px]">Identidade corporativa vinculada ao seu gabinete.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-6 bg-[#f3f2f2] rounded-none border-2 border-black group hover:bg-black transition-all cursor-default">
                      <div className="flex items-center justify-between mb-4">
                         <div className="text-sm font-black text-black group-hover:text-white uppercase flex items-center gap-2 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          Ambiente Blindado Online
                        </div>
                        <Badge className="bg-green-600 text-white border-none font-black uppercase text-[9px] px-3 rounded-none">SaaS Ativo</Badge>
                      </div>
                      <div className="text-[10px] text-black/40 group-hover:text-white/40 uppercase font-black tracking-widest bg-white/10 px-3 py-2 rounded-none border border-black group-hover:border-white/20 transition-all">
                        Tenant ID: {profile?.empresa_id || 'MASTER_TENANT'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'Master' && isDevAccount && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden border-t-4 border-t-red-600">
                    <CardHeader className="bg-red-50/50 border-b-2 border-black">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Skull className="text-red-600" size={18} /> Protocolo de Auditoria Global
                      </CardTitle>
                      <CardDescription className="text-black font-bold uppercase text-[10px]">Acesso irrestrito a todos os processos e notas do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       {!isMasterActive ? (
                         <form onSubmit={handleUnlockMaster} className="space-y-4 max-w-sm mx-auto text-center">
                            <Label className="text-black font-black uppercase text-[10px]">TOKEN DE AUTORIZAÇÃO MASTER</Label>
                            <Input type="password" placeholder="DIGITE O TOKEN..." value={masterPasswordInput} onChange={(e) => setMasterPasswordInput(e.target.value)} className="border-2 border-black h-12 text-center font-black uppercase text-sm bg-white rounded-none focus-visible:ring-black" />
                            <Button type="submit" className="w-full h-12 font-black bg-white text-black border-2 border-black uppercase text-xs rounded-none hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Ativar Desbloqueio Geral</Button>
                         </form>
                       ) : (
                         <div className="text-center space-y-6">
                            <div className="p-6 bg-red-600 text-white rounded-none border-2 border-black shadow-lg">
                               <p className="font-black uppercase text-xl animate-pulse">MODO GLOBAL ATIVADO</p>
                               <p className="text-[10px] font-bold uppercase mt-2">Você está visualizando dados de todas as empresas do ecossistema.</p>
                            </div>
                            <Button onClick={handleLockMaster} className="bg-white text-black border-2 border-black font-black uppercase text-xs h-12 px-10 hover:bg-black hover:text-white transition-all rounded-none shadow-[6px_6px_0px_#000] hover:shadow-none">Revogar Privilégios Master</Button>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Users' && (
                <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-black font-black uppercase text-sm">Membros do Gabinete</CardTitle>
                      <CardDescription className="text-black font-bold uppercase text-[10px]">Usuários com acesso a esta instância.</CardDescription>
                    </div>
                    {isAdmin && (
                       <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                         <DialogTrigger asChild>
                           <Button size="sm" className="bg-white text-black border-2 border-black h-9 uppercase text-[10px] font-black hover:bg-black hover:text-white transition-all rounded-none px-6">
                              <UserPlus size={12} className="mr-2" /> Novo Operador
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="bg-white border-2 border-black text-black rounded-none">
                           <form onSubmit={handleCreateOperator}>
                             <DialogHeader>
                               <DialogTitle className="text-black font-black uppercase">Provisionar Colaborador</DialogTitle>
                               <DialogDescription className="text-black/60 font-bold uppercase text-[10px]">Novo acesso vinculado ao seu Silo SaaS.</DialogDescription>
                             </DialogHeader>
                             <div className="grid gap-4 py-4">
                               <div className="grid gap-2">
                                 <Label className="text-black font-black uppercase text-[10px]">Nome Completo</Label>
                                 <Input value={newUserForm.nome} onChange={e => setNewUserForm({...newUserForm, nome: e.target.value})} className="border-2 border-black text-black font-black uppercase rounded-none" required />
                               </div>
                               <div className="grid gap-2">
                                 <Label className="text-black font-black uppercase text-[10px]">E-mail Corporativo</Label>
                                 <Input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="border-2 border-black text-black font-black uppercase rounded-none" required />
                               </div>
                               <div className="grid gap-2">
                                 <Label className="text-black font-black uppercase text-[10px]">Senha Inicial</Label>
                                 <Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="border-2 border-black text-black rounded-none" required />
                               </div>
                               <div className="grid gap-2">
                                 <Label className="text-black font-black uppercase text-[10px]">Cargo</Label>
                                 <Select value={newUserForm.cargo} onValueChange={val => setNewUserForm({...newUserForm, cargo: val as any})}>
                                   <SelectTrigger className="border-2 border-black text-black font-black uppercase rounded-none">
                                     <SelectValue placeholder="Selecione..." />
                                   </SelectTrigger>
                                   <SelectContent className="bg-white border-2 border-black rounded-none">
                                     <SelectItem value="Operador" className="text-black font-black uppercase">Operador</SelectItem>
                                     <SelectItem value="Visualizador" className="text-black font-black uppercase">Visualizador</SelectItem>
                                     <SelectItem value="Administrador" className="text-black font-black uppercase">Administrador</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                             <DialogFooter>
                               <Button type="submit" disabled={isAddingUser} className="w-full bg-black text-white font-black uppercase h-12 rounded-none hover:bg-white hover:text-black border-2 border-black transition-all">
                                 {isAddingUser ? "Executando..." : "Criar Acesso"}
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
                              <div className="w-9 h-9 rounded-none bg-[#f3f2f2] group-hover:bg-white flex items-center justify-center font-black text-xs text-black transition-colors border-2 border-black">
                                 {u.nome?.substring(0, 2).toUpperCase() || '??'}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-black group-hover:text-white uppercase transition-colors">{u.nome}</p>
                                 <p className="text-[9px] font-bold text-black/40 group-hover:text-white/40 transition-colors">{u.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-2 border-black text-black group-hover:bg-white group-hover:text-black font-black uppercase text-[8px] h-6 rounded-none">
                                 {u.cargo}
                              </Badge>
                              {isAdmin && u.id !== profile?.id && (
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-black/20 group-hover:text-red-500 hover:bg-transparent h-8 w-8 transition-colors">
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

              {activeTab === 'Engine' && (
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Settings2 size={18} /> Núcleo de Processamento IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <RadioGroup value={iaModel} onValueChange={v => handleIaChange(v as any)} className="grid gap-3">
                        <IaOption id="gemini" value="gemini" title="Gemini 1.5 Flash" desc="Sincronia veloz para auditorias padrão." active={iaModel === 'gemini'} />
                        <IaOption id="grok" value="grok" title="Grok (Llama 3.3)" desc="Raciocínio lógico para processos complexos." active={iaModel === 'grok'} />
                        <IaOption id="openrouter" value="openrouter" title="Claude 3.5 Sonnet" desc="Precisão técnica máxima de gabinete." active={iaModel === 'openrouter'} />
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Style' && (
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black">
                      <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                        <Palette size={18} /> Identidade Visual do Gabinete
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label className="font-black text-black text-xs uppercase">Cor Base do Ambiente</Label>
                        <div className="flex gap-4 items-center">
                          <input type="color" value={bgColor} onChange={handleBgColorChange} className="h-12 w-20 border-2 border-black cursor-pointer bg-white" />
                          <Input value={bgColor} onChange={handleBgColorChange} className="font-mono border-2 border-black text-black font-black rounded-none h-12 focus-visible:ring-black uppercase" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'Code' && isAdmin && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {!isCodeAuthorized ? (
                    <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden border-t-2 border-t-red-600">
                       <CardHeader className="bg-red-50/50 border-b-2 border-black">
                        <CardTitle className="text-black font-black uppercase text-sm flex items-center gap-2">
                          <ShieldAlert className="text-red-600" size={18} /> System Kernel Locked
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 text-center">
                         <form onSubmit={handleUnlockCode} className="space-y-4 max-w-sm mx-auto">
                            <Input type="password" placeholder="SENHA MESTRE..." value={codePasswordInput} onChange={(e) => setCodePasswordInput(e.target.value)} className="border-2 border-black h-12 text-center font-black uppercase text-sm bg-white rounded-none focus-visible:ring-black" />
                            <Button type="submit" className="w-full h-12 font-black bg-red-600 text-white uppercase text-xs rounded-none hover:bg-black transition-all shadow-[6px_6px_0px_#000] hover:shadow-none">Desbloquear Kernel</Button>
                         </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-white border-2 border-black shadow-none rounded-none overflow-hidden">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black flex flex-row items-center justify-between">
                        <CardTitle className="text-black font-black uppercase text-sm">Veredito AI Kernel (v80.0)</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsCodeAuthorized(false)} className="border-2 border-black text-black font-black uppercase text-[9px] h-8 rounded-none hover:bg-black hover:text-white transition-all">Bloquear Kernel</Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[500px] w-full bg-[#f3f2f2]">
                          <pre className="p-6 text-[11px] font-mono text-black leading-relaxed whitespace-pre-wrap">{VEREDITO_SOURCE_CODE}</pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black font-black uppercase tracking-[0.2em] shrink-0">
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
