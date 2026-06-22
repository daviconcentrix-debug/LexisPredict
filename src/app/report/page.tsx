import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function UnifiedReportPage() {
  // Busca os Processos e as Notas ao mesmo tempo (Paralelismo de alta performance)
  const [processosRes, notasRes] = await Promise.all([
    supabase.from("processos").select("dados"),
    supabase.from("notes").select("*").order("created_at", { ascending: false })
  ]);

  const processos = (processosRes.data || []).map(item => item.dados);
  const notas = notasRes.data || [];

  // Cálculos consolidados para o Analytics Hub
  const total = processos.length;
  const noPrazo = processos.filter(p => p.risco?.includes("NO PRAZO")).length;
  const atencao = processos.filter(p => p.risco?.includes("ATENÇÃO")).length;
  const critico = processos.filter(p => p.risco?.includes("CRÍTICO")).length;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black min-h-screen print:p-0">
      
      {/* BARRA DE COMANDOS (Oculta na hora que vira PDF) */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link href="/" className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
          ← Voltar ao CRM
        </Link>
        <button 
          // O pulo do gato: aciona a impressão do navegador ao clicar
          onClick={() => window.print()} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded shadow"
        >
          🖨️ Salvar PDF Oficial
        </button>
      </div>

      {/* CABEÇALHO DO DOCUMENTO */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">RELATÓRIO JURÍDICO EXECUTIVO — CONSOLIDADO</h1>
        <p className="text-xs text-gray-500 mt-1">
          Gerado por: Davi Alves (Análise de Processos) • Data: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* SESSÃO 1: ANALYTICS HUB */}
      <div className="mb-8">
        <h2 className="text-sm font-bold bg-black text-white p-1 px-2 uppercase tracking-wider mb-4">
          1. Analytics Hub (Distribuição de Risco)
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 border rounded"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{total}</p></div>
          <div className="p-3 bg-green-50 border border-green-200 rounded"><p className="text-xs text-green-700">No Prazo</p><p className="text-xl font-bold text-green-700">{noPrazo}</p></div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded"><p className="text-xs text-yellow-700">Atenção</p><p className="text-xl font-bold text-yellow-700">{atencao}</p></div>
          <div className="p-3 bg-red-50 border border-red-200 rounded"><p className="text-xs text-red-700">Crítico</p><p className="text-xl font-bold text-red-700">{critico}</p></div>
        </div>
      </div>

      {/* SESSÃO 2: INTELLIGENCE UNIT (Fila de Prioridade) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold bg-black text-white p-1 px-2 uppercase tracking-wider mb-4">
          2. Intelligence Unit (Fila de Casos Prioritários)
        </h2>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-400 font-bold">
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Protocolo</th>
              <th className="pb-2">Próx. Prazo</th>
              <th className="pb-2">Status / Risco</th>
            </tr>
          </thead>
          <tbody>
            {processos
              .filter(p => p.risco?.includes("CRÍTICO") || p.risco?.includes("ATENÇÃO"))
              .slice(0, 15) // Limita aos 15 piores para o PDF não ter 30 páginas
              .map((p, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 font-semibold">{p.cliente}</td>
                  <td className="py-2 text-gray-500">{p.protocolo}</td>
                  <td className="py-2">{p.proximo_prazo || p.proximoPrazo || "-"}</td>
                  <td className="py-2">{p.risco}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* SESSÃO 3: GOOGLE KEEP / ANOTAÇÕES */}
      <div className="mb-8">
        <h2 className="text-sm font-bold bg-black text-white p-1 px-2 uppercase tracking-wider mb-4">
          3. Quadro de Atualizações & Anotações
        </h2>
        {notas.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhuma anotação ativa.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {notas.map((n) => (
              <div key={n.id} className="p-3 border border-gray-300 rounded bg-amber-50/40 break-inside-avoid">
                <span className="text-[10px] text-gray-400 font-mono block mb-1">
                  {new Date(n.created_at).toLocaleDateString('pt-BR')}
                </span>
                <h3 className="font-bold text-xs mb-1">{n.title}</h3>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-gray-400 mt-12 pt-4 border-t">
        LexisPredict AI • Documento de uso restrito Davi Alves
      </div>

    </div>
  );
}
