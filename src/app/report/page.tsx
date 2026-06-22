"use client";

import React, { useState, useEffect } from 'react';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, FileText, Activity, MessageSquare } from 'lucide-react';
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
        setCases(c);
        setNotes(n);
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
    .sort((a, b) => (a.diasFaltando || 0) - (b.diasFaltando || 0));

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-16 max-w-5xl mx-auto print:p-0">
      <div className="flex justify-between items-center mb-10 print:hidden">
        <Button variant="outline" asChild size="sm">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao CRM</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-primary text-white hover:bg-primary/90">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório Unificado
        </Button>
      </div>

      <header className="border-b-4 border-black pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter">Relatório Jurídico Consolidado</h1>
            <p className="text-sm font-medium mt-1">LexisPredict CRM Intelligence Engine</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase">Davi Alves</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Análise de Processos Jurídicos</p>
          </div>
        </div>
        <div className="flex justify-between items-end mt-6">
          <div className="flex gap-2">
            <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase">Documento Oficial</span>
            <span className="text-[10px] border border-black px-2 py-0.5 font-bold uppercase">Confidencial</span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} />
          <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest inline-block">1. Indicadores de Performance (Analytics)</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <StatBox label="Total de Processos" value={stats.total} />
          <StatBox label="Críticos / Vencidos" value={stats.vencido} color="text-red-600" />
          <StatBox label="Em Atenção" value={stats.atencao} color="text-amber-600" />
          <StatBox label="Ativos" value={stats.emAndamento} />
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} />
          <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest inline-block">2. Fila de Prioridade (Intelligence)</h2>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="uppercase font-bold">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Protocolo CNJ</th>
                <th className="px-4 py-3">Tribunal</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {criticalCases.length > 0 ? criticalCases.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-bold uppercase">{c.cliente}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{c.protocolo}</td>
                  <td className="px-4 py-3 font-medium">{c.tribunal}</td>
                  <td className="px-4 py-3">{c.proximoPrazo || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${c.status === 'Vencido' ? 'text-red-600' : 'text-amber-600'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic">Sem processos de alto risco registrados no banco de dados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12 break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} />
          <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest inline-block">3. Atualizações e Anotações (Keep)</h2>
        </div>
        {notes.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {notes.map((n, i) => (
              <div key={i} className="border border-gray-200 p-4 rounded-lg bg-gray-50 break-inside-avoid shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xs uppercase">{n.title}</h3>
                  <span className="text-[8px] font-mono text-gray-400">{n.updatedAt}</span>
                </div>
                <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-gray-200 rounded-lg text-center">
            <p className="text-xs text-gray-400 italic">Nenhuma anotação estratégica registrada para este período.</p>
          </div>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t border-gray-200 text-center">
        <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">Documento gerado automaticamente via LexisPredict AI CRM — Todos os direitos reservados</p>
        <p className="text-[8px] text-gray-300 mt-2 font-mono">HASH-ID: {crypto.randomUUID().split('-')[0].toUpperCase()}</p>
      </footer>
    </div>
  );
}

function StatBox({ label, value, color = "text-black" }: { label: string, value: number, color?: string }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col items-center justify-center">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
