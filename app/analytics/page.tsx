
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  ShieldAlert, 
  Scale, 
  Users,
  FileDown,
  RefreshCcw,
  Copyright,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchRepoCases } from '@/app/actions/case-actions';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function AnalyticsPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function load() {
      setLoading(true);
      try {
        const repoData = await fetchRepoCases();
        if (repoData) setCases(repoData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = cases.length;
    if (total === 0) return null;

    const ativos = cases.filter(c => !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase()));
    const totalAtivos = ativos.length;
    
    const statusCounts = {
      vencidos: cases.filter(c => c.status === 'Vencido' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length,
      hoje: cases.filter(c => c.status === 'É Hoje' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length,
      atencao: cases.filter(c => c.status === 'Atenção' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length,
      noPrazo: cases.filter(c => c.status === 'No Prazo' && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length,
      semPrazo: cases.filter(c => (c.status === 'Sem Prazo' || !c.proximoPrazo) && !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length,
      finalizados: cases.filter(c => ['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].includes(String(c.situacao).toUpperCase())).length
    };

    const tribunalCounts: Record<string, number> = {};
    cases.forEach(c => {
      const trib = c.tribunal || "Outros";
      tribunalCounts[trib] = (tribunalCounts[trib] || 0) + 1;
    });

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.split(' - ')[0], count }));

    const pieData = [
      { name: 'Vencidos', value: statusCounts.vencidos, color: '#ef4444' },
      { name: 'Hoje', value: statusCounts.hoje, color: '#3b82f6' },
      { name: 'Atenção', value: statusCounts.atencao, color: '#f97316' },
      { name: 'No Prazo', value: statusCounts.noPrazo, color: '#10b981' },
    ].filter(d => d.value > 0);

    return { total, totalAtivos, statusCounts, topTribunals, pieData };
  }, [cases]);

  const handleExportPDF = () => window.print();

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-white/60 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-40 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-black text-white rounded-lg shadow-lg">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Business Intelligence</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="premium-card h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-wider border-none">
              <FileDown size={14} className="mr-2" /> Exportar Dados
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-10 w-10 rounded-xl hover:bg-secondary">
              <RefreshCcw size={18} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 space-y-10 max-w-[1600px] mx-auto w-full print:p-0 print:bg-white">
          {/* TOP CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Total da Carteira" value={metrics?.total || 0} icon={<Users />} color="blue" />
            <MetricCard label="Processos Ativos" value={metrics?.totalAtivos || 0} icon={<ActivityIcon />} color="emerald" />
            <MetricCard label="Urgência Crítica" value={metrics?.statusCounts.vencidos || 0} icon={<ShieldAlert />} color="red" />
            <MetricCard label="Prazos para Hoje" value={metrics?.statusCounts.hoje || 0} icon={<Clock />} color="orange" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* TRIBUNAL ANALYSIS */}
            <div className="xl:col-span-8 premium-card p-8 bg-white min-h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Scale size={18} className="text-muted-foreground" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Volumetria por Tribunal</h3>
                </div>
                <Badge variant="secondary" className="bg-secondary/50 border-none text-[10px] font-black uppercase px-3 py-1 rounded-full">Top 6 Instâncias</Badge>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.topTribunals || []}>
                    <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {metrics?.topTribunals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#000' : '#cbd5e1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* STATUS DISTRIBUTION */}
            <div className="xl:col-span-4 premium-card p-8 bg-white h-[450px] flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <PieChartIcon size={18} className="text-muted-foreground" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Higiene da Carteira</h3>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.pieData || []}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {metrics?.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {metrics?.pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black uppercase text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="h-10 border-t border-border/50 bg-white flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em] shrink-0 print:hidden">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="text-foreground">Relatório Analítico • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const styles: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    red: "text-red-600 bg-red-50",
    orange: "text-orange-600 bg-orange-50"
  };

  return (
    <div className="premium-card p-6 flex flex-col justify-between group hover:bg-black transition-all">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-white/60">{label}</p>
          <h3 className="text-3xl font-black tracking-tighter text-foreground tabular-nums group-hover:text-white">{value}</h3>
        </div>
        <div className={cn("p-2.5 rounded-lg group-hover:bg-white/10 group-hover:text-white transition-colors", styles[color])}>
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  );
}
