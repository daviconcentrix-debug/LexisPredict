/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  CheckCircle, 
  RefreshCcw, 
  Phone, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Search,
  ExternalLink,
  MessageCircle,
  Copyright,
  CalendarDays,
  Target,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings2,
  Plus,
  Minus,
  Zap
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';

interface TaskGroup {
  cliente: string;
  vencidos: number;
  hoje: number;
  totalAtivos: number;
  diasAtrasoMax: number;
  protocoloReferencia: string;
  telefone: string;
  cases: LegalCase[];
}

export default function TarefasPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dailyMeta, setDailyMeta] = useState(25);
  const [showBacklog, setShowBacklog] = useState(false);
  const { toast } = useToast();

  // Carregar meta do localStorage no carregamento inicial
  useEffect(() => {
    const savedMeta = localStorage.getItem('lexis_tarefas_meta');
    if (savedMeta) {
      const parsed = parseInt(savedMeta);
      if (!isNaN(parsed)) setDailyMeta(parsed);
    }
  }, []);

  const adjustMeta = (amount: number) => {
    const newVal = Math.max(10, Math.min(50, dailyMeta + amount));
    setDailyMeta(newVal);
    localStorage.setItem('lexis_tarefas_meta', newVal.toString());
    toast({ title: `Meta atualizada: ${newVal} contatos`, duration: 1500 });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRepoCases();
      if (Array.isArray(data)) setCases(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const taskGroups = useMemo(() => {
    const groups: Record<string, TaskGroup> = {};

    const activeCases = cases.filter(c => 
      !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())
    );

    activeCases.forEach(c => {
      if (c.status !== 'Vencido' && c.status !== 'É Hoje') return;

      const nome = c.cliente || 'NÃO IDENTIFICADO';
      if (!groups[nome]) {
        groups[nome] = {
          cliente: nome,
          vencidos: 0,
          hoje: 0,
          totalAtivos: 0,
          diasAtrasoMax: 0,
          protocoloReferencia: c.protocolo,
          telefone: c.telefone || '',
          cases: []
        };
      }

      groups[nome].totalAtivos++;
      groups[nome].cases.push(c);
      
      if (c.status === 'Vencido') {
        groups[nome].vencidos++;
        const atraso = c.diasFaltando ? Math.abs(c.diasFaltando) : 0;
        if (atraso > groups[nome].diasAtrasoMax) {
          groups[nome].diasAtrasoMax = atraso;
        }
      }
      
      if (c.status === 'É Hoje') {
        groups[nome].hoje++;
      }
    });

    return Object.values(groups)
      .filter(g => g.cliente.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (b.diasAtrasoMax !== a.diasAtrasoMax) return b.diasAtrasoMax - a.diasAtrasoMax;
        if (b.vencidos !== a.vencidos) return b.vencidos - a.vencidos;
        if (b.hoje !== a.hoje) return b.hoje - a.hoje;
        return b.totalAtivos - a.totalAtivos;
      });
  }, [cases, search]);

  const focusList = useMemo(() => taskGroups.slice(0, dailyMeta), [taskGroups, dailyMeta]);
  const backlogList = useMemo(() => taskGroups.slice(dailyMeta), [taskGroups, dailyMeta]);

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-black text-white rounded-lg shadow-lg">
              <CheckCircle size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Tarefas de Contato</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Gestão de Capacidade Diária</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 rounded-xl hover:bg-secondary">
              <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 max-w-[1400px] mx-auto w-full space-y-10">
          {!loading && taskGroups.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-slate-400 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Na Fila Crítica</p>
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{taskGroups.length}</h3>
              </div>
              
              {/* CARD DE META AJUSTÁVEL */}
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-primary bg-white shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                   <Settings2 size={60} />
                </div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Meta de Hoje</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter text-foreground tabular-nums">{dailyMeta}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">unid.</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto relative z-10">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => adjustMeta(-5)} 
                      className="h-8 w-8 rounded-lg border-border hover:bg-secondary hover:text-primary transition-all"
                    >
                      <Minus size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => adjustMeta(5)} 
                      className="h-8 w-8 rounded-lg border-border hover:bg-secondary hover:text-primary transition-all"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-emerald-500 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Foco de Hoje</p>
                <h3 className="text-3xl font-black tracking-tighter text-emerald-600">{Math.min(dailyMeta, taskGroups.length)}</h3>
              </div>
            </section>
          )}

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Pesquisar por titular na fila..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white border border-border/50 rounded-xl text-xs font-bold uppercase focus-visible:ring-primary/20 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-4 py-2 rounded-lg">
                <AlertCircle size={14} className="text-primary" />
                <span>A meta limita quantos contatos priorizar hoje.</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Target size={18} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Foco Prioritário do Dia</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {focusList.length > 0 ? (
                  focusList.map((group) => (
                    <TaskCard key={group.cliente} group={group} isFocus />
                  ))
                ) : (
                  <div className="col-span-full py-20 flex items-center justify-center">
                    <EmptyState 
                      icon={CheckCircle} 
                      title={loading ? "Carregando Fila..." : "Gabinete Limpo"} 
                      description={loading ? "Sincronizando tarefas prioritárias do servidor." : "Nenhum contato crítico identificado para esta carteira hoje."}
                    />
                  </div>
                )}
              </div>
            </div>

            {backlogList.length > 0 && (
              <div className="pt-10 space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowBacklog(!showBacklog)}
                  className="w-full flex items-center justify-between p-6 h-auto bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                    <div className="text-left">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Resto da Fila Crítica</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{backlogList.length} contatos aguardando fora da meta</p>
                    </div>
                  </div>
                  {showBacklog ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>

                {showBacklog && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                    {backlogList.map((group) => (
                      <TaskCard key={group.cliente} group={group} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="h-10 border-t border-border/50 bg-card/60 flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.4em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span>Operações Prioritárias • Davi Alves Figueredo</span>
        </footer>
      </main>
    </div>
  );
}

function TaskCard({ group, isFocus = false }: { group: TaskGroup, isFocus?: boolean }) {
  return (
    <div className={cn(
      "premium-card p-6 bg-white border border-border/40 hover:border-primary/40 transition-all group flex flex-col",
      isFocus && "shadow-md ring-1 ring-primary/5"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
          isFocus ? "bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-50 text-slate-400"
        )}>
          <Phone size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {group.vencidos > 0 ? (
            <Badge className="bg-red-50 text-red-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
              <ShieldAlert size={10} /> {group.vencidos} Vencido{group.vencidos > 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
              <Clock size={10} /> Prazo Hoje
            </Badge>
          )}
          {group.diasAtrasoMax > 0 && (
            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter animate-pulse">
              Há {group.diasAtrasoMax} dia{group.diasAtrasoMax > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <h3 className="font-black text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors truncate">{group.cliente}</h3>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <CalendarDays size={12} className="opacity-40" />
          <span>Ref: {group.protocoloReferencia}</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Canais de Contato</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50">
              <a href={formatWhatsAppLink(group.telefone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-slate-400 hover:bg-slate-50">
              <Link href={`/cases?search=${encodeURIComponent(group.cliente)}`}>
                <ExternalLink size={18} />
              </Link>
            </Button>
          </div>
        </div>
        <Button variant="ghost" asChild className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/5 transition-all">
          <Link href={`/cases?search=${encodeURIComponent(group.cliente)}`}>
            Ver Casos <ChevronRight size={14} className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
