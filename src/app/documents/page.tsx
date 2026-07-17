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
  Mail,
  Phone,
  Hash,
  Info,
  Trash2,
  Eye
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

const BANCA_DATA: Record<string, any> = {
  "DIEGO GOMES DIAS": {
    oabs: { "BA": "77510/BA", "CE": "52996-A/CE", "MT": "34044-A/MT", "PI": "22858/PI", "RN": "21766A/RN", "SP": "370.898/SP" },
    endereco: "Av. São Miguel, nº 4810 – Jardim Cotinha – São Paulo – SP – CEP: 03870-100",
    email: "diego_gomesdias@yahoo.com.br"
  },
  "LETICIA ALVES GODOY DA CRUZ": {
    oabs: { "TO": "12.528-A/TO", "AC": "6572/AC", "RS": "131831A/RS", "PB": "31888 A/PB", "PA": "36417-A/PA", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "leticiagodoy.adv@gmail.com"
  },
  "PABLO MATHEUS SILVA BASTOS PEREIRA": {
    oabs: { "SP": "520783/SP", "MG": "249550/MG", "PR": "520783/PR" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-071",
    email: "pablobastos@adv.oabsp.org.br"
  },
  "INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES": {
    oabs: { "MA": "490.641/SP", "RO": "13.438/RO", "AP": "5.819-A/AP", "SE": "1.601A/SE", "RR": "844-A/RR", "GO": "70699/GO", "SP": "490.641/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "pachecoingrid.adv@gmail.com"
  },
  "LUCAS DOS SANTOS DE JESUS": {
    oabs: { "DF": "78116/DF", "AL": "21512A/AL", "AM": "A2373/AM", "PE": "66465/PE", "RJ": "261767/RJ", "SP": "520783/SP" },
    endereco: "Rua Amazonas, nº 439 – Sala 20/28 – Centro – São Caetano do Sul – SP – CEP: 09520-070",
    email: "lucassj.adv01@gmail.com"
  }
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function DocumentGenerator() {
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
        toast({ title: "Documento Transcrevido", description: "Texto pronto para triagem neural." });
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
      toast({ title: "Dados Insuficientes", description: "Insira o texto do documento para triagem.", variant: "destructive" });
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
        toast({ title: "Triagem Concluída" });
      } else {
        setApiError(res.error || "FALHA_CRITICA_TRIAGEM_NEURAL");
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
      const lawyerInfo = BANCA_DATA[selectedLawyer];
      const payload = {
        ...extractedData,
        advogado: {
          nome: selectedLawyer,
          oab: lawyerInfo.oabs[selectedState] || lawyerInfo.oabs['SP'],
          endereco: lawyerInfo.endereco,
          email: lawyerInfo.email
        },
        local: selectedState,
        dataExtenso: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      const res = await generateProcuracaoPDFAction(payload);
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Procuracao_${extractedData.cliente.nome}.pdf`;
        link.click();
        toast({ title: "Documento Selado" });
      } else {
        toast({ title: "Erro na Selagem", description: res.error, variant: "destructive" });
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
              <div className="icon-3d-block black w-10 h-10 rounded-sm bg-black flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Gerador de Procurações Elite</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">v20.0 Elite</Badge>
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
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        1. Configuração de Gabinete
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                          <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                            <SelectTrigger className="w-full border-2 border-black h-12 font-black uppercase text-[11px] rounded-none bg-white">
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
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="w-full border-2 border-black h-12 font-black uppercase text-[11px] rounded-none bg-white">
                              <SelectValue placeholder="ESTADO..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {["SP", "RJ", "MG", "PR", "BA", "CE", "RN", "PE", "PA", "MA", "SC", "ES", "MS", "RS", "MT", "GO", "DF", "TO", "PI"].map((uf) => (
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
                      <div className="flex items-center justify-between">
                        <Label className="uppercase text-[10px] font-black">2. Texto do Documento</Label>
                        <Button variant="ghost" size="sm" onClick={() => setInputText('')} className="h-6 text-[8px] font-black uppercase hover:bg-red-600 hover:text-white">
                          <Trash2 size={10} className="mr-1" /> Limpar
                        </Button>
                      </div>
                      <Textarea 
                        placeholder="COLE O CONTRATO OU LEAD DA GET ASSESSORIA AQUI..."
                        className="min-h-[300px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none leading-relaxed bg-white"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button 
                        onClick={handleExtract} 
                        disabled={loading}
                        className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]"
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <><Zap size={16} className="mr-2" /> Extrair & Iniciar Gabinete</>}
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
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">Revisão de Dados Extraídos</h2>
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
                        <Label className="text-[9px] font-black uppercase">Estado Civil</Label>
                        <Input value={extractedData.cliente.estadoCivil} onChange={(e) => updateField('cliente', 'estadoCivil', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Profissão</Label>
                        <Input value={extractedData.cliente.profissao} onChange={(e) => updateField('cliente', 'profissao', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Endereço Residencial</Label>
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
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados Processuais</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-1">
                          <Label className="text-[9px] font-black uppercase">Instituição Financeira (Banco)</Label>
                          <Input 
                            value={extractedData.processos?.[0]?.banco || "BANCO"} 
                            onChange={(e) => {
                              const newProcessos = [...extractedData.processos];
                              if (!newProcessos[0]) newProcessos[0] = { banco: '', cnpjBanco: '', numero: '', acao: '', estado: 'SP' };
                              newProcessos[0].banco = e.target.value;
                              setExtractedData({...extractedData, processos: newProcessos});
                            }} 
                            className="border-black font-black uppercase rounded-none bg-white" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1">
                            <Label className="text-[9px] font-black uppercase">CNPJ do Banco</Label>
                            <Input 
                              value={extractedData.processos?.[0]?.cnpjBanco || ""} 
                              onChange={(e) => {
                                const newProcessos = [...extractedData.processos];
                                if (!newProcessos[0]) newProcessos[0] = { banco: '', cnpjBanco: '', numero: '', acao: '', estado: 'SP' };
                                newProcessos[0].cnpjBanco = e.target.value;
                                setExtractedData({...extractedData, processos: newProcessos});
                              }} 
                              className="border-black font-black rounded-none bg-white" 
                            />
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-[9px] font-black uppercase">Processo (CNJ)</Label>
                            <Input 
                              value={extractedData.processos?.[0]?.numero || "S/N"} 
                              onChange={(e) => {
                                const newProcessos = [...extractedData.processos];
                                if (!newProcessos[0]) newProcessos[0] = { banco: '', cnpjBanco: '', numero: '', acao: '', estado: 'SP' };
                                newProcessos[0].numero = e.target.value;
                                setExtractedData({...extractedData, processos: newProcessos});
                              }} 
                              className="border-black font-black uppercase rounded-none bg-white font-mono" 
                            />
                          </div>
                        </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Preview Visual</CardTitle>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase">Draft</Badge>
                    </CardHeader>
                    <CardContent className="p-10 text-black font-serif text-[11pt] leading-relaxed bg-white space-y-6">
                      <h3 className="text-center font-bold uppercase underline">PROCURAÇÃO "AD JUDICIA"</h3>
                      <p className="text-justify indent-10">
                        <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, {extractedData.cliente.nacionalidade || "brasileiro(a)"}, {extractedData.cliente.estadoCivil || "casado(a)"}, {extractedData.cliente.profissao || "autônomo(a)"}, portador do RG sob Nº {extractedData.cliente.rg} e devidamente inscrito no CPF sob Nº {extractedData.cliente.cpf}, residente e domiciliado à {extractedData.cliente.endereco}, com endereço eletrônico: {extractedData.cliente.email || 'Não informado'}, neste ato nomeia como seu procurador:
                      </p>
                      <p className="text-justify indent-10">
                        <strong>{selectedLawyer.toUpperCase()}</strong>, brasileiro, advogado, inscrito na OAB/{selectedState} sob o número {BANCA_DATA[selectedLawyer].oabs[selectedState] || BANCA_DATA[selectedLawyer].oabs['SP']}, com endereço profissional na {BANCA_DATA[selectedLawyer].endereco}, e endereço eletrônico: {BANCA_DATA[selectedLawyer].email}.
                      </p>
                    </CardContent>
                  </Card>

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
