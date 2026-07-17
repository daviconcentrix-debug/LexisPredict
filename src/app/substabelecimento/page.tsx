
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

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
  User, 
  Repeat, 
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
  SelectValue 
} from "@/components/ui/select";
import { extrairTextoDoPDFAction, generateSubstabelecimentoPDFAction } from '@/app/actions/document-actions';
import { extrairDadosSoberanosAction } from '@/app/actions/transcription-actions';

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
  }
};

const ADVOGADOS_LIST = Object.keys(BANCA_DATA);

export default function SubstabelecimentoGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
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
        toast({ title: "Transcrição Concluída", description: "O conteúdo do PDF está pronto para triagem." });
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
    if (!inputText || inputText.length < 10) {
      toast({ title: "Dados Insuficientes", description: "Insira o texto ou transcreva um PDF.", variant: "destructive" });
      return;
    }
    if (!advLeaving || !advEntering) {
      toast({ title: "Configuração Pendente", description: "Selecione ambos os advogados.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosSoberanosAction(inputText);
      if (res.success) {
        const leavingInfo = BANCA_DATA[advLeaving];
        const enteringInfo = BANCA_DATA[advEntering];

        const finalData = {
          cliente: {
            nome: res.outorgante.nome,
          },
          processo: {
            acao: res.poderes_especificos,
            numero: "S/N"
          },
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
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Substabelecimento_${extractedData.cliente.nome.replace(/\s/g, '_')}.pdf`;
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
              <div className="icon-3d-block black w-10 h-10 rounded-sm bg-primary flex items-center justify-center">
                <Repeat size={20} className="text-white" />
              </div>
            </div>
            <h1 className="font-bold text-sm tracking-[0.2em] uppercase text-black">Gerador Universal de Substabelecimentos</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Transcrição Livre</Badge>
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
                    <CardContent className="p-6 space-y-6 text-black">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Advogado Substabelecente (Sai)</Label>
                          <Select value={advLeaving} onValueChange={setAdvLeaving}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none bg-white">
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
                          <Label className="uppercase text-[10px] font-black">Advogado Substabelecido (Entra)</Label>
                          <Select value={advEntering} onValueChange={setAdvEntering}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none bg-white">
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
                          <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[10px] rounded-none bg-white">
                            <SelectValue placeholder="SP" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-black rounded-none">
                            {["SP", "MG", "RJ", "PR", "SC", "RS", "BA", "CE", "MT", "GO", "DF", "TO", "RN", "PE", "PA", "AM", "AC", "RO", "AP", "RR", "SE", "PI", "MA", "PB", "AL", "ES", "MS"].map((uf) => (
                              <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black text-black">2. Conteúdo do PDF ou Texto</Label>
                      <Textarea 
                        placeholder="COLE O TEXTO DO DOCUMENTO PARA EXTRAÇÃO AUTOMÁTICA..."
                        className="min-h-[250px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none bg-white text-black"
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
                      <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-black"><Upload size={14} /> Importar Qualquer PDF</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Selecione o PDF para transcrever</p>
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
                  <h2 className="text-xl font-black uppercase tracking-tight text-black">Revisão Forense</h2>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none text-black">Voltar ao Upload</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black"><User size={14} /> Dados da Transmissão</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 text-black">
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
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black"><Building2 size={14} /> Dados do Processo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 text-black">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Cliente Outorgante</Label>
                        <Input value={extractedData.cliente.nome} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Tipo de Ação</Label>
                        <Input value={extractedData.processo.acao} onChange={(e) => setExtractedData({...extractedData, processo: {...extractedData.processo, acao: e.target.value}})} className="border-black font-black uppercase rounded-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Número do Processo (CNJ)</Label>
                        <Input value={extractedData.processo.numero} onChange={(e) => setExtractedData({...extractedData, processo: {...extractedData.processo, numero: e.target.value}})} className="border-black font-black uppercase rounded-none font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Cidade / Comarca</Label>
                          <Input value={extractedData.comarca} onChange={(e) => setExtractedData({...extractedData, comarca: e.target.value})} className="border-black font-black uppercase rounded-none" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Data Extenso</Label>
                          <Input value={extractedData.dataExtenso} onChange={(e) => setExtractedData({...extractedData, dataExtenso: e.target.value})} className="border-black font-black uppercase rounded-none" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* PREVISÃO VISUAL DO DOCUMENTO */}
              <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-black"><Eye size={14} /> Visualização do Documento</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase">Preview</Badge>
                </CardHeader>
                <CardContent className="p-12 text-black font-serif text-[12pt] leading-relaxed bg-white">
                  <h1 className="text-center font-bold text-lg mb-8 uppercase tracking-widest">Substabelecimento</h1>
                  <p className="text-center font-bold text-md mb-16">(sem reserva de poderes)</p>

                  <p className="text-justify mb-16 indent-12">
                    O <strong>{extractedData.substabelecente.nome.toUpperCase()}</strong>, brasileiro, {extractedData.substabelecente.estadoCivil}, advogado, inscrito na <strong>{extractedData.substabelecente.oabCompleta}</strong>, <strong>SUBSTABELECE SEM RESERVA DE PODERES</strong> na pessoa do <strong>{extractedData.substabelecido.nome.toUpperCase()}</strong>, inscrito na <strong>{extractedData.substabelecido.oabCompleta}</strong>, os poderes conferidos por <strong>{extractedData.cliente.nome.toUpperCase()}</strong>, <strong>PARA A PROMOÇÃO DE {extractedData.processo.acao.toUpperCase()}</strong>, processo de n.º <strong>{extractedData.processo.numero}</strong> por meio do instrumento outrora outorgado, requerendo a exclusão do advogado substabelecente <strong>{extractedData.substabelecente.nome.toUpperCase()}</strong> sob <strong>{extractedData.substabelecente.oabCurta}</strong> da contracapa dos autos, bem como de qualquer outro meio de intimação do processo, sendo assim que <strong>todas as futuras intimações passsem a ser exclusivamente dirigidas ao substabelecido</strong>, <strong>{extractedData.substabelecido.nome.toUpperCase()}</strong> sob <strong>{extractedData.substabelecido.oabCurta}</strong>, nos termos do artigo 272, §5º, do CPC, sob pena de nulidade.
                  </p>

                  <div className="text-center mb-24 mt-16">
                    <p>{extractedData.comarca}, {extractedData.dataExtenso}</p>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-16">
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full border-t border-black mb-2"></div>
                      <p className="font-bold uppercase">{extractedData.substabelecente.nome}</p>
                      <p className="font-bold">{extractedData.substabelecente.oabCurta}</p>
                    </div>
                    <div className="w-1/2 flex flex-col items-center">
                      <div className="w-full border-t border-black mb-2"></div>
                      <p className="font-bold uppercase">{extractedData.substabelecido.nome}</p>
                      <p className="font-bold">{extractedData.substabelecido.oabCurta}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Selar & Exportar Substabelecimento
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
