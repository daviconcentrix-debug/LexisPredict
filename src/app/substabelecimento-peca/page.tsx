"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import ReactPDF, { renderToBuffer } from '@react-pdf/renderer';
import { Repeat, Loader2, Zap, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generatePecaSubstabelecimentoPDFAction } from '@/app/actions/document-actions';

export default function PecaSubstabelecimento() {
  const [loading, setLoading] = useState(false);
  const [advogadoSubstabelecente, setAdvogadoSubstabelecente] = useState("DR. ERALDO FRANCISCO DA SILVA JUNIOR");
  const [estadoCivilSubstabelecente, setEstadoCivilSubstabelecente] = useState("casado");
  const [oabSubstabelecente, setOabSubstabelecente] = useState("OAB/SP sob o n.º 327.677");
  const [oabSubstabelecenteCurta, setOabSubstabelecenteCurta] = useState("OAB/SP 327.677");

  const [advogadoSubstabelecido, setAdvogadoSubstabelecido] = useState("DR. DIEGO GOMES DIAS");
  const [oabSubstabelecido, setOabSubstabelecido] = useState("OAB/SP sob o n.º 370.898");
  const [oabSubstabelecidoCurta, setOabSubstabelecidoCurta] = useState("OAB/SP 370.898");

  const [clienteNome, setClienteNome] = useState("JOSIVAN NUNES PEREIRA");
  const [tipoAcao, setTipoAcao] = useState("AÇÃO REVISIONAL DE CONTRATO BANCÁRIO");
  const [numeroProcesso, setNumeroProcesso] = useState("0001655-43.2025.8.27.2737");
  const [cidadeComarca, setCidadeComarca] = useState("São Paulo");

  const { toast } = useToast();
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generatePecaSubstabelecimentoPDFAction({
        advogadoSubstabelecente, estadoCivilSubstabelecente, oabSubstabelecente, oabSubstabelecenteCurta,
        advogadoSubstabelecido, oabSubstabelecido, oabSubstabelecidoCurta,
        clienteNome, tipoAcao, numeroProcesso, cidadeComarca, dataFormatada
      });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Substabelecimento_${clienteNome}.pdf`;
        link.click();
        toast({ title: "Substabelecimento Selado" });
      }
    } catch (e) {
      toast({ title: "Erro na geração", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Repeat size={20} />
            <h1 className="font-black text-xl uppercase">Peça de Substabelecimento</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
              <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecente (Quem Sai)</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Nome</Label><Input value={advogadoSubstabelecente} onChange={e => setAdvogadoSubstabelecente(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] font-black uppercase">OAB Completa</Label><Input value={oabSubstabelecente} onChange={e => setOabSubstabelecente(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
              </CardContent>
            </Card>
            <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
              <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecido (Quem Entra)</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Nome</Label><Input value={advogadoSubstabelecido} onChange={e => setAdvogadoSubstabelecido(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
                <div className="space-y-1"><Label className="text-[9px] font-black uppercase">OAB Completa</Label><Input value={oabSubstabelecido} onChange={e => setOabSubstabelecido(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
            <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Contexto do Processo</CardTitle></CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Cliente</Label><Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
              <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Processo</Label><Input value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)} className="border-black rounded-none font-black h-10" /></div>
            </CardContent>
          </Card>

          <Button onClick={handleGenerate} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
            Gerar Substabelecimento Profissional
          </Button>
        </div>
      </main>
    </div>
  );
}
