"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileText, Loader2, CheckCircle2, Shield, Info, Edit3, Zap, Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateHabilitacaoPecaPDFAction, extrairTextoDoPDFAction, extrairDadosProcuracaoAction } from '@/app/actions/document-actions';

const ADVOGADOS_BANCA = [
  { id: 'pablo', nome: 'PABLO MATHEUS SILVA BASTOS PEREIRA', estados: ["SP", "RN", "PI", "MT", "CE", "BA", "SC", "ES", "MS", "MG", "PR"] },
  { id: 'ingrid', nome: 'INGRID MICHAELLY TELES PACHECO OLIVEIRA ALVES', estados: ["MA", "RO", "AP", "SE", "RR", "GO", "SP"] },
  { id: 'diego', nome: 'DIEGO GOMES DIAS', estados: ["BA", "CE", "MT", "PI", "RN", "SP"] },
  { id: 'lucas', nome: 'LUCAS DOS SANTOS DE JESUS', estados: ["DF", "AL", "AM", "PE", "RJ", "SP"] },
  { id: 'leticia', nome: 'LETICIA ALVES GODOY DA CRUZ', estados: ["TO", "AC", "RS", "PB", "PA", "SP"] },
];

export default function HabilitacaoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vara, setVara] = useState("02ª VARA CÍVEL");
  const [comarca, setComarca] = useState("SÃO PAULO - SP");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  
  const [cliente, setCliente] = useState({
    nome: "",
    nacionalidade: "brasileiro(a)",
    estadoCivil: "casado(a)",
    profissao: "autônomo(a)",
    rg: "",
    cpf: "",
    endereco: "",
    cep: "",
    email: "",
    genero: "M"
  });

  const [advogado, setAdvogado] = useState({
    nome: "",
    oab: "",
    endereco: "",
    cep: "",
    email: ""
  });

  const [tipoAcao, setTipoAcao] = useState("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
  const [reuNome, setReuNome] = useState("INSTITUIÇÃO FINANCEIRA");
  const [reuCnpj, setReuCnpj] = useState("");
  const [cidadeEmissao, setCidadeEmissao] = useState("São Paulo");

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
        toast({ title: "Contrato Transcrevido" });
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
      toast({ title: "Dados Insuficientes", variant: "destructive" });
      return;
    }
    if (!selectedLawyer || !selectedState) {
      toast({ title: "Configuração Pendente", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer, selectedState);
      if (res.success) {
        setCliente({
          nome: res.cliente.nome,
          nacionalidade: "brasileiro(a)",
          estadoCivil: res.cliente.estadoCivil,
          profissao: res.cliente.profissao,
          rg: res.cliente.rg,
          cpf: res.cliente.cpf,
          endereco: res.cliente.endereco,
          cep: res.cliente.cep || "",
          email: res.cliente.email,
          genero: res.cliente.genero || "M"
        });
        setAdvogado({
          nome: res.advogado.nome,
          oab: res.advogado.oab,
          endereco: res.advogado.endereco,
          cep: "",
          email: res.advogado.email
        });
        if (res.processos && res.processos.length > 0) {
          setNumeroProcesso(res.processos[0].numero);
          setReuNome(res.processos[0].banco);
          setTipoAcao(res.processos[0].acao);
          setComarca(`${res.processos[0].estado} - ${res.processos[0].estado}`);
        }
        setStep(2);
        toast({ title: "Triagem Neural Concluída" });
      } else {
        toast({ title: "Erro na IA", description: res.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro Crítico", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      const res = await generateHabilitacaoPecaPDFAction({
        vara, comarca, numeroProcesso, cliente, advogado, 
        tipoAcao, reuNome, reuCnpj, cidadeEmissao, dataFormatada
      });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Habilitacao_${cliente.nome}.pdf`;
        link.click();
        toast({ title: "Habilitação Selada" });
      }
    } catch (e) {
      toast({ title: "Erro na geração", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Shield size={20} />
            <h1 className="font-black text-xl uppercase tracking-tighter">Habilitação + Procuração</h1>
          </div>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Elite Node</Badge>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                 <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">1. Configuração de Gabinete</CardTitle></CardHeader>
                 <CardContent className="p-6 grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black">Advogado</Label>
                     <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                       <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue placeholder="SELECIONE..." /></SelectTrigger>
                       <SelectContent className="bg-white border-2 border-black rounded-none">
                         {ADVOGADOS_BANCA.map(a => <SelectItem key={a.id} value={a.nome} className="font-black uppercase text-[10px]">{a.nome}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black">Estado</Label>
                     <Select value={selectedState} onValueChange={setSelectedState}>
                       <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue placeholder="UF..." /></SelectTrigger>
                       <SelectContent className="bg-white border-2 border-black rounded-none">
                         {["SP", "RJ", "MG", "PR", "BA", "CE", "RN", "PE", "PA"].map(uf => <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                 </CardContent>
               </Card>

               <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                 <CardContent className="p-6 space-y-4">
                   <Label className="uppercase text-[10px] font-black">2. Triagem de Contrato (PDF/Texto)</Label>
                   <Textarea 
                     placeholder="COLE O TEXTO DO CONTRATO OU USE O UPLOAD ABAIXO..."
                     className="min-h-[250px] border-2 border-black font-black uppercase text-[11px] rounded-none"
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                   <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-black group transition-all">
                      {fileLoading ? <Loader2 className="animate-spin text-black" size={24} /> : <FileUp size={32} className="text-black/20 group-hover:text-white mb-2" />}
                      <p className="text-[9px] font-black uppercase text-black/40 group-hover:text-white">Carregar PDF do Contrato</p>
                      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                   </div>
                   <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                     {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                     Extrair Dados Processuais
                   </Button>
                 </CardContent>
               </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                 <h2 className="text-xl font-black uppercase tracking-tight">Revisão Forense</h2>
                 <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                <CardHeader className="bg-black text-white py-3">
                  <CardTitle className="text-[10px] uppercase font-black">Dados do Juízo e Processo</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Vara</Label><Input value={vara} onChange={e => setVara(e.target.value)} className="border-black rounded-none font-black uppercase" /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Comarca</Label><Input value={comarca} onChange={e => setComarca(e.target.value)} className="border-black rounded-none font-black uppercase" /></div>
                  <div className="col-span-2 space-y-1"><Label className="text-[9px] font-black uppercase">Número do Processo</Label><Input value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)} className="border-black rounded-none font-black" /></div>
                </CardContent>
              </Card>

              <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                <CardHeader className="bg-black text-white py-3">
                  <CardTitle className="text-[10px] uppercase font-black">Dados do Outorgante (Cliente)</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Nome</Label><Input value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} className="border-black rounded-none font-black uppercase" /></div>
                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase">CPF</Label><Input value={cliente.cpf} onChange={e => setCliente({...cliente, cpf: e.target.value})} className="border-black rounded-none font-black" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase">Endereço</Label><Input value={cliente.endereco} onChange={e => setCliente({...cliente, endereco: e.target.value})} className="border-black rounded-none font-black uppercase" /></div>
                </CardContent>
              </Card>

              <Button onClick={handleGenerate} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                Gerar Peça de Habilitação
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
