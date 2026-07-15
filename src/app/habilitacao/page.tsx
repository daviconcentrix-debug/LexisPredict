'use client';

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import {
  FileText,
  Loader2,
  Upload,
  FileUp,
  CheckCircle2,
  User,
  Eye,
  Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extrairTextoDoPDFAction } from '@/app/actions/document-actions';

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": { oabs: { "SP": "370.898/SP" } },
  "LETICIA ALVES GODOY DA CRUZ": { oabs: { "SP": "490.641/SP" } },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": { oabs: { "SP": "520783/SP" } },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": { oabs: { "SP": "490.641/SP" } },
  "LUCAS DOS SANTOS DE JESUS": { oabs: { "SP": "520783/SP" } },
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function HabilitacaoProcuracaoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedAdvogado, setSelectedAdvogado] = useState('');
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
        toast({ title: "PDF Transcrito", description: "Texto pronto para triagem." });
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
      toast({ title: "Dados Insuficientes", description: "Cole o texto ou envie um PDF.", variant: "destructive" });
      return;
    }
    if (!selectedAdvogado) {
      toast({ title: "Selecione o Advogado", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Simulação de extração (substitua pela sua action real depois)
    setTimeout(() => {
      const advogadoInfo = BANCA_DATA[selectedAdvogado];

      const mockData = {
        cliente: {
          nome: "EBERT RONALD LEME",
          cpf: "300.483.608-48",
          rg: "26130466",
          endereco: "Rua Maranhão, 489, Casa 13, Jardim Bela Vista, Jaguariúna - SP"
        },
        processo: {
          numero: "1003224-40.2025.8.26.0296",
          acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
          reu: "BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A."
        },
        advogado: {
          nome: selectedAdvogado,
          oab: advogadoInfo.oabs[selectedState] || advogadoInfo.oabs['SP']
        },
        vara: "02ª VARA CÍVEL",
        comarca: "JAGUARIUNA - SP",
        data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      };

      setExtractedData(mockData);
      setStep(2);
      setLoading(false);
      toast({ title: "Triagem Concluída" });
    }, 1200);
  };

  const handleGeneratePDF = () => {
    alert("Função de geração do PDF ainda não implementada. Vamos criar na próxima etapa.");
    // Aqui você vai chamar uma action para gerar o PDF (igual ao Substabelecimento)
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <FileText size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Habilitação + Procuração</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Peça Combinada</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* 1. Gabinete Técnico */}
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">1. Gabinete Técnico</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                          <Select value={selectedAdvogado} onValueChange={setSelectedAdvogado}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none">
                              <SelectValue placeholder="SELECIONE..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {ADVOGADOS_LIST.map((name) => (
                                <SelectItem key={name} value={name} className="font-black uppercase text-[10px]">{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Estado da OAB</Label>
                          <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {["SP", "MG", "RJ", "PR", "BA", "CE", "RS", "SC"].map((uf) => (
                                <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 2. Dados do Processo */}
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black">2. Contrato / Petição Antiga (PDF ou Texto)</Label>
                      <Textarea
                        placeholder="COLE O TEXTO DO CONTRATO OU PETIÇÃO ANTIGA..."
                        className="min-h-[220px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Repeat size={16} className="mr-2" />}
                        Iniciar Triagem Neural
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Upload PDF */}
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Importar PDF</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ?
