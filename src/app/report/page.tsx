
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  FileText, 
  MessageSquare, 
  Copyright, 
  SearchCheck, 
  Scale, 
  Users 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { useAuth } from '@/components/auth/auth-provider';

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { profile } = useAuth();

  const userName = profile?.nome || "Gabinete Técnico";
  const userRole = profile?.cargo || "Operador";

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        // O perfil logado é garantido pelas Server Actions que verificam cookies de empresa_id
        const [casesData, notesData] = await Promise.all([
          fetchRepoCases(),
          fetchRepoNotes()
        ]);

        setCases(casesData || []);
        setNotes(notesData || []);
      } catch (e) {
        console.error("Report extraction failure:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = cases.length;
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, Arquivado: 0, 'Sem Prazo': 0, 'É Hoje': 0, 'Caso Crítico': 0, 'Encerrado': 0 };
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

      tribunalCounts[c.tribunal || 'Outros'] = (tribunalCounts[c.tribunal || 'Outros'] || 0) + 1;
      attorneyCounts[c.advogado || 'Não Atribuído'] = (attorneyCounts[c.advogado || 'Não Atribuído'] || 0) + 1;
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

  if (!mounted || loading) {
    return (
      <div className="p-8 text-center font-mono text-black bg-white min-h-screen flex flex-col items-center justify-center space-y-4">
        <Activity className="animate-spin text-black" size={32} />
        <p className="font-bold uppercase tracking-widest text-[10px] italic">Consolidando Relatório Mestre por Perfil (W1 Capital)...</p>
      </div>
    );
  }

  const highRiskCases = cases
    .filter(c => ['Vencido', 'É Hoje', 'Caso Crítico', 'Atenção'].includes(c.status))
    .slice(0, 100);

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-12 max-w-5xl mx-auto print:p-0">
      
      <div className="flex justify-between items-center mb-10 print:hidden">
        <Button variant="outline" asChild size="sm" className="border-black text-black font-black uppercase text-[10px] rounded-none border-2 shadow-[4px_4px_0px_#000] hover:shadow-none transition-all">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Sistema</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-black text-white font-black px-8 rounded-none uppercase text-[10px] border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-none transition-all">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Dossiê Mestre
        </Button>
      </div>

      <header className="border-b-4 border-black pb-8 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter leading-none">Relatório Jurídico Consolidado</h1>
            <p className="text-sm font-bold text-gray-700 mt-2 uppercase tracking-wide italic">SaaS Multi-Tenant • {profile?.empresa_id || "W1 CAPITAL"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase">{userName}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userRole}</p>
          </div>
        </div>
        <div className="flex justify-between items-end mt-10">
          <div className="flex gap-2">
            <span className="text-[10px] bg-black text-white px-3 py-1 font-bold uppercase">Ofício Executivo de Gabinete</span>
            <span className="text-[10px] border-2 border-black px-3 py-1 font-bold uppercase flex items-center gap-1.5">
              <ShieldCheck size={10} /> Documento Auditado
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">Extraído em: {new Date().toLocaleDateString('pt-BR')} — {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </header>

      {/* 1. INDICADORES DE GESTÃO */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded-none border border-black"><SearchCheck size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">1. Indicadores de Saúde Procedural</h2>
        </div>
        <div className="grid grid-cols-4 gap-6 text-center">
          <div className="p-5 bg-gray-50 border-2 border-black rounded-none shadow-[4px_4px_0px_#000]">
            <p className="text-[9px] font-black text-gray-400 uppercase">Total Geral</p>
            <p className="text-3xl font-black">{metrics.total}</p>
          </div>
          <div className="p-5 bg-red-50 border-2 border-red-600 rounded-none shadow-[4px_4px_0px_#dc2626]">
            <p className="text-[9px] font-black text-red-400 uppercase">Alertas Críticos</p>
            <p className="text-3xl font-black text-red-600">{metrics.statusCounts.Vencido + metrics.statusCounts['É Hoje'] + metrics.statusCounts['Caso Crítico']}</p>
          </div>
          <div className="p-5 bg-amber-50 border-2 border-orange-500 rounded-none shadow-[4px_4px_0px_#f97316]">
            <p className="text-[9px] font-black text-amber-400 uppercase">Em Atenção</p>
            <p className="text-3xl font-black text-orange-600">{metrics.statusCounts.Atenção}</p>
          </div>
          <div className="p-5 bg-green-50 border-2 border-green-600 rounded-none shadow-[4px_4px_0px_#16a34a]">
            <p className="text-[9px] font-black text-green-400 uppercase">Saudáveis</p>
            <p className="text-3xl font-black text-green-600">{metrics.statusCounts['No Prazo']}</p>
          </div>
        </div>
      </section>

      {/* 2. TRIAGEM DE CASOS CRÍTICOS */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded-none border border-black"><FileText size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">2. Triagem de Casos Críticos</h2>
        </div>
        <div className="border-2 border-black rounded-none overflow-hidden">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="uppercase font-extrabold text-gray-700">
                <th className="px-5 py-3 border-r border-gray-300">Cliente</th>
                <th className="px-5 py-3 border-r border-gray-300">Protocolo CNJ</th>
                <th className="px-5 py-3 border-r border-gray-300">Prazo</th>
                <th className="px-5 py-3">Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-200">
              {highRiskCases.length > 0 ? highRiskCases.map((c, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-extrabold uppercase border-r border-gray-200">{c.cliente}</td>
                  <td className="px-5 py-3 font-mono text-gray-500 border-r border-gray-200">{c.protocolo}</td>
                  <td className="px-5 py-3 border-r border-gray-200 font-bold">{c.proximoPrazo || '-'}</td>
                  <td className="px-5 py-3 font-black uppercase">
                    <span className={['Vencido', 'É Hoje', 'Caso Crítico'].includes(c.status) ? 'text-red-600' : 'text-orange-500'}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-5 py-10 text-center italic text-gray-400">Nenhum registro crítico identificado para o perfil atual.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. ANALYTICS: DISTRIBUIÇÃO POR TRIBUNAL */}
      <section className="mb-12 break-inside-avoid">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded-none border border-black"><Scale size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">3. Distribuição por Unidade Judiciária (Tribunais)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              {metrics.topTribunals.map(([name, count]) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span>{name}</span>
                    <span>{count} ({getPercent(count)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-none overflow-hidden border border-black/10">
                    <div className="h-full bg-black" style={{ width: `${getPercent(count)}%` }} />
                  </div>
                </div>
              ))}
           </div>
           <div className="bg-gray-50 p-6 border-2 border-dashed border-black/20 flex flex-col justify-center text-center space-y-2">
              <p className="text-[10px] font-black uppercase text-black/40 tracking-widest">Resumo Analítico do Perfil</p>
              <p className="text-xs font-black uppercase leading-relaxed">
                A operação de {userName} encontra-se distribuída em {metrics.topTribunals.length} órgãos, com maior concentração no tribunal {metrics.topTribunals[0]?.[0] || 'N/A'}.
              </p>
           </div>
        </div>
      </section>

      {/* 4. ANALYTICS: CARGA POR ADVOGADO */}
      <section className="mb-12 break-inside-avoid">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded-none border border-black"><Users size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">4. Carga Operacional por Advogado</h2>
        </div>
        <div className="border-2 border-black rounded-none overflow-hidden">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="uppercase font-extrabold text-gray-700">
                <th className="px-5 py-3 border-r border-gray-300">Profissional Responsável</th>
                <th className="px-5 py-3 text-center">Processos Ativos</th>
                <th className="px-5 py-3 text-right">Share (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-200">
              {metrics.topAttorneys.map(([name, count]) => (
                <tr key={name}>
                  <td className="px-5 py-3 font-extrabold uppercase border-r border-gray-200">{name}</td>
                  <td className="px-5 py-3 text-center font-bold">{count}</td>
                  <td className="px-5 py-3 text-right font-black">{getPercent(count)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. ANOTAÇÕES & EVIDÊNCIAS */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded-none border border-black"><MessageSquare size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">5. Anotações de Auditoria & Evidências</h2>
        </div>
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {notes.map((n, i) => (
              <div key={i} className="p-6 border-2 border-black rounded-none bg-gray-50/50 shadow-[4px_4px_0px_#000] break-inside-avoid">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-[12px] uppercase tracking-tight border-l-4 border-black pl-3">{n.title}</h3>
                  <span className="text-[9px] font-mono text-gray-400 font-bold">{n.updatedAt}</span>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap font-black uppercase">{n.content}</p>
                  </div>
                  {n.imageUrl && (
                    <div className="w-full md:w-64 h-48 relative rounded-none overflow-hidden border-2 border-black shadow-md bg-white shrink-0">
                      <img 
                        src={n.imageUrl} 
                        alt="Evidence" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-10 border-2 border-dashed border-black/20 rounded-none italic text-gray-400 font-bold uppercase text-[10px]">Sem anotações estratégicas vinculadas a este perfil.</p>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t-4 border-black text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-[10px] text-black font-black uppercase tracking-widest">
          <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
        </div>
        <div className="inline-block px-6 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_#000]">
           <p className="text-[10px] text-black font-black uppercase tracking-tighter">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
        </div>
      </footer>
    </div>
  );
}
