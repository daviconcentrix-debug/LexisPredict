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
  MapPin,
  User,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { extrairTextoDoPDFAction, generateProcuracaoPDFAction } from '@/app/actions/document-actions';
import { extrairDadosDocumentosAction } from '@/app/actions/document-extraction';

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
        toast({ title: "Documento Transcrevido" });
      }
    } finally {
      setFileLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText || inputText.length < 30) {
      toast({ title: "Texto insuficiente", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await extrairDadosDocumentosAction(inputText);
      const normalized = {
        cliente: {
          nome: res.outorgante?.nome || "CLIENTE NÃO IDENTIFICADO",
          cpf: res.outorgante?.cpf || "",
          rg: res.outorgante?.rg || "",
          endereco: res.outorgante?.endereco || "",
          email: res.outorgante?.email || "",
          estadoCivil: res.outorgante?.estado_civil || "solteiro(a)",
          profissao: res.outorgante?.profissao || "autônomo(a)",
          nacionalidade: res.outorgante?.nacionalidade || "brasileiro(a)",
          telefone: ""
        },
        processos: [{
          banco: res.instituicao_financeira || "BANCO",
          numero: res.processo_numero || "S/N",
          acao: res.poderes_especificos || "AÇÃO DE REVISÃO CONTRATUAL"
        }],
        dataExtenso: `${res.cidade || 'São Paulo'}, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`
      };
      setExtractedData(normalized);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    setLoading(true);
    try {
      const lawyerInfo = BANCA_DATA[selectedLawyer] || BANCA_DATA["DIEGO GOMES DIAS"];
      const payload = {
        ...extractedData,
        advogado: {
          nome: selectedLawyer,
          oab: lawyerInfo.oabs[selectedState] || lawyerInfo.oabs['SP'],
          endereco: lawyerInfo.endereco,
          email: lawyerInfo.email
        },
        local: extractedData.dataExtenso.split(',')[0].trim() || selectedState
      };
      const res = await generateProcuracaoPDFAction(payload);
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Procuracao_${extractedData.cliente.nome}.pdf`;
        link.click();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <h1 className="font-black text-xl uppercase tracking-tighter">Gerador de Procuração Grok Beta</h1>
          <Badge variant="outline" className="border-black border-2 text-black font-black uppercase text-[10px]">Triagem Soberana</Badge>
        </header>
        <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">
          {step === 1 ? (
            <div className="space-y-6">
              <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">Configuração de Gabinete</CardTitle></CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Advogado Responsável</Label>
                    <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
                      <SelectTrigger className="border-2 border-black rounded-none h-11"><SelectValue placeholder="SELECIONE..." /></SelectTrigger>
                      <SelectContent className="bg-white border-2 border-black">{ADVOGADOS_LIST.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black">Estado (UF)</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="border-2 border-black rounded-none h-11"><SelectValue placeholder="SP" /></SelectTrigger>
                      <SelectContent className="bg-white border-2 border-black">{["SP", "RJ", "MG", "BA", "PR", "SC", "RS", "GO", "MT", "MS"].map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                   <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Textarea value={inputText} onChange={e => setInputText(e.target.value)} className="min-h-[350px] border-2 border-black rounded-none bg-white font-black uppercase text-[11px]" placeholder="COLE O CONTRATO OU PROCURAÇÃO AQUI..." />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />} Iniciar Triagem Grok Beta
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black group transition-all bg-white shadow-[8px_8px_0px_#000]">
                    {fileLoading ? <Loader2 className="animate-spin" size={32} /> : <FileUp size={48} className="text-black/20 group-hover:text-white mb-4" />}
                    <p className="text-[10px] font-black uppercase group-hover:text-white">Transcrever PDF</p>
                    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <h2 className="text-xl font-black uppercase">Revisão Forense</h2>
                <Button variant="ghost" onClick={() => setStep(1)} className="border-2 border-black rounded-none uppercase text-[10px] font-black">Voltar</Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-2"><CardTitle className="text-[10px] font-black uppercase">Outorgante</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Input value={extractedData.cliente.nome} onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value.toUpperCase()}})} className="border-black font-black uppercase" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input value={extractedData.cliente.cpf} placeholder="CPF" onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, cpf: e.target.value}})} className="border-black font-black" />
                      <Input value={extractedData.cliente.rg} placeholder="RG" onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, rg: e.target.value}})} className="border-black font-black" />
                    </div>
                    <Input value={extractedData.cliente.endereco} placeholder="ENDEREÇO" onChange={e => setExtractedData({...extractedData, cliente: {...extractedData.cliente, endereco: e.target.value.toUpperCase()}})} className="border-black font-black uppercase" />
                  </CardContent>
                </Card>
                <div className="space-y-6">
                   <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                      <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-2"><CardTitle className="text-[10px] font-black uppercase">Processo & Banco</CardTitle></CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <Input value={extractedData.processos[0].banco} onChange={e => { const p = [...extractedData.processos]; p[0].banco = e.target.value.toUpperCase(); setExtractedData({...extractedData, processos: p}); }} className="border-black font-black uppercase" />
                        <Input value={extractedData.processos[0].numero} onChange={e => { const p = [...extractedData.processos]; p[0].numero = e.target.value; setExtractedData({...extractedData, processos: p}); }} className="border-black font-black" />
                        <Input value={extractedData.dataExtenso} onChange={e => setExtractedData({...extractedData, dataExtenso: e.target.value})} className="border-black font-black uppercase" />
                      </CardContent>
                   </Card>
                   <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none border-2 border-black shadow-[6px_6px_0px_#22c55e]">Selar & Exportar PDF</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
