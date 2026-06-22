
"use client";

import React, { useState, useEffect } from 'react';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Activity, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const [c, n] = await Promise.all([fetchRepoCases(), fetchRepoNotes()]);
        if (Array.isArray(c)) setCases(c);
        if (Array.isArray(n)) setNotes(n);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!mounted) return null;

  const stats = {
    total: cases.length,
    vencido: cases.filter(c => c.status === 'Vencido').length,
    atencao: cases.filter(c => c.status === 'Atenção').length,
    emAndamento: cases.filter(c => c.situacao === 'EM ANDAMENTO').length
  };

  const criticalCases = cases
    .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
    .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-12 max-w-5xl mx-auto print:p-0">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center mb-10 print:hidden">
        <Button variant="outline" asChild size="sm" className="border-gray-200 text-gray-600">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao CRM</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-primary text-white hover:bg-primary/90 font-bold">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório Unificado
        </Button>
      </div>

      {/* HEADER */}
      <header className="border-b-4 border-black pb-6 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter leading-tight">Relatório Jurídico Consolidado</h1>
            <p className="text-sm font-bold text-gray-700 mt-1 uppercase">LexisPredict CRM Intelligence Unit</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold uppercase">Davi Alves</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Análise de Processos Jurídicos</p>
          </div>
        </div>
        <div className="flex justify-between items-end mt-8">
          <div className="flex gap-2">
            <span className="text-[10px] bg-black text-white px-3 py-1 font-bold uppercase">Documento Oficial</span>
            <span className="text-[10px] border-2 border-black px-3 py-1 font-bold uppercase">Confidencial</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono font-bold">
            Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </header>

      {/* SECTION 1: INDICATORS */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded">
            <Activity size={18} />
          </div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">1. Indicadores de Performance</h2>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <StatBox label="Total de Processos" value={stats.total} />
          <StatBox label="Críticos / Vencidos" value={stats.vencido} color="text-red-600" />
          <StatBox label="Em Atenção" value={stats.atencao} color="text-amber-600" />
          <StatBox label="Ativos" value={stats.emAndamento} />
        </div>
      </section>

      {/* SECTION 2: PRIORITY QUEUE */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded">
            <FileText size={18} />
          </div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">2. Fila de Prioridade (Intelligence)</h2>
        </div>
        <div className="border-2 border-black rounded-xl overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="uppercase font-extrabold">
                <th className="px-5 py-3 border-r border-gray-300">Cliente</th>
                <th className="px-5 py-3 border-r border-gray-300">Protocolo CNJ</th>
                <th className="px-5 py-3 border-r border-gray-300">Próximo Prazo</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-200">
              {criticalCases.length > 0 ? criticalCases.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-extrabold uppercase border-r border-gray-200">{c.cliente}</td>
                  <td className="px-5 py-3 font-mono text-gray-600 border-r border-gray-200">{c.protocolo}</td>
                  <td className="px-5 py-3 font-bold border-r border-gray-200">{c.proximoPrazo || 'N/A'}</td>
                  <td className="px-5 py-3 font-extrabold">
                    <span className={c.status === 'Vencido' ? 'text-red-600' : 'text-amber-600'}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-gray-400 italic font-medium">
                    Sem processos de alto risco registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: NOTES */}
      <section className="mb-12 break-inside-avoid">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded">
            <MessageSquare size={18} />
          </div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">3. Atualizações e Anotações (Keep Board)</h2>
        </div>
        {notes.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {notes.map((n, i) => (
              <div key={i} className="border-2 border-gray-200 p-5 rounded-xl bg-gray-50/50 break-inside-avoid shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-tight">{n.title}</h3>
                  <span className="text-[8px] font-mono text-gray-400 font-bold">{n.updatedAt}</span>
                </div>
                <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-xs text-gray-400 italic font-medium">Nenhuma anotação estratégica registrada.</p>
          </div>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t-2 border-gray-100 text-center">
        <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] font-bold">
          Gerado via LexisPredict AI CRM — Documento Confidencial
        </p>
      </footer>
    </div>
  );
}

function StatBox({ label, value, color = "text-black" }: { label: string, value: number | string, color?: string }) {
  return (
    <div className="p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-tighter mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${color} leading-none`}>{value}</p>
    </div>
  );
}
