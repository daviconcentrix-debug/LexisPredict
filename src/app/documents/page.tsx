
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
import { extrairDadosProcuracao, DocumentOutput } from '@/ai/flows/document-flow';
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

// Global reference for PDFJS
let pdfjsLib: any = null;

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
  const [extractedData, setExtractedData] = useState<DocumentOutput | null>(null);
  const [step, setStep] = useState(1); 
  const [fileLoading, setFileLoading] = useState(false);
  const [pdfEngineReady, setPdfEngineReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preferredIA, setPreferredIA] = useState('xai');
  const [apiError, setApiError] = useState<{ engine: string, message: string } | null>(null);
  
  const [docLocal, setDocLocal] = useState('');
  const [docDate, setDocDate] = useState('');

  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedIA = localStorage.getItem('lexisPredict_preferred_ia') || 'xai';
    setPreferredIA(savedIA);

    const initPdfJS = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        pdfjsLib = pdfjs;
        setPdfEngineReady(true);
      } catch (error) {
        console.error("PDF.js Engine Load Failure:", error);
      }
    };
    initPdfJS();
  }, []);

  const availableStates = useMemo(() => {
    const lawyer = ADVOGADOS_BANCA.find(a => a.nome === selectedLawyer);
    return lawyer?.estados || [];
  }, [selectedLawyer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdfEngineReady) return;

    setFileLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          setInputText(fullText);
          toast({ title: "Contrato Lido", description: "Inicie a extração neural v620.0 Elite." });
        } catch (err) {
          toast({ title: "Falha na Leitura", description: "O PDF pode estar protegido ou corrompido.", variant: "destructive" });
        } finally {
          setFileLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setFileLoading(false);
      toast({ title: "Erro de Buffer", variant: "destructive" });
    }
  };

  const handleExtract = async () => {
    if (!inputText || loading || !selectedLawyer || !selectedState) return;
    setLoading(true);
    setApiError(null);
    try {
      const data = await extrairDadosProcuracao({ 
        text: inputText, 
        preferredLawyer: selectedLawyer,
        preferredState: selectedState,
        preferredModel: preferredIA as any
      });
      setExtractedData(data);
      setDocLocal(selectedState === "SP" ? "São Paulo - SP" : `${selectedState}`);
      setDocDate(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
      setStep(2);
      toast({ title: "Triagem Concluída", description: "Revise os dados de gabinete." });
    } catch (error: any) {
      setApiError({ engine: preferredIA, message: error.message });
      toast({ title: "Falha na Triagem", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAndRetry = () => {
    const engines: any = ['xai', 'grok', 'airforce', 'puter'];
    const currentIndex = engines.indexOf(preferredIA);
    const nextIA = engines[(currentIndex + 1) % engines.length];
    
    setPreferredIA(nextIA);
    localStorage.setItem('lexisPredict_preferred_ia', nextIA);
    setApiError(null);
    toast({ title: "Motor Alternado", description: `Migrando para ${nextIA.toUpperCase()}...` });
    setTimeout(() => handleExtract(), 500);
  };

  const updateExtractedField = (category: 'cliente' | 'advogado', field: string, value: string) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      [category]: { ...(extractedData as any)[category], [field]: value }
    });
  };

  const updateProcessField = (index: number, field: string, value: string) => {
    if (!extractedData) return;
    const newProcessos = [...extractedData.processos];
    (newProcessos[index] as any)[field] = value;
    setExtractedData({ ...extractedData, processos: newProcessos });
  };

  const getEmailContent = () => {
    if (!extractedData) return { subject: '', body: '' };
    const clientName = extractedData.cliente.nome;
    const processNumber = extractedData.processos[0]?.numero || 'S/N';
    const lawyerName = extractedData.advogado.nome;
    const honorific = extractedData.advogado.cargo === 'advogada' ? 'Dra.' : 'Dr.';

    const subject = `Nova Procuração - Processo ${processNumber}`;
    const body = `Prezado(a) Sr.(a) ${clientName},\n\nInformamos que seu processo nº ${processNumber}, passará a ser acompanhado pelo ${honorific} ${lawyerName}, visando um acompanhamento ainda mais eficiente da demanda.\n\nPor esse motivo, será necessário anexar uma nova procuração atualizada aos autos.\n\nPedimos, por gentileza, que confira os dados do documento encaminhado, imprima e assine manualmente, com assinatura semelhante à do documento de identificação, realizando também o reconhecimento de firma em cartório.\n\nApós isso, solicitamos o envio de uma foto legível ou do documento digitalizado para juntada no processo.\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nGabinete W1 Capital`;

    return { subject, body };
  };

  const handleSendEmail = () => {
    if (!extractedData) return;
    const email = extractedData.cliente.email;
    if (!email || email === '---' || email === 'Não localizado') {
      toast({ title: "E-mail Ausente", description: "Insira o e-mail no passo anterior.", variant: "destructive" });
      setStep(2);
      return;
    }
    const { subject, body } = getEmailContent();
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const link = document.createElement('a');
    link.href = mailto;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Iniciando Despacho" });
  };

  const handleCopyText = () => {
    const { body } = getEmailContent();
    navigator.clipboard.writeText(body);
    setCopied(true);
    toast({ title: "Copiado" });
    setTimeout(() => setCopied(false), 2000);
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
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Gerador de Procurações</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">
               Engine: {preferredIA.toUpperCase()}
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full print:p-0">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {apiError && (
                 <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 rounded-none shadow-[4px_4px_0px_#000]">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle className="font-black uppercase text-xs">Aviso de Núcleo Neural</AlertTitle>
                   <AlertDescription className="flex flex-col gap-3 mt-2">
                     <p className="text-[10px] font-bold uppercase">O motor {apiError.engine.toUpperCase()} falhou. Deseja alternar para a próxima via reserva?</p>
                     <Button onClick={handleSwitchAndRetry} className="bg-red-600 text-white border-2 border-black h-9 font-black uppercase text-[9px] rounded-none hover:bg-black transition-all w-fit px-6">
                        Alternar & Re-tentar
                     </Button>
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
                            <Label className="uppercase text-[10px] font-black flex items-center gap-1.5">
                              <MapPin size={12}/> Estado (OAB Territorial)
                            </Label>
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
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Upload size={14} /> Leitura PDF (Local)
                        </CardTitle>
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
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
               <div className="flex items-center justify-between border-b-2 border-black pb-4">
                  <div className="flex items-center gap-3">
                     <Edit3 size={20} />
                     <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Gabinete v620.0</h2>
                  </div>
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-transparent hover:border-black rounded-none">
                    <ChevronLeft size={14} className="mr-1" /> Voltar
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Outorgante
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-1">
                          <Label>Nome</Label>
                          <Input value={extractedData.cliente.nome} onChange={(e) => updateExtractedField('cliente', 'nome', e.target.value)} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1">
                            <Label>RG</Label>
                            <Input value={extractedData.cliente.rg} onChange={(e) => updateExtractedField('cliente', 'rg', e.target.value)} className="border-black font-black rounded-none h-11" />
                          </div>
                          <div className="grid gap-1">
                            <Label>CPF</Label>
                            <Input value={extractedData.cliente.cpf} onChange={(e) => updateExtractedField('cliente', 'cpf', e.target.value)} className="border-black font-black rounded-none h-11" />
                          </div>
                        </div>
                        <div className="grid gap-1">
                          <Label>E-mail do Cliente</Label>
                          <Input value={extractedData.cliente.email} onChange={(e) => updateExtractedField('cliente', 'email', e.target.value)} placeholder="cliente@exemplo.com" className="border-black border-2 font-black uppercase rounded-none h-11" />
                        </div>
                        <div className="grid gap-1">
                          <Label>Endereço</Label>
                          <Input value={extractedData.cliente.endereco} onChange={(e) => updateExtractedField('cliente', 'endereco', e.target.value)} className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={14} /> Dados da Ação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {extractedData.processos.map((p, i) => (
                          <div key={i} className="space-y-4 p-4 bg-gray-50 border-2 border-dashed border-black/10">
                            <div className="grid gap-1">
                              <Label className="text-yellow-600">Instituição Financeira (BANCO)</Label>
                              <Input value={p.banco} onChange={(e) => updateProcessField(i, 'banco', e.target.value)} placeholder="NOME DO BANCO..." className="border-black border-2 font-black uppercase rounded-none h-11 bg-white" />
                            </div>
                            <div className="grid gap-1">
                              <Label className="text-yellow-600">CNPJ do Banco</Label>
                              <Input value={p.cnpjBanco} onChange={(e) => updateProcessField(i, 'cnpjBanco', e.target.value)} placeholder="00.000.000/0001-00" className="border-black border-2 font-black uppercase rounded-none h-11 bg-white" />
                            </div>
                            <div className="grid gap-1">
                              <Label>Processo (CNJ)</Label>
                              <Input value={p.numero} onChange={(e) => updateProcessField(i, 'numero', e.target.value)} className="border-black font-black rounded-none h-11 bg-white" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <CalendarDays size={14} /> Local e Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid gap-4">
                          <Input value={docLocal} onChange={(e) => setDocLocal(e.target.value)} placeholder="LOCAL (CIDADE - UF)" className="border-black font-black uppercase rounded-none h-11" />
                          <Input value={docDate} onChange={(e) => setDocDate(e.target.value)} placeholder="DATA POR EXTENSO" className="border-black font-black uppercase rounded-none h-11" />
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={() => setStep(3)} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                      <CheckCircle2 size={16} className="mr-2" /> Selar Documento
                    </Button>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && extractedData && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-[1200px] mx-auto print:flex print:flex-col">
                  <div className="lg:col-span-1 space-y-6 print:hidden">
                    <Button variant="ghost" onClick={() => setStep(2)} className="w-full font-black uppercase text-[10px] border-2 border-transparent hover:border-black rounded-none h-10 mb-2">
                      <ChevronLeft size={14} className="mr-1" /> Editar Dados
                    </Button>
                    <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-black text-white py-3">
                         <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={14} className="text-green-400" /> Despacho
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                         <Button onClick={handleCopyText} className="w-full bg-white text-black border-2 border-black h-11 font-black uppercase text-[9px] rounded-none hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000] hover:shadow-none">
                            {copied ? <Check size={14} className="mr-2 text-green-600" /> : <Copy size={14} className="mr-2" />} Copiar Instruções
                         </Button>
                         <Button onClick={handleSendEmail} className="w-full bg-white text-black border-2 border-black h-11 font-black uppercase text-[9px] rounded-none hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_#000] hover:shadow-none">
                            <Mail size={14} className="mr-2" /> Enviar por E-mail
                         </Button>
                      </CardContent>
                    </Card>
                    <Button onClick={() => window.print()} className="w-full bg-black text-white font-black uppercase text-[10px] h-14 rounded-none border-2 border-black shadow-[6px_6px_0px_#facc15] hover:shadow-none transition-all">
                      <Printer size={16} className="mr-2" /> Exportar PDF Forense
                    </Button>
                  </div>
                  <div className="lg:col-span-3 document-container bg-white shadow-2xl border-2 border-black print:shadow-none print:border-none">
                    <div className="procuracao-page" ref={printRef}>
                      <div className="doc-title">PROCURAÇÃO "AD JUDICIA"</div>
                      <div className="doc-paragraph">
                        <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, brasileiro, {extractedData.cliente.estadoCivil}, {extractedData.cliente.profissao}, portador do RG sob Nº {extractedData.cliente.rg} e devidamente inscrito no CPF sob Nº {extractedData.cliente.cpf}, residente e domiciliado à {extractedData.cliente.endereco}, com endereço eletrônico: {extractedData.cliente.email}, neste ato nomeia como seu procurador:
                      </div>
                      <div className="doc-paragraph">
                        <strong>{extractedData.advogado.nome.toUpperCase()}</strong>, brasileiro, {extractedData.advogado.cargo}, inscrito na OAB sob o número {extractedData.advogado.oab}, com endereço profissional na {extractedData.advogado.endereco}, e endereço eletrônico: {extractedData.advogado.email}.
                      </div>
                      <div className="doc-paragraph">
                        <strong>PODERES:</strong> Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula “AD JUDICIA”, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da {extractedData.processos.map((p, index) => (
                          <span key={index}>
                            <strong><u>{p.acao}</u></strong> promovida contra <strong>{p.banco.toUpperCase()}</strong>, inscrito no CNPJ nº <strong>{p.cnpjBanco}</strong>, processo nº {p.numero}{index < extractedData.processos.length - 1 ? '; ' : '.'}
                          </span>
                        ))}
                      </div>
                      <div className="doc-date">{docLocal || "____________________"}, {docDate || "____ de __________ de 202__."}</div>
                      <div className="signature-area">
                        <div className="signature-line"></div>
                        <div className="signature-name">{extractedData.cliente.nome.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0 print:hidden">
          <Copyright size={10} /> 2026 W1 Capital. <span className="uppercase">Relatório Consolidado • FUNDADOR DAVI ALVES FIGUEREDO</span>
        </footer>
        <style jsx global>{`
          .document-container { width: 210mm; min-height: 297mm; padding: 30mm 25mm; margin-bottom: 50px; }
          @media print {
            body * { visibility: hidden; }
            .document-container, .document-container * { visibility: visible; }
            .document-container { position: absolute; left: 0; top: 0; width: 210mm; height: 297mm; padding: 30mm 25mm; border: none !important; box-shadow: none !important; }
            @page { size: A4; margin: 0; }
          }
          .procuracao-page { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; text-align: justify; }
          .doc-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 40px; }
          .doc-paragraph { margin-bottom: 20px; text-indent: 20mm; }
          .doc-date { text-align: center; margin-top: 50px; margin-bottom: 60px; }
          .signature-area { text-align: center; margin-top: 40px; }
          .signature-line { width: 70%; border-top: 1px solid #000; margin: 0 auto 10px auto; }
          .signature-name { font-weight: bold; text-transform: uppercase; }
        `}</style>
      </main>
    </div>
  );
}
