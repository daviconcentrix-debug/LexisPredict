"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

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
  Info,
  Eye,
  Hash
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

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510", "CE": "52996-A", "MT": "34044-A", "PI": "22858", "RN": "21766A", "SP": "370.898" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br",
    genero: "M"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A", "AC": "6572", "RS": "131831A", "PB": "31888 A", "PA": "36417-A", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com",
    genero: "F"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783", "MG": "249550", "PR": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br",
    genero: "M"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641", "RO": "13.438", "AP": "5.819-A", "SE": "1.601A", "RR": "844-A", "GO": "70699", "SP": "490.641" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com",
    genero: "F"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116", "AL": "21512A", "AM": "A2373", "PE": "66465", "RJ": "261767", "SP": "520783" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com",
    genero: "M"
  }
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function HabilitacaoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
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
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", description: "Selecione o advogado e o estado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
      if (res.success) {
        const data = res as any;
        const lawyerInfo = BANCA_DATA[selectedLawyer];
        const rawOAB = lawyerInfo.oabs[selectedState] || lawyerInfo.oabs['SP'] || Object.values(lawyerInfo.oabs)[0];
        const oabNum = String(rawOAB).split('/')[0];

        setExtractedData({
          vara: "02ª VARA CÍVEL",
          comarca: `${selectedState === 'SP' ? 'São Paulo' : 'Comarca Local'} - ${selectedState}`,
          numeroProcesso: data.processos?.[0]?.numero || "",
          cliente: {
            ...data.cliente,
            nacionalidade: data.cliente.nacionalidade || "brasileiro(a)",
          },
          advogado: {
            nome: selectedLawyer.toUpperCase(),
            oab: oabNum,
            endereco: lawyerInfo.endereco,
            email: lawyerInfo.email,
            cep: "03870-100"
          },
          tipoAcao: data.processos?.[0]?.acao || "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
          reuNome: data.processos?.[0]?.banco || "INSTITUIÇÃO FINANCEIRA",
          reuCnpj: data.processos?.[0]?.cnpjBanco || "",
          cidadeEmissao: selectedState === 'SP' ? 'São Paulo' : 'Comarca Local',
          dataFormatada: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
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
    if (!extractedData) return;
    setLoading(true);
    try {
      const res = await generateHabilitacaoPecaPDFAction({
        ...extractedData,
        selectedState
      });
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
        link.download = `Habilitacao_${extractedData.cliente.nome}.pdf`;
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
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Habilitação + Procuração Elite</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Vantagem Operacional</Badge>
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
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">1. Configuração de Gabinete</CardTitle>
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
                      <Label className="uppercase text-[10px] font-black">2. Texto do Contrato / Procuração</Label>
                      <Textarea 
                        placeholder="COLE O TEXTO DO CONTRATO OU USE O UPLOAD ABAIXO..."
                        className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none bg-white"
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
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Upload size={14} /> Leitura PDF</CardTitle>
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
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão Forense Combinada</h2>
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
                      <Input value={extractedData.cliente.nome} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})} className="border-black font-black uppercase rounded-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">CPF</Label>
                        <Input value={extractedData.cliente.cpf} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, cpf: e.target.value}})} className="border-black font-black rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">RG</Label>
                        <Input value={extractedData.cliente.rg} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, rg: e.target.value}})} className="border-black font-black rounded-none" />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Endereço Residencial</Label>
                      <Input value={extractedData.cliente.endereco} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, endereco: e.target.value}})} className="border-black font-black uppercase rounded-none" />
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados do Juízo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Vara (Ex: 02ª VARA CÍVEL)</Label>
                         <Input value={extractedData.vara} onChange={(e) => setExtractedData({...extractedData, vara: e.target.value})} className="border-black font-black uppercase rounded-none" />
                       </div>
                       <div className="grid gap-1">
                         <Label className="text-[9px] font-black uppercase">Comarca (Ex: SÃO PAULO - SP)</Label>
                         <Input value={extractedData.comarca} onChange={(e) => setExtractedData({...extractedData, comarca: e.target.value})} className="border-black font-black uppercase rounded-none" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1">
                            <Label className="text-[9px] font-black uppercase">Processo (CNJ)</Label>
                            <Input value={extractedData.numeroProcesso} onChange={(e) => setExtractedData({...extractedData, numeroProcesso: e.target.value})} className="border-black font-black uppercase rounded-none font-mono" />
                          </div>
                          <div className="grid gap-1">
                             <Label className="text-[9px] font-black uppercase">Data Extenso</Label>
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
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Visualização do Documento</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase">Preview</Badge>
                </CardHeader>
                <CardContent className="p-12 text-black font-serif text-[12pt] leading-relaxed bg-white space-y-20">
                  {/* PÁGINA 1: HABILITAÇÃO */}
                  <div className="space-y-10">
                    <p className="font-bold uppercase leading-tight">
                      EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {extractedData.vara.toUpperCase()} DA COMARCA DE {extractedData.comarca.toUpperCase()}.
                    </p>
                    <p className="text-right font-bold">Processo nº {extractedData.numeroProcesso}</p>
                    <p className="text-justify indent-12">
                      <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, brasileiro(a), {extractedData.cliente.estadoCivil}, {extractedData.cliente.profissao}, portador da cédula de identidade RG número {extractedData.cliente.rg} e inscrito no CPF/MF sob o nº {extractedData.cliente.cpf}, residente e domiciliado na {extractedData.cliente.endereco}, vem, respeitosamente, à presença de Vossa Excelência, por seu procurador, ora constituído, apresentar seu pedido de habilitação e requerer a juntada do anexo instrumento particular de mandato.
                    </p>
                    <p className="text-justify indent-12">
                      Inicialmente, requer-se que as intimações sejam feitas em nome do procurador <strong>Dr. {extractedData.advogado.nome.toUpperCase()}</strong>, inscrito na <strong>OAB/{selectedState} {extractedData.advogado.oab}</strong>, com escritório profissional na {extractedData.advogado.endereco}, CEP {extractedData.advogado.cep}, e-mail: {extractedData.advogado.email}, requerendo que seja feita as respectivas anotações que se fizerem necessárias.
                    </p>
                    <div className="text-center space-y-2">
                      <p>Nestes Termos</p>
                      <p>Pede Deferimento.</p>
                      <p className="pt-4">{extractedData.cidadeEmissao}, {extractedData.dataFormatada}.</p>
                    </div>
                    <div className="flex flex-col items-center pt-10">
                      <div className="w-64 border-t border-black mb-2" />
                      <p className="font-bold uppercase">{extractedData.advogado.nome}</p>
                      <p className="font-bold">OAB/{selectedState} Nº {extractedData.advogado.oab}</p>
                    </div>
                  </div>

                  <hr className="border-t-2 border-dashed border-black/20" />

                  {/* PÁGINA 2: PROCURAÇÃO */}
                  <div className="space-y-10">
                    <h1 className="text-center font-bold text-lg uppercase tracking-widest">PROCURAÇÃO "AD JUDICIA"</h1>
                    <p className="text-justify indent-12">
                      <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, brasileiro(a), {extractedData.cliente.estadoCivil}, {extractedData.cliente.profissao}, portador do RG sob Nº {extractedData.cliente.rg} e devidamente inscrito no CPF sob Nº {extractedData.cliente.cpf}, residente e domiciliado à {extractedData.cliente.endereco}, neste ato nomeia como seu procurador:
                    </p>
                    <p className="text-justify indent-12">
                      <strong>{extractedData.advogado.nome.toUpperCase()}</strong>, brasileiro, advogado, inscrito na OAB/{selectedState} sob o número {extractedData.advogado.oab}, com endereço profissional na {extractedData.advogado.endereco}, CEP {extractedData.advogado.cep}, e endereço eletrônico: {extractedData.advogado.email}.
                    </p>
                    <p className="text-justify indent-12">
                      <strong>PODERES:</strong> Por este instrumento particular de mandato, o(a) outorgante retro referenciada nomeia e constitui seu bastante procurador o advogado também acima qualificado, a quem confere amplos poderes para o foro em geral, com a cláusula <strong>"AD JUDICIA"</strong>, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes, ainda, poderes especiais para desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente e independente da ordem de nomeação, podendo substabelecer esta em outrem, com ou sem reservas de iguais poderes, especialmente para, na defesa dos interesses do(a) outorgante, agir nos autos da <strong>{extractedData.tipoAcao.toUpperCase()}</strong> promovida contra o <strong>{extractedData.reuNome.toUpperCase()}</strong>, inscrito no CNPJ nº {extractedData.reuCnpj}.
                    </p>
                    <p className="text-center pt-10">{extractedData.cidadeEmissao}, {extractedData.dataFormatada}.</p>
                    <div className="flex flex-col items-center pt-10">
                      <div className="w-64 border-t border-black mb-2" />
                      <p className="font-bold uppercase">{extractedData.cliente.nome}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
