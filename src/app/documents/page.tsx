
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  FileText, 
  Zap, 
  Loader2, 
  Copyright, 
  Printer, 
  Edit3, 
  ChevronRight,
  Info,
  User,
  Upload,
  FileUp,
  X,
  RefreshCcw,
  Sparkles,
  Shield,
  CheckCircle2,
  Building2,
  AlertCircle,
  MapPin,
  CalendarDays,
  Mail,
  Copy,
  Check,
  MessageCircle,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { extrairDadosProcuracao, extrairTextoDoPDFAction, generateProcuracaoPDFAction } from '@/app/actions/document-actions';
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

const ADVOGADOS_BANCA = [
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "SC", "ES", "MS", "MG", "PR"] },
  { id: 'ingrid', nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', estados: ["BA", "CE", "MT", "PI", "RN", "SP"] },
  { id: 'lucas', nome: 'LUCAS DOS SANTOS DE JESUS', estados: ["DF", "AL", "AM", "PE", "RJ", "SP"] },
  { id: 'leticia', nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
];

export default function DocumentGenerator() {
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [step, setStep] = useState(1); 
  const [fileLoading, setFileLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [docLocal, setDocLocal] = useState('');
  const [docDate, setDocDate] = useState('');

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocDate(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
  }, []);

  const availableStates = useMemo(() => {
    const lawyer = ADVOGADOS_BANCA.find(a => a.nome === selectedLawyer);
    return lawyer?.estados || [];
  }, [selectedLawyer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const result = await extrairTextoDoPDFAction(formData);
      if (result.success && result.text) {
        setInputText(result.text);
        toast({ title: "Contrato Transcrito" });
      } else {
        toast({ title: "Falha na Leitura", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Servidor", variant: "destructive" });
    } finally {
      setFileLoading(false);
    }
  };

  const handleExtract = async () => {
    console.log("[DOCS] Iniciando Extração...");
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", description: "Selecione o advogado e o estado antes de extrair.", variant: "destructive" });
      return;
    }
    if (inputText.length < 50) {
      toast({ title: "Texto Curto", description: "O contrato precisa ter pelo menos 50 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const data = await extrairDadosProcuracao({ 
        text: inputText, 
        preferredLawyer: selectedLawyer,
        preferredState: selectedState
      });
      
      if (data && !data.error) {
        setExtractedData(data);
        setDocLocal(selectedState === "SP" ? "São Paulo - SP" : `${selectedState}`);
        setStep(2);
        toast({ title: "Triagem Neural Concluída" });
      } else {
        setApiError(data.message || "A extração neural falhou. Verifique se o texto do contrato é válido.");
      }
    } catch (error: any) {
      setApiError("Falha crítica de comunicação com o núcleo neural.");
    } finally {
      setLoading(false);
    }
  };

  const updateExtractedField = (category: 'cliente' | 'advogado', field: string, value: string) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [category]: { ...(extractedData as any)[category], [field]: value } });
  };

  const updateProcessField = (index: number, field: string, value: string) => {
    if (!extractedData || !extractedData.processos) return;
    const newProcessos = [...extractedData.processos];
    if (newProcessos[index]) {
      (newProcessos[index] as any)[field] = value;
      setExtractedData({ ...extractedData, processos: newProcessos });
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const result = await generateProcuracaoPDFAction({
        ...extractedData,
        local: docLocal,
        dataExtenso: docDate
      });

      if (result.success && result.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${result.base64}`;
        link.download = `PROCURACAO_${extractedData.cliente.nome.replace(/\s+/g, '_')}.pdf`;
        link.click();
        toast({ title: "Documento Selado e Exportado" });
      } else {
        toast({ title: "Falha na Geração", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro na Geração", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40 print:hidden">
          <div className="flex items-center gap-4">
             <div className="icon-3d-wrapper">
                <div className="icon-3d-block black w-10 h-10 rounded-sm overflow-hidden flex items-center justify-center p-1 border-2 border-black">
                   <img src="https://picsum.photos/seed/lexislogo/32/32" className="object-contain invert" alt="Logo" />
                </div>
              </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Gerador de Procurações v10.5</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">
             Gabinete W1 Capital
          </Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {apiError && (
                 <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 rounded-xl p-6 shadow-md">
                   <div className="flex items-center gap-3">
                     <AlertCircle className="h-6 w-6" />
                     <AlertTitle className="font-black uppercase text-sm">Erro de Triagem</AlertTitle>
                   </div>
                   <AlertDescription className="mt-3">
                     <p className="text-[11px] font-bold uppercase leading-relaxed">{apiError}</p>
                   </AlertDescription>
                 </Alert>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                      <CardHeader className="bg-black text-white py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Shield size={14} className="text-yellow-400" /> 1. Configuração de Banca
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                            <Select value={selectedLawyer} onValueChange={(val) => { setSelectedLawyer(val); setSelectedState(''); }}>
                              <SelectTrigger className="w-full border-2 border-black h-12 font-black uppercase text-[11px] rounded-none bg-white">
                                <SelectValue placeholder="SELECIONE..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-black rounded-none">
                                {ADVOGADOS_BANCA.map((adv) => (
                                  <SelectItem key={adv.id} value={adv.nome} className="font-black uppercase text-[10px]">{adv.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className={cn("space-y-2 transition-all", !selectedLawyer && "opacity-30 pointer-events-none")}>
                            <Label className="uppercase text-[10px] font-black flex items-center gap-1.5"><MapPin size={12}/> Estado (OAB Territorial)</Label>
                            <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedLawyer}>
                              <SelectTrigger className="w-full border-2 border-black h-12 font-black uppercase text-[11px] rounded-none bg-white">
                                <SelectValue placeholder={selectedLawyer ? "ESCOLHA O ESTADO..." : "AGUARDANDO..."} />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-black rounded-none">
                                {availableStates.map((uf) => (
                                  <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                      <CardContent className="p-6 space-y-4">
                        <Label className="uppercase text-[10px] font-black">2. Texto do Contrato ou PDF</Label>
                        <Textarea 
                          placeholder="COLE O TEXTO OU ANEXE O PDF AO LADO..."
                          className="min-h-[350px] border-2 border-black font-black uppercase text-[11px] rounded-none bg-gray-50/50 resize-none leading-relaxed"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                        />
                        <Button 
                          onClick={handleExtract} 
                          disabled={loading || !inputText || !selectedLawyer || !selectedState}
                          className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#facc15] hover:shadow-none"
                        >
                          {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2 text-yellow-500 fill-yellow-500" />}
                          {loading ? "Sintonizando Triagem Neural..." : "Extrair & Iniciar Gabinete"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Upload size={14} /> Leitura PDF (Local)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 rounded-none p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                          {fileLoading ? <Loader2 className="animate-spin text-black group-hover:text-white" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                          <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste o Contrato</p>
                          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
               </div>
            </div>
          )}

          {step === 2 && extractedData && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24">
               <div className="flex items-center justify-between border-b-2 border-black pb-4">
                  <div className="flex items-center gap-3">
                     <Edit3 size={20} />
                     <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Gabinete v10.5</h2>
                  </div>
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-transparent hover:border-black rounded-none">
                    <ChevronLeft size={14} className="mr-1" /> Voltar
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><User size={14} /> Outorgante</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">Nome</Label>
                          <Input value={extractedData.cliente?.nome || ''} onChange={(e) => updateExtractedField('cliente', 'nome', e.target.value)} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1">
                            <Label className="uppercase text-[9px] font-black">RG</Label>
                            <Input value={extractedData.cliente?.rg || ''} onChange={(e) => updateExtractedField('cliente', 'rg', e.target.value)} className="border-black font-black rounded-none h-11" />
                          </div>
                          <div className="grid gap-1">
                            <Label className="uppercase text-[9px] font-black">CPF</Label>
                            <Input value={extractedData.cliente?.cpf || ''} onChange={(e) => updateExtractedField('cliente', 'cpf', e.target.value)} className="border-black font-black rounded-none h-11" />
                          </div>
                        </div>
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">E-mail</Label>
                          <Input value={extractedData.cliente?.email || ''} onChange={(e) => updateExtractedField('cliente', 'email', e.target.value)} placeholder="cliente@exemplo.com" className="border-black border-2 font-black uppercase rounded-none h-11" />
                        </div>
                        <div className="grid gap-1">
                          <Label className="uppercase text-[9px] font-black">Endereço</Label>
                          <Input value={extractedData.cliente?.endereco || ''} onChange={(e) => updateExtractedField('cliente', 'endereco', e.target.value)} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados da Ação</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {extractedData.processos?.map((p: any, i: number) => (
                          <div key={i} className="space-y-4 p-4 bg-gray-50 border-2 border-dashed border-black/10">
                            <div className="grid gap-1">
                              <Label className="uppercase text-[9px] font-black text-yellow-600">Instituição Financeira</Label>
                              <Input value={p.banco || ''} onChange={(e) => updateProcessField(i, 'banco', e.target.value)} placeholder="BANCO..." className="border-black border-2 font-black uppercase rounded-none h-11 bg-white" />
                            </div>
                            <div className="grid gap-1">
                              <Label className="uppercase text-[9px] font-black">Processo (CNJ)</Label>
                              <Input value={p.numero || ''} onChange={(e) => updateProcessField(i, 'numero', e.target.value)} className="border-black font-black rounded-none h-11 bg-white" />
                            </div>
                          </div>
                        )) || <p className="text-[10px] font-black uppercase opacity-40">Nenhum processo identificado.</p>}
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CalendarDays size={14} /> Local e Data</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid gap-4">
                          <Input value={docLocal} onChange={(e) => setDocLocal(e.target.value)} placeholder="LOCAL (CIDADE - UF)" className="border-black font-black uppercase rounded-none h-11" />
                          <Input value={docDate} onChange={(e) => setDocDate(e.target.value)} placeholder="DATA" className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                      </CardContent>
                    </Card>
                    <Button onClick={handleFinalize} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                      {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                      Selar & Exportar PDF
                    </Button>
                  </div>
               </div>
            </div>
          )}
        </div>
        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 print:hidden"><Copyright size={10} /> 2026 W1 Capital. <span className="uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span></footer>
      </main>
    </div>
  );
}
