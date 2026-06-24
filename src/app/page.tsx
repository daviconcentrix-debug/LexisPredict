
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  TrendingUp,
  RefreshCcw,
  FileDown,
  ChevronRight,
  Copyright,
  Zap,
  Scale
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';

/**
 * INTELLIGENCE UNIT — DASHBOARD MESTRE (W1 CAPITAL)
 * FUNDADOR E GESTOR: DAVI ALVES FIGUEREDO
 */
export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const caseData = await fetchRepoCases();
      if (Array.isArray(caseData)) setCases(caseData);
    } catch (error) {
      console.error('Dashboard sync failure:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const metrics = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.status === 'Vencido').length;
    const attention = cases.filter(c => c.status === 'Atenção').length;
    const active = cases.filter(c => !['ENCERRADO', 'ARQUIVADO'].includes((c.situacao || '').toUpperCase())).length;
    const riskScore = total ? Math.round(((critical + attention) / total) * 100) : 0;

    return { total, critical, attention, active, riskScore };
  }, [cases]);

  const urgentQueue = useMemo(() => {
    return cases
      .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
      .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
      .slice(0, 10);
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Intelligence Unit</h1>
            <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase font-bold tracking-widest">
              W1 Capital Cloud CRM
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90 text-white h-8 font-bold shadow-lg">
              <Link href="/report">
                <FileDown size={14} className="mr-2" /> Unified Master Report
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="text-muted-foreground hover:text-white">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total de Processos" value={loading ? "..." : metrics.total} icon={<Briefcase size={20} />} trend="Global" trendUp />
            <StatCard title="Alertas Críticos" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={20} />} color="destructive" trend="Ação Imediata" />
            <StatCard title="Taxa de Risco" value={loading ? "..." : `${metrics.riskScore}%`} icon={<TrendingUp size={20} />} color="accent" />
            <StatCard title="Casos Ativos" value={loading ? "..." : metrics.active} icon={<Scale size={20} />} color="success" trend="Fluxo" trendUp />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-8">
            <section className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-headline font-bold text-lg text-white uppercase tracking-tight">Priority Queue</h2>
                  <p className="text-xs text-muted-foreground">Triagem técnica baseada em proximidade de prazo.</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                  <Link href="/cases">View All Cases <ChevronRight size={12} className="ml-1" /></Link>
                </Button>
              </div>

              {urgentQueue.length > 0 ? (
                <div className="space-y-3">
                  {urgentQueue.map((c) => (
                    <div key={c.id} className="p-4 bg-secondary/30 border border-border hover:border-primary/50 rounded-xl transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px]",
                          c.status === 'Vencido' ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                        )}>{c.tribunal}</div>
                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-primary transition-colors">{c.cliente}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.protocolo}</p>
                        </div>
                      </div>
                      <Badge className={c.status === 'Vencido' ? "bg-destructive/20 text-destructive border-none" : "bg-accent/20 text-accent border-none"}>
                        {c.diasFaltando !== null && c.diasFaltando < 0 ? `${Math.abs(c.diasFaltando)}d ATRASADO` : `${c.diasFaltando}d`}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-40 italic text-white">Sem registros críticos ativos.</div>
              )}
            </section>

            <section className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-white flex flex-col justify-center shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                <div className="p-3 bg-white/20 w-fit rounded-xl border border-white/20">
                  <Zap size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter">Unified Master Report</h2>
                  <p className="text-sm text-white/80 mt-2">Relatório Consolidado assinado oficialmente por Davi Alves Figueredo.</p>
                </div>
                <Button variant="outline" asChild className="bg-white/10 border-white/20 hover:bg-white/20 text-white w-full font-bold h-11">
                  <Link href="/report">View Official PDF</Link>
                </Button>
              </div>
            </section>
          </div>

          <footer className="pt-8 border-t border-border/50 text-center space-y-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Copyright size={10} /> 2024 W1 Capital. Todos os direitos reservados.
            </div>
            <p className="text-[8px] uppercase tracking-tighter font-medium text-primary/80">FUNDADOR DAVI ALVES FIGUEREDO • LEXISPREDICT AI ENGINE</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
