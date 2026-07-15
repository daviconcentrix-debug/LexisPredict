'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import {
  FileText,
  Loader2,
  Edit3,
  Upload,
  FileUp,
  CheckCircle2,
  User,
  Building2,
  Info,
  AlertCircle
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extrairTextoDoPDFAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "SC", "ES", "MS", "MG", "PR"] },
  { id: 'ingrid', nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', estados: ["BA", "CE", "MT", "PI", "RN", "SP"] },
  { id: 'lucas', nome: 'LUCAS DOS SANTOS DE JESUS', estados: ["DF", "AL", "AM", "PE", "RJ", "SP"] },
  { id: 'leticia', nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
  { id: 'eraldo', nome: 'ERALDO FRANCISCO DA SILVA JUNIOR', estados: ["SP"] },
  { id: 'isai', nome: 'ISAI SAMPAIO MOREIRA', estados: ["SP"] },
  { id: 'gilberto', nome: 'GILBERTO BONFIM CAVALCANTI FILHO', estados: ["SP"] },
];

export default function HabilitacaoProcuracaoPage() {
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
      toast({ title: "Dados Insuficientes", description: "Insira o texto para triagem.", variant: "destructive" });
      return;
    }
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", description: "Selecione o advogado e o estado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setApiError(null);

    // Simulação de extração (substitua pela action real depois)
    setTimeout(() => {
      const mockData = {
        cliente: {
          nome: "EBERT RONALD LEME",
          cpf: "300.483.608-48",
          rg: "26130466",
          endereco: "Rua Maranhão, 489, Casa 13, Jardim Bela Vista, Jaguariúna - SP, CEP 13911-414"
        },
        processo: {
          numero: "1003224-40.2025.8.26.0296",
          acao: "AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA",
          reu: "BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A."
        },
        advogado: {
          nome: selectedLawyer,
          oab: "370.898/SP"
        },
        vara: "02ª VARA CÍVEL",
        comarca: "JAGUARIUNA - SP"
      };

      setExtractedData(mockData);
      setStep(2);
      setLoading(false);
      toast({ title: "Triagem Concluída" });
    }, 1200);
  };

  const handleSeal = () => {
    alert("Função de geração do PDF ainda não implementada. Vamos criar na próxima etapa.");
    // Aqui você vai chamar uma action para gerar o PDF (ex: generateHabilitacaoPDFAction)
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
              {apiError && (
                <Alert variant="destructive" className="border-2 border-red-600 bg-red-50 rounded-none">
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
                          <Select value={selectedLawyer} onValueChange={(val) => { setSelectedLawyer(val); setSelectedState(''); }}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[11px] rounded-none">
                              <SelectValue placeholder="SELECIONE..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {ADVOGADOS_BANCA.map((adv) => (
                                <SelectItem key={adv.id} value={adv.nome} className="font-black uppercase text-[10px]">{adv.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedLawyer}>
                            <SelectTrigger className="border-2 border-black h-12 font-black uppercase text-[11px] rounded-none">
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
                      <Label className="uppercase text-[10px] font-black">2. Contrato / Petição Antiga</Label>
                      <Textarea
                        placeholder="COLE O TEXTO DO CONTRATO OU PETIÇÃO ANTIGA..."
                        className="min-h-[280px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <FileText size={16} className="mr-2" />}
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
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all">
                        {fileLoading ? <Loader2 className="animate-spin text-black" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white">Arraste a petição antiga</p>
                        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {step === 2 && extractedData && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <Edit3 size={20} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Revisão de Dados Extraídos</h2>
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><User size={14} /> Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-[9px] font-black uppercase">Nome Completo</Label>
                    <p className="font-black uppercase">{extractedData.cliente.nome}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[9px] font-black uppercase">CPF</Label>
                      <p className="font-black">{extractedData.cliente.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-[9px] font-black uppercase">RG</Label>
                      <p className="font-black">{extractedData.cliente.rg}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Gerar Habilitação + Procuração
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
