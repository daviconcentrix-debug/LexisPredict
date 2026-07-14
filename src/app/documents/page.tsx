
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
  Mail,
  Phone,
  Hash,
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
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateProcuracaoPDFAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "SC", "ES", "MS", "MG", "PR"] },
  { id: 'ingrid', nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', estados: ["BA", "CE", "MT", "PI", "RN", "SP"] },
  { id: 'lucas', nome: 'LUCAS DOS SANTOS DE JESUS', estados: ["DF", "AL", "AM", "PE", "RJ", "SP"] },
  { id: 'leticia', nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
  { id: 'eraldo', nome: 'ERALDO FRANCISCO DA SILVA JUNIOR', estados: ["SP"] },
  { id: 'isai', nome: 'ISAI SAMPAIO MOREIRA', estados: ["SP"] },
  { id: 'gilberto', nome: 'GILBERTO BONFIM CAVALCANTI FILHO', estados: ["SP"] },
  { id: 'fabio', nome: 'FABIO RODRIGUES SAMPAIO MOREIRA', estados: ["SP"] },
  { id: 'matheus_dias', nome: 'MATHEUS SANTOS DIAS', estados: ["SP"] },
  { id: 'maikon', nome: 'MAIKON ALVES LOPES DOS SANTOS', estados: ["SP"] },
  { id: 'andressa_tavares', nome: 'ANDRESSA EDUARDA TAVARES', estados: ["SP"] },
];

export default function DocumentGenerator() {
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
      const res = await extrairTextoDoPDFAction(formData);
      if (res.success) {
        setInputText(res.text || '');
        toast({ title: "Contrato Transcrevido", description: "Texto pronto para triagem neural." });
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
      toast({ title: "Dados Insuficientes", description: "Insira o texto do contrato para triagem.", variant: "destructive" });
      return;
    }
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", description: "Selecione o advogado e o estado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
      if (res.success) {
        setExtractedData(res);
        setStep(2);
        toast({ title: "Triagem Neural Concluída" });
      } else {
        setApiError(res.error || "Falha na triagem neural.");
      }
    } catch (err) {
      setApiError("Erro crítico de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (category: string, field: string, value: string) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSeal = async () => {
    setLoading(true);
    try {
      const payload = {
        ...extractedData,
        local: selectedState === 'SP' ? 'São Paulo - SP' : `${selectedState}`,
        dataExtenso: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      const res = await generateProcuracaoPDFAction(payload);
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
        link.download = `Procuracao_${extractedData.cliente.nome}.pdf`;
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
                <Shield size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Gerador de Procurações Elite</h1>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">v15.0 Elite</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {apiError && (
                <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 rounded-none shadow-[8px_8px_0px_#000]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-black uppercase text-xs">Erro de Triagem</AlertTitle>
                  <AlertDescription className="text-[10px] font-bold uppercase">{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        1. Configuração de Gabinete
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
                        <div className={cn("space-y-2", !selectedLawyer && "opacity-30 pointer-events-none")}>
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedLawyer}>
                            <SelectTrigger className="w-full border-2 border-black h-12 font-black uppercase text-[11px] rounded-none bg-white">
                              <SelectValue placeholder="ESTADO..." />
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
                      <Label className="uppercase text-[10px] font-black">2. Texto do Contrato</Label>
                      <Textarea 
                        placeholder="COLE O TEXTO DO CONTRATO AQUI OU FAÇA O UPLOAD DO PDF..."
                        className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none leading-relaxed"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button 
                        onClick={handleExtract} 
                        disabled={loading}
                        className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#facc15]"
                      >
                        {loading ? <><Loader2 className="animate-spin mr-2" /> Processando...</> : <><Zap size={16} className="mr-2 text-yellow-500 fill-yellow-500" /> Extrair & Iniciar Gabinete</>}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Upload size={14} /> Leitura PDF</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
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
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Dados Extraídos</h2>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><User size={14} /> Dados do Outorgante</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Nome Completo</Label>
                      <Input value={extractedData.cliente.nome} onChange={(e) => updateField('cliente', 'nome', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">CPF</Label>
                        <Input value={extractedData.cliente.cpf} onChange={(e) => updateField('cliente', 'cpf', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">RG</Label>
                        <Input value={extractedData.cliente.rg} onChange={(e) => updateField('cliente', 'rg', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase flex items-center gap-1.5 text-blue-700"><CalendarDays size={10} /> Data de Nascimento</Label>
                        <Input type="date" value={extractedData.cliente.dataNascimento} onChange={(e) => updateField('cliente', 'dataNascimento', e.target.value)} className="border-black font-black rounded-none h-10" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><MapPin size={10} /> CEP</Label>
                        <Input value={extractedData.cliente.cep} onChange={(e) => updateField('cliente', 'cep', e.target.value)} className="border-black font-black rounded-none" placeholder="00000-000" />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Endereço Completo</Label>
                      <Input value={extractedData.cliente.endereco} onChange={(e) => updateField('cliente', 'endereco', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Mail size={10} /> Email</Label>
                        <Input type="email" value={extractedData.cliente.email} onChange={(e) => updateField('cliente', 'email', e.target.value)} className="border-black font-black lowercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Phone size={10} /> Telefone</Label>
                        <Input value={extractedData.cliente.telefone} onChange={(e) => updateField('cliente', 'telefone', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados Processuais (Get Assessoria)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {extractedData.processos.map((p: any, i: number) => (
                        <div key={i} className="p-5 bg-gray-50 border-2 border-dashed border-black/10 space-y-4">
                           <div className="grid gap-1">
                             <Label className="text-[9px] font-black uppercase">Instituição Financeira (Banco)</Label>
                             <Input value={p.banco} onChange={(e) => {
                               const newProcessos = [...extractedData.processos];
                               newProcessos[i].banco = e.target.value;
                               setExtractedData({...extractedData, processos: newProcessos});
                             }} className="border-black font-black uppercase rounded-none bg-white" />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-1">
                               <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Hash size={10} /> CNPJ do Banco</Label>
                               <Input value={p.cnpjBanco} onChange={(e) => {
                                 const newProcessos = [...extractedData.processos];
                                 newProcessos[i].cnpjBanco = e.target.value;
                                 setExtractedData({...extractedData, processos: newProcessos});
                               }} className="border-black font-black rounded-none bg-white" placeholder="00.000.000/0000-00" />
                             </div>
                             <div className="grid gap-1">
                               <Label className="text-[9px] font-black uppercase">Processo (CNJ)</Label>
                               <Input value={p.numero} onChange={(e) => {
                                 const newProcessos = [...extractedData.processos];
                                 newProcessos[i].numero = e.target.value;
                                 setExtractedData({...extractedData, processos: newProcessos});
                               }} className="border-black font-black uppercase rounded-none bg-white font-mono" />
                             </div>
                           </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="bg-yellow-50 border-2 border-yellow-200 p-4 flex gap-3 items-start">
                    <Info size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-yellow-900">Aviso de Compliance:</p>
                      <p className="text-[8px] font-bold text-yellow-700 uppercase leading-tight">
                        O <b>CNPJ do Banco</b> é capturado para fins de auditoria, mas <b>não será impresso no PDF final</b> do documento atual.
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                    Selar & Exportar PDF
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
