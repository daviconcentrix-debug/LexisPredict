
"use client";

import React, { useState, useRef, useMemo } from 'react';
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
  Repeat,
  Info,
  ChevronRight
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
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateSubstabelecimentoPDFAction } from '@/app/actions/document-actions';

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510/BA", "CE": "52996-A/CE", "MT": "34044-A/MT", "PI": "22858/PI", "RN": "21766A/RN", "SP": "370.898/SP" },
    estadoCivil: "casado"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A/TO", "AC": "6572/AC", "RS": "131831A/RS", "PB": "31888 A/PB", "PA": "36417-A/PA", "SP": "490.641/SP" },
    estadoCivil: "casada"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783/SP", "MG": "249550/MG", "PR": "520783/PR" },
    estadoCivil: "casado"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641/SP", "RO": "13.438/RO", "AP": "5.819-A/AP", "SE": "1.601A/SE", "RR": "844-A/RR", "GO": "70699/GO", "SP": "490.641/SP" },
    estadoCivil: "casada"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116/DF", "AL": "21512A/AL", "AM": "A2373/AM", "PE": "66465/PE", "RJ": "261767/RJ", "SP": "520783/SP" },
    estadoCivil: "solteiro"
  },
  "ERALDO FRANCISCO DA SILVA JUNIOR": {
    oabs: { "SP": "327.677/SP" },
    estadoCivil: "casado"
  }
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function SubstabelecimentoGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Estados para os Advogados
  const [advLeaving, setAdvLeaving] = useState('');
  const [advEntering, setAdvEntering] = useState('');
  const [selectedState, setSelectedState] = useState('SP');

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
        toast({ title: "Contrato Transcrevido", description: "Texto pronto para triagem." });
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
      toast({ title: "Dados Insuficientes", description: "Insira o texto para triagem.", variant: "destructive" });
      return;
    }
    if (!advLeaving || !advEntering) {
      toast({ title: "Configuração Pendente", description: "Selecione ambos os advogados.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, advEntering, selectedState);
      if (res.success) {
        const leavingInfo = BANCA_DATA[advLeaving];
        const enteringInfo = BANCA_DATA[advEntering];
        
        const finalData = {
          cliente: res.cliente,
          processo: res.processos[0],
          substabelecente: {
            nome: advLeaving,
            estadoCivil: leavingInfo.estadoCivil,
            oabCompleta: `OAB/${selectedState} sob o n.º ${leavingInfo.oabs[selectedState] || leavingInfo.oabs['SP']}`,
            oabCurta: `OAB/${selectedState} ${leavingInfo.oabs[selectedState] || leavingInfo.oabs['SP']}`
          },
          substabelecido: {
            nome: advEntering,
            oabCompleta: `OAB/${selectedState} sob o n.º ${enteringInfo.oabs[selectedState] || enteringInfo.oabs['SP']}`,
            oabCurta: `OAB/${selectedState} ${enteringInfo.oabs[selectedState] || enteringInfo.oabs['SP']}`
          },
          comarca: selectedState === 'SP' ? 'São Paulo' : 'Comarca Local',
          dataExtenso: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        };
        
        setExtractedData(finalData);
        setStep(2);
        toast({ title: "Triagem Concluída" });
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
    try {
      const res = await generateSubstabelecimentoPDFAction(extractedData);
      if (res.success && res.base64) {
        const byteCharacters = atob(res.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Substabelecimento_${extractedData.cliente.nome}.pdf`;
        link.click();
        toast({ title: "Documento Selado" });
      } else {
        toast({ title: "Erro ao gerar PDF", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro na Selagem", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <Repeat size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Gerador de Substabelecimentos</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Sem Reserva</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">1. Configuração de Gabinete</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado Substabelecente (Quem Sai)</Label>
                          <Select value={advLeaving} onValueChange={setAdvLeaving}>
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
                          <Label className="uppercase text-[10px] font-black">Advogado Substabelecido (Quem Entra)</Label>
                          <Select value={advEntering} onValueChange={setAdvEntering}>
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
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black">Estado da Comarca / OAB</Label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none">
                            <SelectValue placeholder="SP" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-black rounded-none">
                            {["SP", "RJ", "MG", "PR", "SC", "RS", "BA", "CE", "MT", "GO", "DF", "TO", "RN", "PE", "PA", "AM", "AC", "RO", "AP", "RR", "SE", "PI", "MA", "PB", "AL", "ES", "MS"].map((uf) => (
                              <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black">2. Dados do Processo (PDF ou Texto)</Label>
                      <Textarea 
                        placeholder="COLE O CONTRATO OU PROCURAÇÃO ANTIGA PARA EXTRAIR DADOS DO CLIENTE E PROCESSO..."
                        className="min-h-[250px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Repeat size={16} className="mr-2" />}
                        Gerar Draft de Substabelecimento
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Importar Base PDF</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste a procuração antiga</p>
                        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {step === 2 && extractedData && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão Forense</h2>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><User size={14} /> Dados da Transmissão</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Substabelecente (Cedente)</Label>
                        <Input value={extractedData.substabelecente.nome} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Substabelecido (Cessionário)</Label>
                        <Input value={extractedData.substabelecido.nome} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">OAB Cedente</Label>
                          <Input value={extractedData.substabelecente.oabCurta} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">OAB Cessionário</Label>
                          <Input value={extractedData.substabelecido.oabCurta} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados do Processo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                       <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Cliente Outorgante</Label>
                        <Input 
                          value={extractedData.cliente.nome} 
                          onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})}
                          className="border-black font-black uppercase rounded-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Tipo de Ação</Label>
                        <Input 
                          value={extractedData.processo.acao} 
                          onChange={(e) => setExtractedData({...extractedData, processo: {...extractedData.processo, acao: e.target.value}})}
                          className="border-black font-black uppercase rounded-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Número do Processo (CNJ)</Label>
                        <Input 
                          value={extractedData.processo.numero} 
                          onChange={(e) => setExtractedData({...extractedData, processo: {...extractedData.processo, numero: e.target.value}})}
                          className="border-black font-black uppercase rounded-none font-mono" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Cidade / Comarca</Label>
                          <Input 
                            value={extractedData.comarca} 
                            onChange={(e) => setExtractedData({...extractedData, comarca: e.target.value})}
                            className="border-black font-black uppercase rounded-none" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Data Extenso</Label>
                          <Input 
                            value={extractedData.dataExtenso} 
                            onChange={(e) => setExtractedData({...extractedData, dataExtenso: e.target.value})}
                            className="border-black font-black uppercase rounded-none" 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-blue-50 border-2 border-blue-200 p-4 flex gap-3 items-start">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-blue-900">Nota de Protocolo:</p>
                      <p className="text-[8px] font-bold text-blue-700 uppercase leading-tight">
                        Este documento solicita a <b>exclusão</b> do advogado cedente da contracapa dos autos, cumprindo o Art. 272, §5º do CPC.
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                    Selar & Exportar Substabelecimento
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
