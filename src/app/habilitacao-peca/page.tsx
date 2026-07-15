"use client";
/*
@copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
@license Proprietary - All rights reserved. See LICENSE file. */

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  FileText, 
  Zap, 
  Loader2, 
  Edit3, 
  Upload,
  FileUp,
  Shield,
  CheckCircle2,
  Building2,
  AlertCircle,
  MapPin,
  CalendarDays,
  User,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateHabilitacaoPecaPDFAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "SC", "ES", "MS", "MG", "PR"] },
  { id: 'ingrid', nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', estados: ["BA", "CE", "MT", "PI", "RN", "SP"] },
  { id: 'lucas', nome: 'LUCAS DOS SANTOS DE JESUS', estados: ["DF", "AL", "AM", "PE", "RJ", "SP"] },
  { id: 'leticia', nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
];

export default function HabilitacaoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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
      } else {
        toast({ title: "Falha na Leitura", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Conexão", variant: "destructive" });
    } finally {
      setFileLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText || inputText.length < 50) {
      toast({ title: "Dados Insuficientes", variant: "destructive" });
      return;
    }
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
      if (res.success) {
        const data = res as any;
        setExtractedData({
          vara: "02ª VARA CÍVEL",
          comarca: `${data.processos?.[0]?.estado || selectedState} - ${data.processos?.[0]?.estado || selectedState}`,
          numeroProcesso: data.processos?.[0]?.numero || "",
          cliente: {
            ...data.cliente,
            nacionalidade: "brasileiro(a)",
            email: data.cliente.email || ""
          },
          advogado: {
            ...data.advogado,
            cep: "03870-100"
          },
          tipoAcao: data.processos?.[0]?.acao || "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
          reuNome: data.processos?.[0]?.banco || "INSTITUIÇÃO FINANCEIRA",
          reuCnpj: data.processos?.[0]?.cnpjBanco || "",
          cidadeEmissao: "São Paulo"
        });
        setStep(2);
        toast({ title: "Triagem Neural Concluída" });
      } else {
        setApiError(res.error || "Falha na triagem neural.");
      }
    } catch (err) {
      setApiError("Erro crítico de comunicação.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    setLoading(true);
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      const res = await generateHabilitacaoPecaPDFAction({
        ...extractedData,
        dataFormatada
      });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Habilitacao_${extractedData.cliente.nome}.pdf`;
        link.click();
        toast({ title: "Habilitação Selada" });
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
            <Shield size={20} />
            <h1 className="font-black text-xl uppercase tracking-tighter">Habilitação + Procuração Elite</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Step {step} of 2</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {apiError && (
                <Alert variant="destructive" className="border-2 border-red-600 rounded-none shadow-[8px_8px_0px_#000]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-black uppercase text-xs">Erro de Triagem</AlertTitle>
                  <AlertDescription className="text-[10px] font-bold uppercase">{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">1. Configuração de Gabinete</CardTitle></CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                        <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                          <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue placeholder="SELECIONE..." /></SelectTrigger>
                          <SelectContent className="bg-white border-2 border-black rounded-none">
                            {ADVOGADOS_BANCA.map(a => <SelectItem key={a.id} value={a.nome} className="font-black uppercase text-[10px]">{a.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue placeholder="UF..." /></SelectTrigger>
                          <SelectContent className="bg-white border-2 border-black rounded-none">
                            {["SP", "RJ", "MG", "PR", "BA", "CE", "RN", "PE", "PA", "MA", "SC", "ES", "MS", "RS", "MT", "GO", "DF", "TO", "AL", "AM", "RO", "AP", "RR", "SE", "PI", "AC"].map(uf => <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black">2. Texto do Contrato / Procuração</Label>
                      <Textarea 
                        placeholder="COLE O TEXTO DO CONTRATO OU USE O UPLOAD ABAIXO..."
                        className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                        Extrair & Iniciar Gabinete
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3"><CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Leitura PDF</CardTitle></CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste o PDF aqui</p>
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
                 <h2 className="text-xl font-black uppercase tracking-tight">Revisão Forense Combinada</h2>
                 <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Dados do Juízo</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Vara (Ex: 02ª VARA CÍVEL)</Label>
                      <Input value={extractedData.vara} onChange={e => setExtractedData({...extractedData, vara: e.target.value})} className="border-black rounded-none font-black uppercase" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Comarca (Ex: SÃO PAULO - SP)</Label>
                      <Input value={extractedData.comarca} onChange={e => setExtractedData({...extractedData, comarca: e.target.value})} className="border-black rounded-none font-black uppercase" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Número do Processo</Label>
                      <Input value={extractedData.numeroProcesso} onChange={e => setExtractedData({...extractedData, numeroProcesso: e.target.value})} className="border-black rounded-none font-black" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] uppercase font-black">Dados do Outorgante (Cliente)</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Nome Completo</Label>
                      <Input value={extractedData.cliente.nome} onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})} className="border-black rounded-none font-black uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">CPF</Label>
                         <Input value={extractedData.cliente.cpf} onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, cpf: e.target.value}})} className="border-black rounded-none font-black" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">RG</Label>
                         <Input value={extractedData.cliente.rg} onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, rg: e.target.value}})} className="border-black rounded-none font-black" />
                       </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Endereço Residencial</Label>
                      <Input value={extractedData.cliente.endereco} onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, endereco: e.target.value}})} className="border-black rounded-none font-black uppercase" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3"><CardTitle className="text-[10px] uppercase font-black">Contexto da Ação</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Título da Ação</Label>
                         <Input value={extractedData.tipoAcao} onChange={e => setExtractedData({...extractedData, tipoAcao: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Nome do Requerido (Réu)</Label>
                         <Input value={extractedData.reuNome} onChange={e => setExtractedData({...extractedData, reuNome: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">CNPJ do Requerido</Label>
                         <Input value={extractedData.reuCnpj} onChange={e => setExtractedData({...extractedData, reuCnpj: e.target.value})} className="border-black rounded-none font-black" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Cidade de Emissão</Label>
                         <Input value={extractedData.cidadeEmissao} onChange={e => setExtractedData({...extractedData, cidadeEmissao: e.target.value})} className="border-black rounded-none font-black uppercase" />
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Selar & Exportar Habilitação Completa
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
