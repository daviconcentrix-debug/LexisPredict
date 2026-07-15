"use client";
/**
 * @fileOverview LexisPredict - W1 Capital Advanced Legal Operations
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
import React, { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  FilePlus2, 
  Zap, 
  Loader2, 
  Edit3, 
  Upload,
  FileUp,
  CheckCircle2,
  Building2,
  MapPin,
  CalendarDays,
  User,
  Mail,
  Hash,
  Eye,
  Info,
  Copyright
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
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateHabilitacaoPDFAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { nome: 'DIEGO GOMES DIAS', estados: ["SP", "BA", "CE", "MT", "PI", "RN"] },
  { nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "MG", "SC", "ES", "MS", "PR"] },
  { nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
  { nome: 'ERALDO FRANCISCO DA SILVA JUNIOR', estados: ["SP"] },
  { nome: 'ISAI SAMPAIO MOREIRA', estados: ["SP"] },
  { nome: 'ANDRESSA EDUARDA TAVARES MATOS', estados: ["MG", "SP"] },
  { nome: 'RENATO PRINCIPE STEVANIN', estados: ["PR", "SP"] },
];

export default function HabilitacaoGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);

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
    const res = await extrairTextoDoPDFAction(formData);
    if (res.success) {
      setInputText(res.text || '');
      toast({ title: "Documento Lido" });
    } else {
      toast({ title: "Erro na Leitura", variant: "destructive" });
    }
    setFileLoading(false);
  };

  const handleExtract = async () => {
    if (!inputText || !selectedLawyer || !selectedState) {
      toast({ title: "Campos Obrigatórios", description: "Preencha todos os campos para triagem.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
    if (res.success) {
      setExtractedData(res);
      setStep(2);
      toast({ title: "Triagem Concluída" });
    } else {
      toast({ title: "Erro na IA", description: res.error, variant: "destructive" });
    }
    setLoading(false);
  };

  const updateField = (category: string, field: string, value: string) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSeal = async () => {
    setLoading(true);
    const payload = {
      vara: extractedData.processo.vara,
      comarca: extractedData.processo.comarca,
      numeroProcesso: extractedData.processo.numero,
      cliente: extractedData.cliente,
      advogado: extractedData.advogado,
      tipoAcao: extractedData.processo.acao,
      reu: { nome: extractedData.processo.banco, cnpj: extractedData.processo.cnpjBanco },
      cidadeEmissao: extractedData.processo.comarca.split('-')[0].trim(),
      dataFormatada: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    const res = await generateHabilitacaoPDFAction(payload);
    if (res.success && res.base64) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${res.base64}`;
      link.download = `Habilitacao_Procuracao_${extractedData.cliente.nome}.pdf`;
      link.click();
      toast({ title: "Documento Gerado" });
    } else {
      toast({ title: "Erro na Geração", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black overflow-hidden relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-sm">
                <FilePlus2 size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Habilitação + Procuração</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Peça Combinada</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardHeader className="bg-black text-white py-3">
                      <CardTitle className="text-[10px] font-black uppercase">1. Gabinete Técnico</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado</Label>
                          <Select value={selectedLawyer} onValueChange={(v) => { setSelectedLawyer(v); setSelectedState(''); }}>
                            <SelectTrigger className="border-2 border-black rounded-none h-12 uppercase text-[10px] font-black">
                              <SelectValue placeholder="SELECIONE..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {ADVOGADOS_BANCA.map((a) => (
                                <SelectItem key={a.nome} value={a.nome} className="font-black uppercase text-[10px]">{a.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedLawyer}>
                            <SelectTrigger className="border-2 border-black rounded-none h-12 uppercase text-[10px] font-black">
                              <SelectValue placeholder="ESTADO..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {availableStates.map((s) => (
                                <SelectItem key={s} value={s} className="font-black uppercase text-[10px]">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Label className="uppercase text-[10px] font-black">Contrato / Petição Antiga</Label>
                      <Textarea 
                        placeholder="COLE O TEXTO PARA TRIAGEM..."
                        className="min-h-[250px] border-2 border-black rounded-none font-black uppercase text-[11px]"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase text-xs rounded-none shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                        Iniciar Triagem Neural
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
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white mt-4">Arraste o documento</p>
                        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão do Gabinete</h2>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Reiniciar</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><User size={14} /> Dados do Outorgante</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
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
                        <Label className="text-[9px] font-black uppercase">Nacionalidade</Label>
                        <Input value={extractedData.cliente.nacionalidade} onChange={(e) => updateField('cliente', 'nacionalidade', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Estado Civil</Label>
                        <Input value={extractedData.cliente.estadoCivil} onChange={(e) => updateField('cliente', 'estadoCivil', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Profissão</Label>
                      <Input value={extractedData.cliente.profissao} onChange={(e) => updateField('cliente', 'profissao', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[9px] font-black uppercase">Endereço</Label>
                      <Input value={extractedData.cliente.endereco} onChange={(e) => updateField('cliente', 'endereco', e.target.value)} className="border-black font-black uppercase rounded-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">CEP</Label>
                        <Input value={extractedData.cliente.cep} onChange={(e) => updateField('cliente', 'cep', e.target.value)} className="border-black font-black rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Email</Label>
                        <Input value={extractedData.cliente.email} onChange={(e) => updateField('cliente', 'email', e.target.value)} className="border-black font-black lowercase rounded-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Building2 size={14} /> Dados do Processo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Juízo (Vara)</Label>
                        <Input value={extractedData.processo.vara} onChange={(e) => updateField('processo', 'vara', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Comarca</Label>
                        <Input value={extractedData.processo.comarca} onChange={(e) => updateField('processo', 'comarca', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Número do Processo</Label>
                        <Input value={extractedData.processo.numero} onChange={(e) => updateField('processo', 'numero', e.target.value)} className="border-black font-black uppercase rounded-none font-mono" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">Requerido (Banco)</Label>
                        <Input value={extractedData.processo.banco} onChange={(e) => updateField('processo', 'banco', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[9px] font-black uppercase">CNPJ do Requerido</Label>
                        <Input value={extractedData.processo.cnpjBanco} onChange={(e) => updateField('processo', 'cnpjBanco', e.target.value)} className="border-black font-black uppercase rounded-none" />
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white border-2 border-black font-black uppercase text-xs rounded-none shadow-[6px_6px_0px_#22c55e]">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                    Selar & Gerar PDF Combinado
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Eye size={14} /> Preview de Gabinete</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-black font-serif text-[12pt] leading-relaxed bg-white">
                  <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'serif' }}>
                    <p style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '40px' }}>
                      EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {extractedData.processo.vara.toUpperCase()} DA COMARCA DE {extractedData.processo.comarca.toUpperCase()}.
                    </p>
                    <p style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '40px' }}>Processo nº {extractedData.processo.numero}</p>
                    <p style={{ textAlign: 'justify', textIndent: '50px', marginBottom: '20px' }}>
                      <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, {extractedData.cliente.nacionalidade}, {extractedData.cliente.estadoCivil}, {extractedData.cliente.profissao}, portador da cédula de identidade RG número {extractedData.cliente.rg} e inscrito no CPF/MF sob o nº {extractedData.cliente.cpf}, residente e domiciliado na {extractedData.cliente.endereco}, CEP: {extractedData.cliente.cep}, vem, respeitosamente, à presença de Vossa Excelência...
                    </p>
                    <p style={{ textAlign: 'center', marginTop: '60px' }}>[ DOCUMENTO CONTINUA NO PDF ]</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-4 lg:gap-6 text-[8px] lg:text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
          <span className="hidden sm:inline uppercase font-black">Relatório Consolidado • DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}
