
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  TrendingUp,
  Database,
  Search,
  ChevronRight,
  Scale,
  RefreshCcw,
  BrainCircuit
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const repoData = await fetchRepoCases();
      if (repoData && repoData.length > 0) {
        setCases(repoData);
        localStorage.setItem('lexisPredict_cloud_cache', JSON.stringify(repoData));
      } else {
        const cached = localStorage.getItem('lexisPredict_cloud_cache');
        if (cached) setCases(JSON.parse(cached));
        else setCases([]);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.status === 'Vencido').length;
    const attention = cases.filter(c => c.status === 'Atenção').length;
    const processed = cases.filter(c => c.situacao === 'EM ANDAMENTO').length;
    const riskScore = total ? Math.round(((critical + attention) / total) * 100) : 0;

    return { total, critical, attention, processed, riskScore };
  }, [cases]);

  const urgentQueue = useMemo(() => {
    return cases
      .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
      .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Intelligence Unit</h1>
            <Badge variant="outline" className="border-primary/50 text-primary text-[10px] uppercase font-bold tracking-tighter">Live Supabase Database</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={loadData} className="text-muted-foreground hover:text-white">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search cases..." 
                className="pl-10 h-9 bg-secondary border-none text-xs rounded-full focus-visible:ring-primary text-white"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total de Processos" 
              value={loading ? "..." : stats.total} 
              icon={<Briefcase size={20} />} 
              trend="Global Repository"
              trendUp
            />
            <StatCard 
              title="Alertas Críticos" 
              value={loading ? "..." : stats.critical} 
              icon={<ShieldAlert size={20} />} 
              color="destructive"
              trend="Requires Action"
            />
            <StatCard 
              title="Taxa de Risco" 
              value={loading ? "..." : `${stats.riskScore}%`} 
              icon={<TrendingUp size={20} />} 
              color="accent"
            />
            <StatCard 
              title="Ativos" 
              value={loading ? "..." : stats.processed} 
              icon={<Scale size={20} />} 
              color="success"
              trend="Ongoing Procedures"
              trendUp
            />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-headline font-bold text-lg text-white">Priority Queue</h2>
                  <p className="text-xs text-muted-foreground">Highest risk cases requiring immediate attention.</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                  Cloud Sync Active
                </Badge>
              </div>

              {urgentQueue.length > 0 ? (
                <div className="space-y-3">
                  {urgentQueue.map((c) => (
                    <div key={c.protocolo} className="group p-4 bg-secondary/30 border border-border hover:border-primary/50 rounded-xl transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0",
                          c.status === 'Vencido' ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                        )}>
                          {c.tribunal}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-primary transition-colors">{c.cliente}</p>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{c.protocolo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Return Date</p>
                          <p className="text-sm font-medium text-white">{c.proximoPrazo}</p>
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 font-bold rounded-md",
                          c.status === 'Vencido' ? "bg-destructive/20 text-destructive border-destructive/20" : "bg-accent/20 text-accent border-accent/20"
                        )}>
                          {c.diasFaltando !== null && c.diasFaltando < 0 ? `${Math.abs(c.diasFaltando)}d VENCIDO` : `${c.diasFaltando}d RESTANDO`}
                        </Badge>
                        <ChevronRight className="text-muted-foreground w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-secondary/10">
                  <div className="p-4 bg-secondary rounded-full mb-4">
                    <Scale className="text-muted-foreground w-8 h-8" />
                  </div>
                  <h3 className="text-white font-bold">{loading ? "Synchronizing..." : "No High-Risk Cases"}</h3>
                  <p className="text-sm text-muted-foreground">{loading ? "Connecting to Supabase cloud..." : "Queue is clear. All deadlines are healthy."}</p>
                </div>
              )}
            </section>

            <section className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
              
              <div className="relative z-10 space-y-6">
                <div className="p-3 bg-white/20 w-fit rounded-xl backdrop-blur-md border border-white/20">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-bold">Cloud Persistence</h2>
                  <p className="text-sm text-white/80 font-medium leading-relaxed mt-2">
                    Your legal data is now automatically synced across all machines using <strong>Supabase</strong>. No manual syncing is required anymore.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-2">
                    <span>Sync Status</span>
                    <span className="text-white">Continuous</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-2">
                    <span>Engine Pulse</span>
                    <span className="text-white flex items-center gap-1">
                      <BrainCircuit size={10} className="text-accent animate-pulse" /> Operational
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
