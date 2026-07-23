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
  Users
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn, formatWhatsAppLink } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/components/auth/auth-provider';

interface TaskGroup {
  cliente: string;
  vencidos: number;
  hoje: number;
  totalAtivos: number;
  protocoloReferencia: string;
  telefone: string;
  oldestOverdueISO: string | null;
  cases: LegalCase[];
}

export default function TarefasPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { profile } = useAuth();

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

    // 1. Filtrar ativos e agrupar por cliente
    const activeCases = cases.filter(c => 
      !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())
    );

    activeCases.forEach(c => {
      const nome = c.cliente || 'NÃO IDENTIFICADO';
      if (!groups[nome]) {
        groups[nome] = {
          cliente: nome,
          vencidos: 0,
          hoje: 0,
          totalAtivos: 0,
          protocoloReferencia: c.protocolo,
          telefone: c.telefone || '',
          oldestOverdueISO: null,
          cases: []
        };
      }

      groups[nome].totalAtivos++;
      groups[nome].cases.push(c);
      
      if (c.status === 'Vencido') {
        groups[nome].vencidos++;
        // Manter a data mais antiga para ordenação
        const currentISO = c.proximoPrazo?.split('/').reverse().join('-'); // Simplistic DD/MM/YYYY to YYYY-MM-DD
        if (!groups[nome].oldestOverdueISO || (currentISO && currentISO < groups[nome].oldestOverdueISO)) {
          groups[nome].oldestOverdueISO = currentISO;
        }
      }
      
      if (c.status === 'É Hoje') {
        groups[nome].hoje++;
      }
    });

    // 2. Filtrar apenas grupos com Vencidos ou Hoje
    return Object.values(groups)
      .filter(g => (g.vencidos > 0 || g.hoje > 0) && g.cliente.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        // Ordenação por criticidade:
        // 1. Volume de vencidos
        if (b.vencidos !== a.vencidos) return b.vencidos - a.vencidos;
        
        // 2. Data mais antiga entre os vencidos (mais tempo em atraso)
        if (a.oldestOverdueISO && b.oldestOverdueISO) {
           return a.oldestOverdueISO.localeCompare(b.oldestOverdueISO);
        }
        if (a.oldestOverdueISO) return -1;
        if (b.oldestOverdueISO) return 1;

        // 3. Volume de casos "É Hoje"
        if (b.hoje !== a.hoje) return b.hoje - a.hoje;

        // 4. Volume total de ativos do cliente
        return b.totalAtivos - a.totalAtivos;
      });
  }, [cases, search]);

  const stats = useMemo(() => {
    return {
      totalContatos: taskGroups.length,
      vencidos: taskGroups.filter(g => g.vencidos > 0).length,
      hoje: taskGroups.filter(g => g.hoje > 0 && g.vencidos === 0).length
    };
  }, [taskGroups]);

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
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Priorização Estratégica • Hoje</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={loadData} className="h-10 w-10 rounded-xl hover:bg-secondary">
              <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin text-primary")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 max-w-[1400px] mx-auto w-full space-y-10">
          {/* KPI BAR */}
          {!loading && taskGroups.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-primary bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contatos Recomendados</p>
                <h3 className="text-3xl font-black tracking-tighter text-foreground">{stats.totalContatos}</h3>
              </div>
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-red-500 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Com Processos Vencidos</p>
                <h3 className="text-3xl font-black tracking-tighter text-red-600">{stats.vencidos}</h3>
              </div>
              <div className="premium-card p-6 flex flex-col justify-center border-l-4 border-l-blue-500 bg-white shadow-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prazos Apenas para Hoje</p>
                <h3 className="text-3xl font-black tracking-tighter text-blue-600">{stats.hoje}</h3>
              </div>
            </section>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Pesquisar por titular na fila..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white border border-border/50 rounded-xl text-xs font-bold uppercase focus-visible:ring-primary/20"
                />
              </div>
              <Badge variant="outline" className="bg-secondary/50 border-none font-black text-[10px] uppercase px-4 py-2">
                Fila Ativa: {taskGroups.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {taskGroups.length > 0 ? (
                taskGroups.map((group) => (
                  <div key={group.cliente} className="premium-card p-6 bg-white border border-border/40 hover:border-primary/40 transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <Phone size={24} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {group.vencidos > 0 && (
                          <Badge className="bg-red-50 text-red-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                            <ShieldAlert size={10} /> {group.vencidos} Vencido{group.vencidos > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {group.hoje > 0 && (
                          <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                            <Clock size={10} /> {group.hoje} Prazo{group.hoje > 1 ? 's' : ''} Hoje
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="font-black text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors truncate">{group.cliente}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <CalendarDays size={12} className="opacity-40" />
                        <span>Referência: {group.protocoloReferencia}</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Ações de Gabinete</span>
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
                ))
              ) : (
                <div className="col-span-full py-20 flex items-center justify-center">
                  <EmptyState 
                    icon={CheckCircle} 
                    title={loading ? "Carregando Fila..." : "Gabinete Limpo"} 
                    description={loading ? "Sincronizando tarefas prioritárias do servidor." : "Nenhum contato crítico identificado para esta carteira hoje."}
                    actionLabel={!loading ? "Ir para Processos" : undefined}
                    onAction={() => window.location.href = '/cases'}
                  />
                </div>
              )}
            </div>
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
