
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  RefreshCcw, 
  FileDown, 
  FileCheck,
  Copyright,
  ChevronRight,
  TrendingUp,
  Activity,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';
import { getTranslation, Locale } from '@/lib/i18n';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<Locale>('pt');

  const t = getTranslation(locale);

  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('lexisPredict_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const caseData = await fetchRepoCases();
      if (Array.isArray(caseData)) {
        setCases(caseData);
      }
    } catch (error) {
      console.log('SYNC_FAIL');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const metrics = useMemo(() => {
    // Filtro de casos ativos (ignora finalizados)
    const activeCases = cases.filter(c => {
      const sit = (c.situacao || '').toUpperCase();
      return !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].some(s => sit.includes(s));
    });

    const total = cases.length;
    const active = activeCases.length;
    
    // Risco e Críticos calculados apenas sobre os ativos
    const critical = activeCases.filter(c => c.status === 'Vencido' || c.status === 'Crítico' || c.status === 'É Hoje').length;
    const riskScore = active ? Math.round((critical / active) * 100) : 0;

    // Data for charts - "No Prazo" is now the "Healthy" metric
    const statusData = [
      { name: t.statusVencido, value: activeCases.filter(c => c.status === 'Vencido' || c.status === 'É Hoje').length, color: '#ef4444' },
      { name: t.statusAtencao, value: activeCases.filter(c => c.status === 'Atenção').length, color: '#f59e0b' },
      { name: "Saudáveis (No Prazo)", value: activeCases.filter(c => c.status === 'No Prazo').length, color: '#22c55e' },
    ].filter(d => d.value > 0);

    const tribunalCounts: Record<string, number> = {};
    activeCases.forEach(c => {
      tribunalCounts[c.tribunal] = (tribunalCounts[c.tribunal] || 0) + 1;
    });
    const tribunalData = Object.entries(tribunalCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total, critical, active, riskScore, statusData, tribunalData };
  }, [cases, t]);

  const urgentQueue = useMemo(() => {
    return cases
      .filter(c => c.status === 'Vencido' || c.status === 'Atenção' || c.status === 'É Hoje')
      .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
      .slice(0, 5);
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.controlPanel}</h1>
            <div className="hidden xl:flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-l border-border/30 pl-6">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t.activeTelemetry}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex border-border/50 hover:border-primary hover:bg-primary/10 text-xs font-semibold h-9 px-6 rounded-sm uppercase tracking-wider transition-all">
              <Link href="/report">
                <FileDown size={14} className="mr-2" /> Master Report
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 text-muted-foreground hover:text-primary">
               <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          {/* TOP METRICS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Repository" value={loading ? "..." : metrics.total} icon={<Briefcase size={16} />} color="accent" />
            <StatCard title="Demandas Ativas" value={loading ? "..." : metrics.active} icon={<Activity size={16} />} color="primary" />
            <StatCard title="Alertas Críticos" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={16} />} color="destructive" />
            <StatCard title="Indice de Risco" value={loading ? "..." : `${metrics.riskScore}%`} icon={<TrendingUp size={16} />} color="destructive" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* CHARTS SECTION */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Saúde da Carteira Ativa</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                     {metrics.statusData.map((d, i) => (
                       <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[9px] font-bold uppercase opacity-60">{d.name}</span>
                       </div>
                     ))}
                  </div>
               </section>

               <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Top Tribunals</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.tribunalData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </section>

               <section className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-primary" />
                    <h2 className="font-bold text-[11px] uppercase tracking-[0.2em]">{t.priorityQueue}</h2>
                  </div>
                </div>

                <div className="bg-card border border-border/50 rounded-md overflow-hidden">
                  <table className="mission-control-table">
                    <thead>
                      <tr>
                        <th>Tribunal</th>
                        <th>Account / Client</th>
                        <th>Protocol Number</th>
                        <th className="text-right">Operational Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgentQueue.length > 0 ? urgentQueue.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td>
                            <Badge variant="outline" className="border-border text-[9px] font-bold uppercase tracking-wider rounded-sm px-2 py-0.5">
                              {c.tribunal}
                            </Badge>
                          </td>
                          <td className="font-bold uppercase tracking-wide text-foreground/90">{c.cliente}</td>
                          <td className="font-mono text-[10px] text-muted-foreground">{c.protocolo}</td>
                          <td className="text-right">
                            <Badge className={cn(
                              "text-[9px] font-bold uppercase px-3 py-1 rounded-sm border-none",
                              c.status === 'Vencido' || c.status === 'É Hoje' ? "bg-destructive/20 text-destructive" : "bg-orange-500/20 text-orange-400"
                            )}>
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-24 text-center opacity-30 italic uppercase tracking-widest text-[10px]">
                             Telemetry clear. No urgent tasks detected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* SIDEBAR DASHBOARD */}
            <aside className="space-y-6">
              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">Mission Dossier</h2>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium uppercase tracking-[0.1em]">Consolidated forensic report verified under authority protocols.</p>
                  </div>
                  <Button variant="default" asChild className="w-full bg-primary text-black font-bold h-11 rounded-sm uppercase text-[10px] tracking-[0.15em] hover:bg-primary/90 transition-all">
                    <Link href="/report">Access PDF Analytics</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6">
                <h3 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.25em]">Network Telemetry</h3>
                <div className="space-y-4">
                  <TelemetryItem label="DataJud Public Node" status="nominal" />
                  <TelemetryItem label="Cloud Tenant Sync" status="nominal" />
                  <TelemetryItem label="Neural Resilience" status="elite" />
                </div>
              </div>
            </aside>
          </div>

          <footer className="pt-12 pb-8 border-t border-border/30 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/40">
              <Copyright size={10} /> 2026 W1 Capital • Advanced Ops
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function TelemetryItem({ label, status }: { label: string, status: 'nominal' | 'elite' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      <Badge className={cn(
        "text-[8px] font-bold rounded-sm px-2 py-0.5 border-none",
        status === 'nominal' ? "bg-green-500/20 text-green-400" : "bg-primary text-black"
      )}>
        {status.toUpperCase()}
      </Badge>
    </div>
  );
}
