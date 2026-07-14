
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
  TrendingUp,
  Activity,
  Cpu,
  Clock,
  Calendar
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
    const activeCases = cases.filter(c => {
      const sit = (c.situacao || '').toUpperCase();
      return !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].some(s => sit.includes(s));
    });

    const totalRepo = cases.length;
    const activeTotal = activeCases.length;
    
    // KPIs Estratégicos
    const vencidos = activeCases.filter(c => c.status === 'Vencido').length;
    const venceHoje = activeCases.filter(c => c.status === 'É Hoje').length;
    const proximos7 = activeCases.filter(c => (c.diasFaltando !== null && c.diasFaltando > 0 && c.diasFaltando <= 7)).length;
    
    // Tempo Médio de Atraso
    const vencidosArray = activeCases.filter(c => c.status === 'Vencido' && c.diasFaltando !== null);
    const tempoMedio = vencidosArray.length > 0 
      ? Math.round(Math.abs(vencidosArray.reduce((acc, c) => acc + (c.diasFaltando || 0), 0)) / vencidosArray.length) 
      : 0;

    // Pontuação de Risco Ponderada
    const riskSum = (vencidos * 100) + (venceHoje * 80) + (proximos7 * 40);
    const riskScore = activeTotal > 0 ? Math.round((riskSum / (activeTotal * 100)) * 100) : 0;

    const statusData = [
      { name: 'Vencidos', value: vencidos, color: '#ef4444' },
      { name: 'Vence Hoje', value: venceHoje, color: '#f59e0b' },
      { name: 'Saudáveis', value: activeTotal - vencidos - venceHoje, color: '#22c55e' },
    ].filter(d => d.value > 0);

    const tribunalCounts: Record<string, number> = {};
    activeCases.forEach(c => {
      const t = c.tribunal || 'Outros';
      tribunalCounts[t] = (tribunalCounts[t] || 0) + 1;
    });
    const tribunalData = Object.entries(tribunalCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { 
      totalRepo, 
      activeTotal, 
      vencidos, 
      venceHoje, 
      proximos7, 
      tempoMedio, 
      riskScore, 
      statusData, 
      tribunalData 
    };
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
                <FileDown size={14} className="mr-2" /> Dossiê Operacional
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 text-muted-foreground hover:text-primary">
               <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          {/* TOP EXEC KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Vencem Hoje" value={loading ? "..." : metrics.venceHoje} icon={<Clock size={16} />} color={metrics.venceHoje > 0 ? "destructive" : "primary"} />
            <StatCard title="Vencidos" value={loading ? "..." : metrics.vencidos} icon={<ShieldAlert size={16} />} color="destructive" />
            <StatCard title="Próximos 7 Dias" value={loading ? "..." : metrics.proximos7} icon={<Calendar size={16} />} color="accent" />
            <StatCard title="Atraso Médio" value={loading ? "..." : `${metrics.tempoMedio} dias`} icon={<TrendingUp size={16} />} color="destructive" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Saúde da Carteira Ativa</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metrics.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {metrics.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </section>

               <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Top Tribunais</h3>
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
                <div className="bg-card border border-border/50 rounded-md overflow-hidden">
                  <div className="p-4 border-b border-border/10 bg-secondary/5 flex items-center justify-between">
                     <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Carga de Trabalho Ativa</h3>
                     <Badge className="bg-primary text-black font-black text-[9px] uppercase">{metrics.activeTotal} ATIVOS</Badge>
                  </div>
                  <table className="mission-control-table">
                    <thead>
                      <tr>
                        <th>Tribunal</th>
                        <th>Cliente</th>
                        <th>Protocolo</th>
                        <th className="text-right">Risco Pessoal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.filter(c => c.status === 'Vencido').slice(0, 5).map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td><Badge variant="outline" className="text-[9px] font-bold uppercase">{c.tribunal}</Badge></td>
                          <td className="font-bold uppercase text-[11px]">{c.cliente}</td>
                          <td className="font-mono text-[10px] text-muted-foreground">{c.protocolo}</td>
                          <td className="text-right"><Badge className="bg-red-500/20 text-red-400 border-none text-[9px]">VENCIDO</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">Dossiê Operacional</h2>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed uppercase">Relatório de auditoria executiva para exportação forense.</p>
                  </div>
                  <Button variant="default" asChild className="w-full bg-primary text-black font-bold h-11 rounded-sm uppercase text-[10px] tracking-[0.15em] hover:bg-primary/90 transition-all">
                    <Link href="/report">Gerar Relatório Executivo</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 space-y-4">
                <div className="flex justify-between items-end">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Risco de Gabinete</p>
                   <span className="text-2xl font-black text-primary">{metrics.riskScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${metrics.riskScore}%` }} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
