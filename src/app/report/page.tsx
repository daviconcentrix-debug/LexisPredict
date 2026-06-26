
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, ShieldCheck, Activity, FileText, MessageSquare, Copyright } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * MASTER UNIFIED REPORT ENGINE — LEXISPREDICT
 * Propriedade de: W1 Capital
 * FUNDADOR DAVI ALVES FIGUEREDO
 */

export default function UnifiedReport() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const userName = "Davi Alves Figueredo";
  const userRole = "Fundador & Gestor — W1 Capital";

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const [casesRes, notesRes] = await Promise.all([
          supabase.from("processos").select("dados"),
          supabase.from("notes").select("*").order("created_at", { ascending: false })
        ]);

        const parsedCases = (casesRes.data || []).map(item => item.dados as LegalCase);
        const parsedNotes = (notesRes.data || []).map(item => {
          let imageUrl;
          let displayContent = item.content || '';
          
          try {
            if (displayContent.startsWith('{')) {
              const parsed = JSON.parse(displayContent);
              displayContent = parsed.text;
              imageUrl = parsed.imageUrl;
            }
          } catch (e) {}

          return {
            id: item.id.toString(),
            title: item.title || 'Sem Título',
            content: displayContent,
            imageUrl: imageUrl,
            updatedAt: new Date(item.created_at).toLocaleDateString('pt-BR')
          } as CaseNote;
        });

        setCases(parsedCases);
        setNotes(parsedNotes);
      } catch (e) {
        console.error("Report extraction failure:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="p-8 text-center font-mono text-black bg-white min-h-screen flex flex-col items-center justify-center space-y-4">
        <Activity className="animate-spin text-blue-600" size={32} />
        <p className="font-bold uppercase tracking-widest text-[10px] italic">Compilando Inteligência Unificada (W1 Capital)...</p>
      </div>
    );
  }

  const stats = {
    total: cases.length,
    vencido: cases.filter(c => c.status === 'Vencido').length,
    atencao: cases.filter(c => c.status === 'Atenção').length,
    noPrazo: cases.filter(c => c.status === 'No Prazo').length,
  };

  const highRiskCases = cases
    .filter(c => c.status === 'Vencido' || c.status === 'Atenção')
    .slice(0, 50);

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-12 max-w-5xl mx-auto print:p-0">
      
      <div className="flex justify-between items-center mb-10 print:hidden">
        <Button variant="outline" asChild size="sm" className="border-gray-300 text-gray-600">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao CRM</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-blue-600 text-white font-bold px-8 shadow-lg hover:bg-blue-700">
          <Printer className="mr-2 h-4 w-4" /> Gerar PDF Oficial
        </Button>
      </div>

      <header className="border-b-4 border-black pb-8 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter leading-none">Relatório Jurídico Consolidado</h1>
            <p className="text-sm font-bold text-gray-700 mt-2 uppercase tracking-wide italic">W1 Capital — FUNDADOR DAVI ALVES FIGUEREDO</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase">{userName}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userRole}</p>
          </div>
        </div>
        <div className="flex justify-between items-end mt-10">
          <div className="flex gap-2">
            <span className="text-[10px] bg-black text-white px-3 py-1 font-bold uppercase">Ofício Executivo</span>
            <span className="text-[10px] border-2 border-black px-3 py-1 font-bold uppercase flex items-center gap-1.5">
              <ShieldCheck size={10} /> Documento Auditado
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">Extraído em: {new Date().toLocaleDateString('pt-BR')} — {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded"><Activity size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">1. Indicadores de Performance</h2>
        </div>
        <div className="grid grid-cols-4 gap-6 text-center">
          <div className="p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl">
            <p className="text-[9px] font-black text-gray-400 uppercase">Total</p>
            <p className="text-3xl font-black">{stats.total}</p>
          </div>
          <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl">
            <p className="text-[9px] font-black text-red-400 uppercase">Vencidos</p>
            <p className="text-3xl font-black text-red-600">{stats.vencido}</p>
          </div>
          <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-2xl">
            <p className="text-[9px] font-black text-amber-400 uppercase">Atenção</p>
            <p className="text-3xl font-black text-amber-600">{stats.atencao}</p>
          </div>
          <div className="p-5 bg-green-50 border-2 border-green-100 rounded-2xl">
            <p className="text-[9px] font-black text-green-400 uppercase">Saudáveis</p>
            <p className="text-3xl font-black text-green-600">{stats.noPrazo}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded"><FileText size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">2. Intelligence Unit — Casos Críticos</h2>
        </div>
        <div className="border-2 border-black rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-gray-100 border-b-2 border-black">
              <tr className="uppercase font-extrabold text-gray-700">
                <th className="px-5 py-3 border-r border-gray-300">Cliente</th>
                <th className="px-5 py-3 border-r border-gray-300">Protocolo CNJ</th>
                <th className="px-5 py-3 border-r border-gray-300">Próximo Prazo</th>
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
                    <span className={c.status === 'Vencido' ? 'text-red-600' : 'text-amber-600'}>{c.status}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-5 py-10 text-center italic text-gray-400">Sem registros críticos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12 break-inside-avoid">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 bg-black text-white rounded"><MessageSquare size={18} /></div>
          <h2 className="text-lg font-extrabold uppercase tracking-tight">3. Anotações Estratégicas & Evidências</h2>
        </div>
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {notes.map((n, i) => (
              <div key={i} className="p-6 border-2 border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm break-inside-avoid">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-[12px] uppercase tracking-tight border-l-4 border-black pl-3">{n.title}</h3>
                  <span className="text-[9px] font-mono text-gray-400 font-bold">{n.updatedAt}</span>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                  {n.imageUrl && (
                    <div className="w-full md:w-64 h-48 relative rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                      <Image 
                        src={n.imageUrl} 
                        alt="Evidence" 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-10 border-2 border-dashed rounded-2xl italic text-gray-400 font-bold">Sem anotações.</p>
        )}
      </section>

      <footer className="mt-20 pt-8 border-t text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-[10px] text-black font-black uppercase tracking-widest">
          <Copyright size={10} /> 2026 W1 Capital. Todos os direitos reservados.
        </div>
        <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</p>
      </footer>
    </div>
  );
}
