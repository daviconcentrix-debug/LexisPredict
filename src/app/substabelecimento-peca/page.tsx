"use client";
/*
@copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
@license Proprietary - All rights reserved. See LICENSE file. */

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Repeat, 
  Loader2, 
  Zap, 
  Shield, 
  User, 
  FileUp, 
  CheckCircle2, 
  Edit3,
  Upload,
  Building2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePecaSubstabelecimentoPDFAction, extrairTextoDoPDFAction, extrairDadosProcuracaoAction } from '@/app/actions/document-actions';

export default function PecaSubstabelecimento() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedState, setSelectedState] = useState('SP');
  const [extractedData, setExtractedData] = useState<any>(null);

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
    if (!inputText) {
      toast({ title: "Insira o texto para triagem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
      if (res.success) {
        const data = res as any;
        setExtractedData({
          advogadoSubstabelecente: "ERALDO FRANCISCO DA SILVA JUNIOR",
          estadoCivilSubstabelecente: "casado",
          oabSubstabelecente: `OAB/${selectedState} sob o n.º 327.677`,
          oabSubstabelecenteCurta: `OAB/${selectedState} 327.677`,
          advogadoSubstabelecido: data.advogado.nome || "DIEGO GOMES DIAS",
          oabSubstabelecido: `OAB/${selectedState} sob o n.º ${data.advogado.oab || '370.898'}`,
          oabSubstabelecidoCurta: `OAB/${selectedState} ${data.advogado.oab || '370.898'}`,
          clienteNome: data.cliente.nome || "NOME DO CLIENTE",
          tipoAcao: data.processos?.[0]?.acao || "AÇÃO REVISIONAL DE CONTRATO BANCÁRIO",
          numeroProcesso: data.processos?.[0]?.numero || "",
          cidadeComarca: "São Paulo"
        });
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
    try {
      const res = await generatePecaSubstabelecimentoPDFAction({
        ...extractedData,
        dataFormatada
      });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Substabelecimento_${extractedData.clienteNome}.pdf`;
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
            <h1 className="font-black text-xl uppercase tracking-tighter">Substabelecimento Elite</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Step {step} of 2</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                   <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                     <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">1. Configuração de Transmissão</CardTitle></CardHeader>
                     <CardContent className="p-6 grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label className="uppercase text-[10px] font-black">Estado da OAB</Label>
                         <Select value={selectedState} onValueChange={setSelectedState}>
                           <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue placeholder="UF..." /></SelectTrigger>
                           <SelectContent className="bg-white border-2 border-black rounded-none">
                             {["SP", "RJ", "MG", "PR", "BA", "CE", "RN", "PE", "PA", "MA", "SC", "ES", "MS", "RS", "MT", "GO", "DF", "TO"].map(uf => <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                     <CardContent className="p-6 space-y-4">
                       <Label className="uppercase text-[10px] font-black">2. Documento Origem (Texto/PDF)</Label>
                       <Textarea 
                         placeholder="COLE A PROCURAÇÃO ANTIGA OU CONTRATO..."
                         className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none"
                         value={inputText}
                         onChange={(e) => setInputText(e.target.value)}
                       />
                       <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                         {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                         Extrair Contexto Jurídico
                       </Button>
                     </CardContent>
                   </Card>
                 </div>

                 <div className="space-y-6">
                   <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                     <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3"><CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Importar PDF</CardTitle></CardHeader>
                     <CardContent className="p-6">
                       <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-black group transition-all">
                          {fileLoading ? <Loader2 className="animate-spin text-black" size={24} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                          <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste a Procuração Original</p>
                          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </div>
            </div>
          )}

          {step === 2 && extractedData && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                 <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Transmissão Forense</h2>
                 <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecente (Cedente)</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Nome Completo</Label>
                      <Input value={extractedData.advogadoSubstabelecente} onChange={e => setExtractedData({...extractedData, advogadoSubstabelecente: e.target.value})} className="border-black rounded-none font-black uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Estado Civil</Label>
                         <Input value={extractedData.estadoCivilSubstabelecente} onChange={e => setExtractedData({...extractedData, estadoCivilSubstabelecente: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">OAB Curta</Label>
                         <Input value={extractedData.oabSubstabelecenteCurta} onChange={e => setExtractedData({...extractedData, oabSubstabelecenteCurta: e.target.value})} className="border-black rounded-none font-black" />
                       </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">OAB Completa (Ex: OAB/SP sob o n.º...)</Label>
                      <Input value={extractedData.oabSubstabelecente} onChange={e => setExtractedData({...extractedData, oabSubstabelecente: e.target.value})} className="border-black rounded-none font-black" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Substabelecido (Cessionário)</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Nome Completo</Label>
                      <Input value={extractedData.advogadoSubstabelecido} onChange={e => setExtractedData({...extractedData, advogadoSubstabelecido: e.target.value})} className="border-black rounded-none font-black uppercase" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">OAB Curta</Label>
                      <Input value={extractedData.oabSubstabelecidoCurta} onChange={e => setExtractedData({...extractedData, oabSubstabelecidoCurta: e.target.value})} className="border-black rounded-none font-black" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">OAB Completa</Label>
                      <Input value={extractedData.oabSubstabelecido} onChange={e => setExtractedData({...extractedData, oabSubstabelecido: e.target.value})} className="border-black rounded-none font-black" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3"><CardTitle className="text-[10px] uppercase font-black">Contexto do Processo</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Cliente Outorgante</Label>
                         <Input value={extractedData.clienteNome} onChange={e => setExtractedData({...extractedData, clienteNome: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Número do Processo (CNJ)</Label>
                         <Input value={extractedData.numeroProcesso} onChange={e => setExtractedData({...extractedData, numeroProcesso: e.target.value})} className="border-black rounded-none font-black font-mono" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Tipo de Ação</Label>
                         <Input value={extractedData.tipoAcao} onChange={e => setExtractedData({...extractedData, tipoAcao: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Cidade / Comarca</Label>
                         <Input value={extractedData.cidadeComarca} onChange={e => setExtractedData({...extractedData, cidadeComarca: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 flex gap-3 items-start">
                <Info size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-yellow-900">Nota de Compliance:</p>
                  <p className="text-[8px] font-bold text-yellow-700 uppercase leading-tight">
                    O substabelecimento será gerado <b>SEM RESERVA DE PODERES</b>, conforme o Art. 272, §5º do CPC.
                  </p>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Selar & Exportar Substabelecimento Profissional
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
