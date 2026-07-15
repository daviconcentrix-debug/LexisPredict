"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Repeat, Loader2, Zap, Shield, User, FileUp, CheckCircle2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generatePecaSubstabelecimentoPDFAction, extrairTextoDoPDFAction, extrairDadosProcuracaoAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { id: 'eraldo', nome: 'ERALDO FRANCISCO DA SILVA JUNIOR', oab: "327.677/SP", estadoCivil: "casado" },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', oab: "370.898/SP", estadoCivil: "casado" },
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', oab: "520.783/SP", estadoCivil: "casado" },
];

export default function PecaSubstabelecimento() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [advSubstabelecente, setAdvSubstabelecente] = useState("ERALDO FRANCISCO DA SILVA JUNIOR");
  const [advSubstabelecido, setAdvSubstabelecido] = useState("DIEGO GOMES DIAS");
  const [selectedState, setSelectedState] = useState('SP');

  const [clienteNome, setClienteNome] = useState("");
  const [tipoAcao, setTipoAcao] = useState("AÇÃO REVISIONAL DE CONTRATO BANCÁRIO");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [cidadeComarca, setCidadeComarca] = useState("São Paulo");

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await extrairTextoDoPDFAction(formData);
      if (res.success) {
        setInputText(res.text || '');
        toast({ title: "Documento Transcrevido" });
      }
    } catch (err) {
      toast({ title: "Falha na Leitura", variant: "destructive" });
    } finally {
      setFileLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, advSubstabelecido, selectedState);
      if (res.success) {
        setClienteNome(res.cliente.nome);
        if (res.processos && res.processos.length > 0) {
          setNumeroProcesso(res.processos[0].numero);
          setTipoAcao(res.processos[0].acao);
        }
        setStep(2);
        toast({ title: "Triagem Neural Concluída" });
      }
    } catch (e) {
      toast({ title: "Erro na IA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const sInfo = ADVOGADOS_BANCA.find(a => a.nome.includes(advSubstabelecente)) || ADVOGADOS_BANCA[0];
    const rInfo = ADVOGADOS_BANCA.find(a => a.nome.includes(advSubstabelecido)) || ADVOGADOS_BANCA[1];

    try {
      const res = await generatePecaSubstabelecimentoPDFAction({
        advogadoSubstabelecente: sInfo.nome,
        estadoCivilSubstabelecente: sInfo.estadoCivil,
        oabSubstabelecente: `OAB/${selectedState} sob o n.º ${sInfo.oab}`,
        oabSubstabelecenteCurta: `OAB/${selectedState} ${sInfo.oab}`,
        advogadoSubstabelecido: rInfo.nome,
        oabSubstabelecido: `OAB/${selectedState} sob o n.º ${rInfo.oab}`,
        oabSubstabelecidoCurta: `OAB/${selectedState} ${rInfo.oab}`,
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
            <h1 className="font-black text-xl uppercase tracking-tighter">Peça de Substabelecimento</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Sem Reserva</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                 <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">1. Triagem de Documento Antigo (PDF/Texto)</CardTitle></CardHeader>
                 <CardContent className="p-6 space-y-4">
                   <Textarea 
                     placeholder="COLE O TEXTO DA PROCURAÇÃO ANTIGA OU USE O UPLOAD ABAIXO..."
                     className="min-h-[250px] border-2 border-black font-black uppercase text-[11px] rounded-none"
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                   <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-black group transition-all">
                      {fileLoading ? <Loader2 className="animate-spin text-black" size={24} /> : <FileUp size={32} className="text-black/20 group-hover:text-white mb-2" />}
                      <p className="text-[9px] font-black uppercase text-black/40 group-hover:text-white">Carregar Procuração Original (PDF)</p>
                      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                   </div>
                   <Button onClick={handleExtract} disabled={loading || !inputText} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                     {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                     Iniciar Triagem Forense
                   </Button>
                 </CardContent>
               </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                 <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Transmissão</h2>
                 <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecente (Quem Sai)</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Nome</Label><Input value={advSubstabelecente} onChange={e => setAdvSubstabelecente(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecido (Quem Entra)</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Nome</Label><Input value={advSubstabelecido} onChange={e => setAdvSubstabelecido(e.target.value)} className="border-black rounded-none font-black uppercase h-10" /></div>
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
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Gerar Substabelecimento Profissional
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
