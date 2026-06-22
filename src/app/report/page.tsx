
"use client";

import React, { useState, useEffect } from 'react';
import { fetchRepoCases, fetchRepoNotes } from '@/app/actions/case-actions';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
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
        <Button onClick={() => window.print()} className="bg-black text-white hover:bg-black/90">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

      <header className="border-b-4 border-black pb-6 mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tighter">Relatório Jurídico Consolidado</h1>
        <div className="flex justify-between items-end mt-4">
          <p className="text-sm font-medium">Responsável: Davi Alves (LexisPredict)</p>
          <p className="text-sm text-gray-500 font-mono">Data de Emissão: {new Date().toLocaleDateString()}</p>
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest mb-4 inline-block">1. Indicadores de Performance (Analytics)</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatBox label="Total de Processos" value={stats.total} />
          <StatBox label="Críticos / Vencidos" value={stats.vencido} color="text-red-600" />
          <StatBox label="Em Atenção" value={stats.atencao} color="text-amber-600" />
          <StatBox label="Ativos" value={stats.emAndamento} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest mb-4 inline-block">2. Fila de Prioridade (Intelligence)</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-bold">Cliente</th>
                <th className="px-4 py-3 font-bold">Protocolo CNJ</th>
                <th className="px-4 py-3 font-bold">Tribunal</th>
                <th className="px-4 py-3 font-bold">Prazo</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {criticalCases.length > 0 ? criticalCases.map((c, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-bold uppercase">{c.cliente}</td>
                  <td className="px-4 py-3 font-mono">{c.protocolo}</td>
                  <td className="px-4 py-3">{c.tribunal}</td>
                  <td className="px-4 py-3">{c.proximoPrazo}</td>
                  <td className="px-4 py-3 font-bold">{c.status}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Sem processos críticos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-widest mb-4 inline-block">3. Atualizações e Anotações</h2>
        {notes.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {notes.map((n, i) => (
              <div key={i} className="border border-gray-200 p-4 rounded-lg bg-gray-50 break-inside-avoid">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{n.updatedAt}</p>
                <h3 className="font-bold text-sm mb-2">{n.title}</h3>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Nenhuma anotação registrada no período.</p>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t border-gray-200 text-center text-[10px] text-gray-400 uppercase tracking-widest">
        Documento gerado automaticamente via LexisPredict CRM Intelligence Unit
      </footer>
    </div>
  );
}

function StatBox({ label, value, color = "text-black" }: { label: string, value: number, color?: string }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
