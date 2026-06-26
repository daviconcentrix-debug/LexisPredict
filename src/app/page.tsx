
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  Briefcase, 
  ShieldAlert, 
  BarChart3, 
  RefreshCcw, 
  FileDown, 
  FileCheck,
  Copyright
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';
import Link from 'next/link';

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
      console.error('Salesforce sync failure:', error);
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
      .slice(0, 8);
  }, [cases]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 border-b border-[#dddbda] bg-white flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="font-black text-lg text-black tracking-tight uppercase hover:bg-black hover:text-white px-2 py-1 transition-colors rounded-sm cursor-default">
              Painel de Gabinete (Get Assessoria)
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <Button variant="default" size="sm" asChild className="bg-black hover:bg-gray-800 text-white font-black h-9 px-6 rounded shadow-md uppercase text-xs border-none">
                <Link href="/report">
                  <FileDown size={14} className="mr-2" /> Extrair Relatório Mestre
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#f3f2f2] p-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Volume de Processos" value={loading ? "..." : metrics.total} icon={<Briefcase size={20} />} color="primary" />
            <StatCard title="Alertas de Crise" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={20} />} color="destructive" />
            <StatCard title="Health Score (Risk)" value={loading ? "..." : `${metrics.riskScore}%`} icon={<BarChart3 size={20} />} color="destructive" />
            <StatCard title="Auditorias Ativas" value={loading ? "..." : metrics.active} icon={<FileCheck size={20} />} color="success" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 space-y-6">
              <div className="bg-white border border-[#dddbda] rounded shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#dddbda] bg-[#f8f9fb] flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-sm text-black uppercase tracking-wider hover:bg-black hover:text-white px-2 py-1 transition-colors rounded-sm inline-block cursor-default">Fila de Prioridade Crítica</h2>
                    <p className="text-[11px] text-black/60 font-black uppercase">Triagem consolidada via Unidade de Auditoria.</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="text-[11px] font-black h-7 border-black hover:bg-black hover:text-white text-black uppercase transition-all">
                    <Link href="/cases">Ver Registros</Link>
                  </Button>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f3f2f2] text-[10px] font-black text-black/40 uppercase tracking-widest border-b border-[#dddbda]">
                      <tr>
                        <th className="px-6 py-3">Tribunal</th>
                        <th className="px-6 py-3">Conta / Cliente</th>
                        <th className="px-6 py-3">Protocolo CNJ</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dddbda]">
                      {urgentQueue.length > 0 ? urgentQueue.map((c) => (
                        <tr key={c.id} className="hover:bg-black group transition-all cursor-default">
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-[#e2e2e2] text-black border-black font-black text-[10px] uppercase group-hover:bg-white group-hover:text-black">
                              {c.tribunal}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-black text-black group-hover:text-white uppercase transition-colors">{c.cliente}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-mono text-black/60 group-hover:text-white/60 font-bold">{c.protocolo}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded border-none shadow-sm text-white",
                              c.status === 'Vencido' ? "bg-red-600" : "bg-orange-500"
                            )}>
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-black/60 text-sm font-black uppercase tracking-widest italic">Nenhum alerta crítico pendente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-white border-2 border-black rounded shadow-lg p-8 text-black flex flex-col justify-center relative overflow-hidden group transition-all hover:bg-black cursor-default">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 group-hover:text-white transition-all">
                  <FileCheck size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="icon-3d-wrapper w-fit">
                    <div className="icon-3d-block black w-12 h-12 rounded-sm group-hover:bg-white">
                      <FileCheck size={28} className="text-white group-hover:text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight group-hover:text-white transition-colors">Dossiê de Gabinete</h2>
                    <p className="text-xs text-black/60 group-hover:text-white/60 mt-2 leading-relaxed font-black uppercase">Relatório Oficial auditado e selado por Davi Alves Figueredo.</p>
                  </div>
                  <Button variant="default" asChild className="bg-black border-none hover:bg-gray-800 text-white w-full font-black h-11 rounded-sm mt-4 uppercase text-xs group-hover:bg-white group-hover:text-black">
                    <Link href="/report">Acessar PDF Oficial</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-[#dddbda] rounded shadow-sm p-6 space-y-4 hover:border-black transition-colors cursor-default group">
                <h3 className="text-[11px] font-black text-black/40 uppercase tracking-widest group-hover:text-black transition-colors">Sincronia Recente</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase">DataJud Pública</span>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 font-black">ONLINE</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase">Servidor de Dados</span>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 font-black">ATIVO</Badge>
                </div>
                <Button variant="ghost" onClick={loadData} className="w-full text-[11px] font-black h-8 text-black hover:bg-black hover:text-white border border-black uppercase transition-all">
                  <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Forçar Sincronização
                </Button>
              </div>
            </aside>
          </div>

          <footer className="pt-10 pb-8 border-t border-border/30 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors cursor-default">
              <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
            </div>
            <div className="px-4 py-1 bg-white border border-black rounded-full shadow-sm hover:bg-black hover:text-white transition-all cursor-default group">
              <p className="text-[9px] uppercase tracking-tighter font-black text-black group-hover:text-white">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
