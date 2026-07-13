"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  ShieldAlert, 
  Scale, 
  Users,
  FileDown,
  RefreshCcw,
  Copyright
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
    const total = cases.length;
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, Arquivado: 0, 'Sem Prazo': 0 };
    const tribunalCounts: Record<string, number> = {};
    const attorneyCounts: Record<string, number> = {};

    cases.forEach(c => {
      const situacao = (c.situacao || '').toUpperCase();
      const isArchived = ['ENCERRADO', 'SUSPENSO', 'ARQUIVADO'].some(s => situacao.includes(s));
      
      if (isArchived) {
        statusCounts.Arquivado++;
      } else {
        const status = c.status || 'Sem Prazo';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status as keyof typeof statusCounts]++;
        } else {
          statusCounts['Sem Prazo']++;
        }
      }

      const trib = c.tribunal || 'Outros';
      tribunalCounts[trib] = (tribunalCounts[trib] || 0) + 1;
      attorneyCounts[c.advogado || 'NÃO ATRIBUÍDO'] = (attorneyCounts[c.advogado || 'NÃO ATRIBUÍDO'] || 0) + 1;
    });

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topAttorneys = Object.entries(attorneyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { 
      total, 
      statusCounts, 
      topTribunals, 
      topAttorneys 
    };
  }, [cases]);

  const getPercent = (val: number) => metrics.total ? Math.round((val / metrics.total) * 100) : 0;

  const handleExportPDF = () => {
    window.print();
  };

  if (!mounted) return <div className="h-screen bg-[#f3f2f2]" />;

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 print:hidden shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Indicadores Analytics</h1>
            <Badge variant="outline" className="text-black border-black font-black uppercase text-[10px]">Cloud Connected</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-black border-black h-8 font-black uppercase hover:bg-black hover:text-white transition-all">
              <FileDown size={14} className="mr-2" /> Exportar Dossiê
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="text-black hover:bg-black hover:text-white">
              <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-7xl mx-auto w-full print:p-0">
          <div className="hidden print:block mb-8 border-b pb-4">
            <h1 className="text-2xl font-black text-black uppercase">Relatório de Gestão Analítica</h1>
            <p className="text-sm text-black/60 font-bold uppercase tracking-widest">Extraído em: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="bg-white border border-[#dddbda] rounded-sm p-8 shadow-sm print:bg-white print:border-gray-200 group hover:bg-black transition-all cursor-default">
            <div className="flex items-center gap-3 mb-8 print:hidden">
              <div className="icon-3d-wrapper">
                <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                  <ShieldAlert className="text-white group-hover:text-black w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Saúde Procedural</h2>
                <p className="text-[10px] text-black/60 group-hover:text-white/60 font-black uppercase">Distribuição de casos via nuvem W1 Capital.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricItem label="Vencido (Crítico)" value={metrics.statusCounts.Vencido} pct={getPercent(metrics.statusCounts.Vencido)} color="bg-red-600" />
              <MetricItem label="Atenção (Alerta)" value={metrics.statusCounts.Atenção} pct={getPercent(metrics.statusCounts.Atenção)} color="bg-orange-500" />
              <MetricItem label="No Prazo (Saudável)" value={metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo']} pct={getPercent(metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo'])} color="bg-green-600" />
              <MetricItem label="Arquivado / Encerrado" value={metrics.statusCounts.Arquivado} pct={getPercent(metrics.statusCounts.Arquivado)} color="bg-gray-400" />
            </div>

            <div className="h-3 w-full bg-[#f3f2f2] rounded-full flex overflow-hidden border border-[#dddbda] group-hover:border-white/20 transition-all">
              <div style={{ width: `${getPercent(metrics.statusCounts.Vencido)}%` }} className="bg-red-600 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts.Atenção)}%` }} className="bg-orange-500 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts['No Prazo'] + metrics.statusCounts['Sem Prazo'])}%` }} className="bg-green-600 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts.Arquivado)}%` }} className="bg-gray-400 h-full transition-all duration-1000" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex items-center gap-3 mb-8 print:hidden">
                <div className="icon-3d-wrapper">
                  <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                    <Scale className="text-white group-hover:text-black w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Carga por Tribunal</h2>
                </div>
              </div>

              <div className="space-y-7">
                {metrics.topTribunals.length > 0 ? metrics.topTribunals.map(([name, count]) => (
                  <div key={name} className="space-y-2.5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">
                      <span>{name}</span>
                      <span className="text-black/60 group-hover:text-white/60">{count} ({getPercent(count)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#f3f2f2] rounded-full overflow-hidden border border-[#dddbda] group-hover:border-white/10 transition-all">
                      <div className="h-full bg-black group-hover:bg-white transition-all duration-1000" style={{ width: `${getPercent(count)}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-[#dddbda] rounded-sm">
                    <p className="text-sm font-black uppercase text-black/40">Sem dados para sincronia.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border border-[#dddbda] rounded-sm p-8 hover:bg-black group transition-all cursor-default">
              <div className="flex items-center gap-3 mb-8 print:hidden">
                <div className="icon-3d-wrapper">
                  <div className="icon-3d-block black w-10 h-10 rounded-sm group-hover:bg-white">
                    <Users className="text-white group-hover:text-black w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-black group-hover:text-white uppercase tracking-wider">Volume por Advogado</h2>
                </div>
              </div>

              <div className="space-y-7">
                {metrics.topAttorneys.length > 0 ? metrics.topAttorneys.map(([name, count]) => (
                  <div key={name} className="space-y-2.5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">
                      <span className="truncate pr-4">{name}</span>
                      <span className="text-black/60 group-hover:text-white/60 shrink-0">{count} ({getPercent(count)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#f3f2f2] rounded-full overflow-hidden border border-[#dddbda] group-hover:border-white/10 transition-all">
                      <div className="h-full bg-black group-hover:bg-white transition-all duration-1000" style={{ width: `${getPercent(count)}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-[#dddbda] rounded-sm">
                    <p className="text-sm font-black uppercase text-black/40">Aguardando sincronia...</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 hover:text-black transition-colors cursor-default">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30" />
          <span className="text-black uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
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
