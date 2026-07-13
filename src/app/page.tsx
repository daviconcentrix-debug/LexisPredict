
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  RefreshCcw, 
  FileCheck,
  Copyright,
  TrendingUp,
} from 'lucide-react';
import { LegalCase, distribuirPorTribunal } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

  const t = useMemo(() => getTranslation(locale), [locale]);

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
      console.error('[Dashboard] Load Data Fail', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const metrics = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.status === 'Vencido' || c.risco === 'Crítico').length;
    const active = cases.filter(c => !['Arquivado', 'Encerrado'].includes(c.status)).length;
    const riskScore = total ? Math.round(((critical) / total) * 100) : 0;

    const statusData = [
      { name: t.statusVencido, value: cases.filter(c => c.status === 'Vencido').length, color: '#ef4444' },
      { name: t.statusAtencao, value: cases.filter(c => c.status === 'Atenção').length, color: '#f59e0b' },
      { name: t.statusPrazo, value: cases.filter(c => c.status === 'No Prazo').length, color: '#22c55e' },
    ].filter(d => d.value > 0);

    const tribunalData = distribuirPorTribunal(cases)
      .map(item => ({ name: item.tribunal, count: item.total }))
      .slice(0, 5);

    return { total, critical, active, riskScore, statusData, tribunalData };
  }, [cases, t]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.controlPanel}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9 text-muted-foreground hover:text-primary">
               <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total sob Gestão" value={loading ? "..." : metrics.total} icon={<Briefcase size={16} />} color="primary" />
            <StatCard title="Alertas Críticos" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={16} />} color="destructive" />
            <StatCard title="Risco de Gabinete" value={loading ? "..." : `${metrics.riskScore}%`} icon={<TrendingUp size={16} />} color="destructive" />
            <StatCard title="Demandas Ativas" value={loading ? "..." : metrics.active} icon={<FileCheck size={16} />} color="success" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="bg-card border border-border/50 rounded-md p-6 h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Distribuição de Status</h3>
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
            </div>

            <aside className="space-y-6">
              <div className="bg-card border border-border/50 rounded-md p-6 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-tight">Dossiê de Missão</h2>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium uppercase tracking-[0.1em]">Relatório consolidado de auditoria forense sincronizado.</p>
                  </div>
                  <Button variant="default" asChild className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-sm uppercase text-[10px] tracking-[0.15em]">
                    <Link href="/report">Acessar Relatório PDF</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <footer className="h-10 border-t border-border/30 flex items-center justify-center text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/40 shrink-0">
          <Copyright size={10} className="mr-2" /> 2026 W1 Capital • Advanced Legal Ops
        </footer>
      </main>
    </div>
  );
}
