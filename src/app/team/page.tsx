
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  UserPlus, 
  Trash2, 
  RefreshCcw, 
  Mail, 
  Copyright,
  MoreVertical,
  ChevronRight,
  Activity
} from 'lucide-react';
import { getEmpresaUsers, removeEmpresaUser } from '@/lib/server-db';
import { UserProfile } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getTranslation, Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('pt');
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const t = getTranslation(locale);
  const isAdmin = profile?.cargo === 'Administrador';

  useEffect(() => {
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmpresaUsers();
      setUsers(data);
    } catch (e) {
      toast({ title: "Sync Fail", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleDelete = async (id: string, name: string) => {
    if (id === profile?.id) {
      toast({ title: "Ação Negada", description: "Você não pode se auto-excluir.", variant: "destructive" });
      return;
    }
    if (!confirm(`Confirmar exclusão de ${name}?`)) return;

    const success = await removeEmpresaUser(id);
    if (success) {
      toast({ title: "Usuário Removido" });
      loadTeam();
    } else {
      toast({ title: "Falha técnica", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.teamTitle}</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-[8px] uppercase font-bold tracking-[0.2em] px-2 py-0.5">
              {profile?.empresa_id || "GABINETE"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
             {isAdmin && (
               <Button size="sm" className="bg-primary text-black font-bold h-9 px-4 rounded-sm uppercase text-[9px] tracking-wider hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,209,255,0.2)]">
                 <UserPlus size={14} className="mr-2" /> Novo Operador
               </Button>
             )}
             <Button variant="ghost" size="icon" onClick={loadTeam} className="text-muted-foreground hover:text-primary">
                <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">{t.teamTitle}</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">{t.teamSubtitle}</p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {users.map((user) => (
              <Card key={user.id} className="bg-card border-border/50 rounded-none shadow-sm group hover:border-primary/30 transition-all overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                      user.cargo === 'Administrador' ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border/50 text-muted-foreground"
                    )}>
                      {user.cargo === 'Administrador' ? <ShieldCheck size={20} /> : user.cargo === 'Operador' ? <Shield size={20} /> : <Activity size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[11px] font-black uppercase tracking-tight truncate max-w-[150px]">{user.nome}</p>
                      <RoleBadge role={user.cargo} t={t} />
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border rounded-none shadow-xl min-w-[140px]">
                        <DropdownMenuItem className="text-[9px] font-bold uppercase cursor-pointer hover:bg-secondary">
                          Ver Logs de Acesso
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[9px] font-bold uppercase cursor-pointer hover:bg-secondary">
                          Alterar Cargo
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user.id, user.nome)}
                          className="text-[9px] font-bold uppercase cursor-pointer text-destructive focus:bg-destructive/10"
                        >
                          Revogar Acesso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary/20 border border-border/10">
                    <Mail size={12} className="shrink-0" />
                    <span className="text-[9px] font-mono lowercase truncate">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Atividade: Nominal</span>
                    <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {loading && Array.from({length: 3}).map((_, i) => (
              <div key={i} className="h-40 bg-secondary/30 animate-pulse border border-border/20" />
            ))}
          </section>
        </div>

        <footer className="h-10 border-t border-border/30 bg-background/80 backdrop-blur-md flex items-center justify-center gap-6 text-[9px] text-muted-foreground/50 font-bold uppercase tracking-[0.3em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="w-1 h-1 bg-muted-foreground/20 rounded-full" />
          <span>Advanced Permissions • Davi Alves Figueredo</span>
        </footer>
      </main>
    </div>
  );
}

function RoleBadge({ role, t }: { role: string, t: any }) {
  const styles: Record<string, string> = {
    'Administrador': "text-primary border-primary/20 bg-primary/5",
    'Operador': "text-blue-400 border-blue-400/20 bg-blue-400/5",
    'Visualizador': "text-muted-foreground border-border bg-secondary/50",
  };

  const label = role === 'Administrador' ? t.roleAdmin : role === 'Operador' ? t.roleOperator : t.roleViewer;

  return (
    <Badge variant="outline" className={cn("px-1.5 py-0 text-[7px] font-black uppercase tracking-[0.1em] rounded-sm", styles[role] || styles.Visualizador)}>
      {label}
    </Badge>
  );
}
