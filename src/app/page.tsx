
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const syncLock = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = useCallback(async () => {
    if (syncLock.current) return;
    syncLock.current = true;
    
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
      syncLock.current = false;
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
    <div className="flex h-screen bg-transparent font-sans text-black overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-transparent">
        <header className="h-16 lg:h-16 border-b border-black bg-white flex items-center justify-between px-6 lg:px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h1 className="font-black text-lg lg:text-xl text-black tracking-tighter uppercase hover:bg-black hover:text-white px-3 py-1 transition-all rounded-sm cursor-default pl-12 lg:pl-3">
              Painel Elite
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex border-black border-2 hover:bg-black hover:text-white text-black font-black h-10 px-8 rounded-none uppercase text-xs transition-all shadow-[4px_4px_0px_#000]">
              <Link href="/report">
                <FileDown size={14} className="mr-2" /> Relatório Mestre
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild className="sm:hidden border-black border-2 text-black shadow-[2px_2px_0px_#000]">
               <Link href="/report"><FileDown size={16} /></Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-transparent p-4 lg:p-8 space-y-8 relative z-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard title="Processos" value={loading ? "..." : metrics.total} icon={<Briefcase size={20} />} color="primary" />
            <StatCard title="Alertas" value={loading ? "..." : metrics.critical} icon={<ShieldAlert size={20} />} color="destructive" />
            <StatCard title="Health Score" value={loading ? "..." : `${metrics.riskScore}%`} icon={<BarChart3 size={20} />} color="destructive" />
            <StatCard title="Ativas" value={loading ? "..." : metrics.active} icon={<FileCheck size={20} />} color="success" />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                <div className="px-6 py-5 border-b-2 border-black bg-white flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-sm text-black uppercase tracking-widest hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm inline-block cursor-default">Fila de Prioridade</h2>
                    <p className="hidden sm:block text-[10px] text-black font-black uppercase opacity-60 mt-1">Triagem consolidada via Unidade de Auditoria.</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="text-[10px] font-black h-8 border-black border-2 hover:bg-black hover:text-white text-black uppercase transition-all rounded-none px-4">
                    <Link href="/cases">Ver Todos</Link>
                  </Button>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-[#f8f9fb] text-[10px] font-black text-black uppercase tracking-widest border-b-2 border-black">
                      <tr>
                        <th className="px-6 py-4">Tribunal</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Protocolo</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
                      {urgentQueue.length > 0 ? urgentQueue.map((c) => (
                        <tr key={c.id} className="hover:bg-black group transition-all cursor-default">
                          <td className="px-6 py-5">
                            <Badge variant="outline" className="bg-white text-black border-black border-2 font-black text-[10px] uppercase group-hover:bg-white group-hover:text-black">
                              {c.tribunal}
                            </Badge>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-black group-hover:text-white uppercase transition-colors">{c.cliente}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[11px] font-mono text-black group-hover:text-white/70 font-black">{c.protocolo}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase px-3 py-1 rounded-none border-none text-white",
                              c.status === 'Vencido' ? "bg-red-600" : "bg-orange-500"
                            )}>
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-24 text-center text-black text-xs font-black uppercase tracking-widest italic opacity-40">Nenhum alerta crítico pendente.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <aside className="space-y-8 pb-10 lg:pb-0">
              <div className="bg-white border-2 border-black rounded-none p-8 text-black flex flex-col justify-center relative overflow-hidden group transition-all hover:bg-black cursor-default shadow-[8px_8px_0px_#000]">
                <div className="relative z-10 space-y-6">
                  <div className="icon-3d-wrapper w-fit">
                    <div className="icon-3d-block black w-14 h-14 rounded-none group-hover:bg-white border-black border-2">
                      <FileCheck size={32} className="text-white group-hover:text-black" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight group-hover:text-white transition-colors leading-none">Dossiê Oficial</h2>
                    <p className="text-[10px] text-black group-hover:text-white/60 mt-3 leading-relaxed font-black uppercase">Relatório auditado por Davi Alves Figueredo.</p>
                  </div>
                  <Button variant="default" asChild className="bg-white text-black border-2 border-black hover:bg-black hover:text-white w-full font-black h-12 rounded-none mt-4 uppercase text-xs transition-all shadow-[4px_4px_0px_#000] group-hover:shadow-none">
                    <Link href="/report">Acessar PDF</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-white border-2 border-black rounded-none p-6 space-y-5 hover:bg-black group transition-all cursor-default shadow-[8px_8px_0px_#000]">
                <h3 className="text-[11px] font-black text-black uppercase tracking-widest group-hover:text-white transition-colors">Sincronia Gabinete</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-black group-hover:text-white uppercase transition-colors">DataJud Pública</span>
                    <Badge className="text-[9px] text-white bg-green-600 border-none font-black rounded-none px-2 py-0.5">ONLINE</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-black group-hover:text-white uppercase transition-colors">Cloud Sync</span>
                    <Badge className="text-[9px] text-white bg-green-600 border-none font-black rounded-none px-2 py-0.5">ATIVO</Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={loadData} className="w-full text-[10px] font-black h-9 border-black border-2 text-black hover:bg-black hover:text-white group-hover:bg-white group-hover:text-black uppercase transition-all rounded-none mt-2">
                  <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} /> Sincronizar
                </Button>
              </div>
            </aside>
          </div>

          <footer className="pt-12 pb-10 border-t-2 border-black flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-black hover:text-black transition-colors cursor-default">
              <Copyright size={12} /> 2026 W1 Capital.
            </div>
            <div className="px-6 py-2 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_#000] hover:bg-black hover:text-white transition-all cursor-default group">
              <p className="text-[10px] uppercase tracking-tighter font-black text-black group-hover:text-white">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
