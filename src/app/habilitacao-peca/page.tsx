
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Zap, 
  Loader2, 
  Edit3, 
  Upload, 
  FileUp, 
  Shield, 
  CheckCircle2, 
  Building2, 
  AlertCircle, 
  User, 
  Eye,
  MapPin,
  Fingerprint,
  Calendar,
  AlertTriangle,
  ScanText
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
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extrairTextoDoPDFAction, generateHabilitacaoPecaPDFAction } from '@/app/actions/document-actions';
import { extrairDadosSoberanosAction } from '@/app/actions/transcription-actions';
import Link from 'next/link';

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510", "CE": "52996-A", "MT": "34044-A", "PI": "22858", "RN": "21766A", "SP": "370.898" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A", "AC": "6572", "RS": "131831A", "PB": "31888 A", "PA": "36417-A", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783", "MG": "249550", "PR": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641", "RO": "13.438", "AP": "5.819-A", "SE": "1.601A", "RR": "844-A", "GO": "70699", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116", "AL": "21512A", "AM": "A2373", "PE": "66465", "RJ": "261767", "SP": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com"
  }
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function HabilitacaoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedState, setSelectedState] = useState('SP');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isScanDetected, setIsScanDetected] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setIsScanDetected(false);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await extrairTextoDoPDFAction(formData);
      if (res.success) {
        if (!res.text || res.text.trim().length < 10) {
          setIsScanDetected(true);
          toast({ title: "Arquivo de Imagem", description: "O PDF não contém texto selecionável.", variant: "destructive" });
        } else {
          setInputText(res.text || '');
          toast({ title: "Documento Lido", description: "Texto pronto para triagem neural." });
        }
      } else {
        toast({ title: "Falha na Leitura", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Conexão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText || inputText.length < 5) {
      toast({ title: "Dados Insuficientes", description: "Insira o texto para triagem.", variant: "destructive" });
      return;
    }
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", description: "Selecione o advogado e o estado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosSoberanosAction(inputText);
      if (res.success) {
        if (res.erro) {
           setApiError(res.erro);
           toast({ title: "Erro de Triagem", description: res.erro, variant: "destructive" });
        } else {
           const lawyerInfo = BANCA_DATA[selectedLawyer];
           const rawOAB = lawyerInfo.oabs[selectedState] || lawyerInfo.oabs['SP'] || Object.values(lawyerInfo.oabs)[0];
           const oabNum = String(rawOAB).split('/')[0];

           setExtractedData({
             vara: "02ª VARA CÍVEL",
             comarca: `${selectedState === 'SP' ? 'SÃO PAULO' : 'COMARCA LOCAL'} - ${selectedState}`,
             numeroProcesso: "S/N",
             cliente: {
               nome: res.outorgante.nome,
               nacionalidade: res.outorgante.nacionalidade || "brasileiro(a)",
               estadoCivil: res.outorgante.estado_civil || "casado(a)",
               profissao: res.outorgante.profissao || "autônomo(a)",
               rg: res.outorgante.rg,
               cpf: res.outorgante.cpf,
               endereco: res.outorgante.endereco,
               email: res.outorgante.email
             },
             advogado: {
               nome: selectedLawyer.toUpperCase(),
               oab: oabNum,
               endereco: lawyerInfo.endereco,
               email: lawyerInfo.email,
               cep: "03870-100"
             },
             tipoAcao: res.poderes_especificos,
             reuNome: "INSTITUIÇÃO FINANCEIRA",
             reuCnpj: "",
             cidadeEmissao: res.cidade || "São Paulo",
             dataFormatada: `${res.cidade || "São Paulo"}, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
             selectedState
           });
           setStep(2);
           toast({ title: "Triagem Neural GET Concluída" });
        }
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
    if (!extractedData) return;
    setLoading(true);
    try {
      const res = await generateHabilitacaoPecaPDFAction(extractedData);
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Habilitacao_${extractedData.cliente.nome.replace(/\s/g, '_')}.pdf`;
        link.click();
        toast({ title: "Documento Selado" });
      } else {
        toast({ title: "Erro na Selagem", description: res.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erro na geração", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateClientField = (field: string, value: string) => {
    setExtractedData({
      ...extractedData,
      cliente: { ...extractedData.cliente, [field]: value }
    });
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
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Habilitação + Procuração Soberana</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Protocolo GET v27.0</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {isScanDetected && (
                <Alert className="border-2 border-red-600 bg-red-50 rounded-none shadow-[4px_4px_0px_#000]">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="ml-4">
                    <AlertTitle className="font-black uppercase text-xs text-red-600">Documento de Imagem Detectado</AlertTitle>
                    <AlertDescription className="text-[10px] font-bold uppercase text-red-800/80 leading-relaxed mt-1">
                      O arquivo enviado não possui texto selecionável. Utilize o Motor de OCR para converter o documento.
                      <Button asChild variant="link" className="h-auto p-0 text-red-600 font-black uppercase text-[10px] ml-2 underline">
                        <Link href="/tools/ocr">Abrir Unidade OCR <ScanText size={12} className="ml-1" /></Link>
                      </Button>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">1. Configuração de Banca</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                          <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none bg-white">
                              <SelectValue placeholder="SELECIONE..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {ADVOGADOS_LIST.map(name => <SelectItem key={name} value={name} className="font-black uppercase text-[10px]">{name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none bg-white">
                              <SelectValue placeholder="UF..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {["SP", "RJ", "MG", "PR", "BA", "CE", "RN", "PE", "PA", "MA", "SC", "ES", "MS", "RS", "MT", "GO", "DF", "TO"].map(uf => <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black">2. Conteúdo do PDF ou Texto</Label>
                      <Textarea 
                        placeholder="COLE QUALQUER CONTRATO OU DOCUMENTO PARA EXTRAÇÃO INTEGRAL..."
                        className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none bg-white"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                        Iniciar Extração Soberana
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Leitura PDF Livre</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                        {loading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste qualquer PDF</p>
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
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão Soberana</h2>
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
                      <Input value={extractedData.cliente.nome} onChange={(e) => updateClientField('nome', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase flex items-center gap-1.5 text-primary"><MapPin size={10} /> Endereço Residencial</Label>
                      <Input value={extractedData.cliente.endereco} onChange={(e) => updateClientField('endereco', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">CPF</Label>
                        <Input value={extractedData.cliente.cpf} onChange={(e) => updateClientField('cpf', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">RG</Label>
                        <Input value={extractedData.cliente.rg} onChange={(e) => updateClientField('rg', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados do Juízo & Banco</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Building2 size={10} /> Instituição Financeira (Banco)</Label>
                         <Input value={extractedData.reuNome} onChange={(e) => setExtractedData({...extractedData, reuNome: e.target.value})} className="border-black font-black uppercase rounded-none" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Fingerprint size={10} /> CNPJ do Banco</Label>
                         <Input value={extractedData.reuCnpj} onChange={(e) => setExtractedData({...extractedData, reuCnpj: e.target.value})} className="border-black font-black uppercase rounded-none font-mono" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1">
                            <Label className="text-[9px] font-black uppercase">Processo (CNJ)</Label>
                            <Input value={extractedData.numeroProcesso} onChange={(e) => setExtractedData({...extractedData, numeroProcesso: e.target.value})} className="border-black font-black uppercase rounded-none font-mono" />
                          </div>
                          <div className="grid gap-1">
                             <Label className="text-[9px] font-black uppercase flex items-center gap-1.5"><Calendar size={10} /> Data por Extenso</Label>
                             <Input value={extractedData.dataFormatada} onChange={(e) => setExtractedData({...extractedData, dataFormatada: e.target.value})} className="border-black font-black uppercase rounded-none" />
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* PREVISÃO VISUAL DO DOCUMENTO */}
              <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Visualização</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase">Draft</Badge>
                </CardHeader>
                <CardContent className="p-12 text-black font-serif text-[12pt] leading-relaxed bg-white space-y-10">
                  <p className="font-bold uppercase">
                    EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {extractedData.vara.toUpperCase()} DA COMARCA DE {extractedData.comarca.toUpperCase()}.
                  </p>
                  <p className="text-right font-bold">Processo nº {extractedData.numeroProcesso}</p>
                  <p className="text-justify indent-12">
                    <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, brasileiro(a), {extractedData.cliente.estadoCivil}, {extractedData.cliente.profissao}, portador do RG número {extractedData.cliente.rg} e inscrito no CPF sob o nº {extractedData.cliente.cpf}, residente e domiciliado na {extractedData.cliente.endereco}, vem apresentar seu pedido de habilitação.
                  </p>
                  <p className="text-center pt-10">{extractedData.dataFormatada}.</p>
                  <div className="flex flex-col items-center pt-10">
                    <div className="w-64 border-t border-black mb-2" />
                    <p className="font-bold uppercase">{extractedData.advogado.nome}</p>
                    <p className="font-bold">OAB/{extractedData.selectedState} Nº {extractedData.advogado.oab}</p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Selar & Exportar Habilitação GET
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
