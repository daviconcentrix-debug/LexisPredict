"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  RefreshCcw, 
  FileCheck,
  Copyright,
  TrendingUp
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
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
      if (Array.isArray(caseData)) setCases(caseData);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

  const metrics = useMemo(() => {
    const total = cases.length;
    const critical = cases.filter(c => c.status === 'Vencido' || c.risco === 'Crítico').length;
    const active = cases.filter(c => !['Arquivado', 'Encerrado'].includes(c.status)).length;
    const riskScore = total ? Math.round((critical / total) * 100) : 0;

    const statusData = [
      { name: t.statusVencido, value: cases.filter(c => c.status === 'Vencido').length, color: '#ef4444' },
      { name: t.statusAtencao, value: cases.filter(c => c.status === 'Atenção').length, color: '#f59e0b' },
      { name: t.statusPrazo, value: cases.filter(c => c.status === 'No Prazo').length, color: '#22c55e' },
    ].filter(d => d.value > 0);

    return { total, critical, active, riskScore, statusData };
  }, [cases, t]);

  if (!mounted) return <div className="flex h-screen bg-black" />;

  return (
    <AppShell>
      <header className="h-16 border-b border-border/30 flex items-center justify-between px-8 bg-background/20 backdrop-blur-md">
        <h1 className="font-bold text-sm tracking-[0.2em] uppercase">{t.controlPanel}</h1>
        <Button variant="ghost" size="icon" onClick={loadData}><RefreshCcw size={16} className={cn(loading && "animate-spin")} /></Button>
      </header>

      <div className="flex-1 overflow-auto p-8 space-y-10">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total sob Gestão" value={loading ? "..." : metrics.total} icon={<Briefcase size={16} />} color="primary" />
          <StatCard title="Alertas Críticos" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={16} />} color="destructive" />
          <StatCard title="Risco de Gabinete" value={loading ? "..." : `${metrics.riskScore}%`} icon={<TrendingUp size={16} />} color="destructive" />
          <StatCard title="Demandas Ativas" value={loading ? "..." : metrics.active} icon={<FileCheck size={16} />} color="success" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <section className="bg-background/40 backdrop-blur-xl border border-border/50 rounded-lg p-6 h-[350px]">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Status de Missão</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {metrics.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
           </section>
           
           <aside className="bg-primary/10 border border-primary/20 rounded-lg p-8 flex flex-col justify-center items-center text-center space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight">Dossiê de Missão</h2>
              <p className="text-[10px] uppercase opacity-60">Relatório consolidado de auditoria forense sincronizado.</p>
              <Button asChild className="w-full bg-primary text-primary-foreground font-black uppercase text-[10px]"><Link href="/report">Acessar Relatório PDF</Link></Button>
           </aside>
        </div>
      </div>

      <footer className="h-10 border-t border-border/30 flex items-center justify-center text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">
        <Copyright size={10} className="mr-2" /> 2026 W1 Capital • Advanced Legal Ops
      </footer>
    </AppShell>
  );
}
