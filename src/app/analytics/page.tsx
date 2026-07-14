
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
  Clock
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchRepoCases } from '@/app/actions/case-actions';

export default function AnalyticsPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function load() {
      setLoading(true);
      const repoData = await fetchRepoCases();
      if (repoData && repoData.length > 0) {
        setCases(repoData);
      }
      setLoading(false);
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    // Apenas demandas ativas entram na análise de risco
    const activeCases = cases.filter(c => {
      const sit = (c.situacao || '').toUpperCase();
      return !['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].some(s => sit.includes(s));
    });

    const total = cases.length;
    const active = activeCases.length;
    
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, 'Sem Prazo / Finalizados': 0 };
    const tribunalCounts: Record<string, number> = {};

    cases.forEach(c => {
      const sit = (c.situacao || '').toUpperCase();
      const isFinished = ['ENCERRADO', 'ARQUIVADO', 'EXTINTO', 'SUSPENSO'].some(s => sit.includes(s));
      
      if (isFinished || c.status === 'Sem Prazo') {
        statusCounts['Sem Prazo / Finalizados']++;
      } else {
        const status = c.status || 'Sem Prazo';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status as keyof typeof statusCounts]++;
        } else {
          statusCounts['Sem Prazo / Finalizados']++;
        }
      }

      if (!isFinished) {
        tribunalCounts[c.tribunal || "Outros"] = (tribunalCounts[c.tribunal || "Outros"] || 0) + 1;
      }
    });

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { 
      total,
      active,
      statusCounts, 
      topTribunals
    };
  }, [cases]);

  const getPercentActive = (val: number) => metrics.active ? Math.round((val / metrics.active) * 100) : 0;
  const handleExportPDF = () => window.print();

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 print:hidden shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Indicadores Analytics</h1>
            <Badge variant="outline" className="text-black border-black font-black uppercase text-[10px]">Active DataJud Node</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-black border-black h-8 font-black uppercase hover:bg-black hover:text-white transition-all">
              <FileDown size={14} className="mr-2" /> Exportar Dossiê
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-black hover:bg-black hover:text-white">
              <RefreshCcw size={16} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-7xl mx-auto w-full print:p-0">
          <section className="bg-white border border-[#dddbda] rounded-sm p-8 shadow-sm print:bg-white print:border-gray-200 group hover:bg-black transition-all cursor-default">
            <div className="flex items-center gap-3 mb-8 print:hidden">
              <div className="icon-3d-wrapper"><div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white"><ShieldAlert className="text-white group-hover:text-black w-5 h-5" /></div></div>
              <div>
                <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Saúde da Carteira Ativa ({metrics.active} casos)</h2>
                <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">Frequência de alertas e casos saudáveis em dia.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricItem label="Vencido / Hoje" value={metrics.statusCounts.Vencido} pct={getPercentActive(metrics.statusCounts.Vencido)} color="bg-red-600" />
              <MetricItem label="Atenção (Alerta)" value={metrics.statusCounts.Atenção} pct={getPercentActive(metrics.statusCounts.Atenção)} color="bg-orange-500" />
              <MetricItem label="Saudáveis (No Prazo)" value={metrics.statusCounts['No Prazo']} pct={getPercentActive(metrics.statusCounts['No Prazo'])} color="bg-green-600" />
              <MetricItem label="Finalizados / Outros" value={metrics.statusCounts['Sem Prazo / Finalizados']} pct={Math.round((metrics.statusCounts['Sem Prazo / Finalizados'] / metrics.total) * 100)} color="bg-gray-400" />
            </div>

            <div className="h-3 w-full bg-[#f3f2f2] rounded-full flex overflow-hidden border border-[#dddbda] group-hover:border-white/20 transition-all">
              <div style={{ width: `${getPercentActive(metrics.statusCounts.Vencido)}%` }} className="bg-red-600 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercentActive(metrics.statusCounts.Atenção)}%` }} className="bg-orange-500 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercentActive(metrics.statusCounts['No Prazo'])}%` }} className="bg-green-600 h-full transition-all duration-1000" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex items-center gap-3 mb-8 print:hidden">
                <div className="icon-3d-wrapper"><div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white"><Scale className="text-white group-hover:text-black w-5 h-5" /></div></div>
                <div><h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Carga Ativa por Tribunal</h2></div>
              </div>
              <div className="space-y-7">
                {metrics.topTribunals.length > 0 ? metrics.topTribunals.map(([name, count]) => (
                  <div key={name} className="space-y-2.5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">
                      <span>{name}</span>
                      <span className="text-black/60 group-hover:text-white/60">{count} ({getPercentActive(count)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#f3f2f2] rounded-full overflow-hidden border border-[#dddbda] group-hover:border-white/10 transition-all">
                      <div className="h-full bg-black group-hover:bg-white transition-all duration-1000" style={{ width: `${getPercentActive(count)}%` }} />
                    </div>
                  </div>
                )) : <div className="py-20 text-center border-2 border-dashed border-[#dddbda] rounded-sm"><p className="text-sm font-black uppercase text-black/40">Sem dados ativos.</p></div>}
              </div>
            </section>

            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 border-2 border-green-600 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
                   <CheckCircle2 size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-black group-hover:text-white uppercase tracking-tighter">Higiene de Carteira</h3>
                   <p className="text-[10px] font-black text-black/40 group-hover:text-white/60 uppercase mt-2 tracking-widest">
                     {metrics.statusCounts['Sem Prazo / Finalizados']} processos foram removidos do ciclo de risco.
                   </p>
                 </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:text-black transition-colors cursor-default">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="text-black uppercase">Relatório Analítico • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function MetricItem({ label, value, pct, color }: { label: string, value: number, pct: number, color: string }) {
  return (
    <div className="p-5 bg-[#f3f2f2] border border-[#dddbda] rounded-sm group-hover:bg-gray-900 group-hover:border-white/10 transition-all">
      <p className="text-[10px] font-black text-black/60 group-hover:text-white/60 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-black group-hover:text-white leading-none">{value}</span>
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded text-white mb-0.5", color)}>{pct}%</span>
      </div>
    </div>
  );
}
