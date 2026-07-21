/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved.
 */
"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  User, 
  Eye,
  MapPin,
  Briefcase,
  Users,
  Fingerprint,
  Calendar,
  Hash,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateHabilitacaoPecaPDFAction } from '@/app/actions/document-actions';
import { listAdvogadosBanca } from '@/lib/server-db';
import Link from 'next/link';

export default function HabilitacaoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [banca, setBanca] = useState<any[]>([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [includeBankInfo, setIncludeBankInfo] = useState(true);
  const [includeProcessNumber, setIncludeProcessNumber] = useState(true);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const data = await listAdvogadosBanca();
      setBanca(data);
      if (data.length > 0) {
        setSelectedLawyerId(data[0].id);
        setSelectedState(Object.keys(data[0].oabs || {})[0] || 'SP');
      }
    }
    load();
  }, []);

  const selectedLawyer = banca.find(a => a.id === selectedLawyerId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await extrairTextoDoPDFAction(formData);
      if (res.success) setInputText(res.text || '');
    } finally {
      setFileLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!inputText || !selectedLawyer) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, selectedLawyer.nome, selectedState);
      if (res.success) {
        const data = res as any;
        const oabNum = String(selectedLawyer.oabs[selectedState] || '').split('/')[0];

        setExtractedData({
          vara: "02ª VARA CÍVEL",
          comarca: `${selectedState === 'SP' ? 'SÃO PAULO' : 'COMARCA LOCAL'} - ${selectedState}`,
          numeroProcesso: data.processos?.[0]?.numero || "S/N",
          cliente: {
            ...data.cliente,
            nacionalidade: data.cliente.nacionalidade || "brasileiro(a)",
            estadoCivil: data.cliente.estadoCivil || "casado(a)",
            profissao: data.cliente.profissao || "autônomo(a)"
          },
          advogado: {
            nome: selectedLawyer.nome.toUpperCase(),
            oab: oabNum,
            endereco: selectedLawyer.endereco,
            email: selectedLawyer.email,
            cep: "03870-100"
          },
          tipoAcao: data.processos?.[0]?.acao || "AÇÃO REVISIONAL",
          reuNome: data.processos?.[0]?.banco || "BANCO",
          reuCnpj: data.processos?.[0]?.cnpjBanco || "",
          cidadeEmissao: selectedState === 'SP' ? 'SÃO PAULO' : 'COMARCA LOCAL',
          dataFormatada: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
          selectedState
        });
        setStep(2);
      } else {
        setApiError(res.error || "Falha na triagem.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    if (!extractedData) return;
    setLoading(true);
    try {
      const res = await generateHabilitacaoPecaPDFAction({ ...extractedData, includeBankInfo, includeProcessNumber });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Habilitacao_${extractedData.cliente.nome}.pdf`;
        link.click();
        toast({ title: "Documento Selado" });
      }
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
            <div className="w-10 h-10 rounded-sm bg-black flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <h1 className="font-black text-xl text-black uppercase tracking-tighter">Habilitação + Procuração</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {banca.length === 0 ? (
            <Alert className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
               <Settings className="h-4 w-4" />
               <AlertTitle className="font-black uppercase text-xs">Atenção Gabinete</AlertTitle>
               <AlertDescription className="text-[10px] font-bold uppercase space-y-4">
                  <p>Cadastre advogados em Configurações para habilitar este módulo.</p>
                  <Button asChild className="bg-black text-white rounded-none h-10 font-black uppercase text-[9px]"><Link href="/settings">Configurar Banca</Link></Button>
               </AlertDescription>
            </Alert>
          ) : step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
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
                          <Select value={selectedLawyerId} onValueChange={(val) => {
                             setSelectedLawyerId(val);
                             const adv = banca.find(a => a.id === val);
                             if (adv) setSelectedState(Object.keys(adv.oabs || {})[0] || 'SP');
                          }}>
                            <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {banca.map(adv => <SelectItem key={adv.id} value={adv.id} className="font-black uppercase text-[10px]">{adv.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black">Estado (OAB)</Label>
                          <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="border-2 border-black h-12 rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">
                              {selectedLawyer && Object.keys(selectedLawyer.oabs || {}).map(uf => <SelectItem key={uf} value={uf} className="font-black uppercase text-[10px]">{uf}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                    <CardContent className="p-6 space-y-4">
                      <Label className="uppercase text-[10px] font-black">2. Texto do Documento</Label>
                      <Textarea placeholder="COLE O TEXTO AQUI..." className="min-h-[300px] border-2 border-black rounded-none" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                      <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />} Extrair & Iniciar
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {step === 2 && extractedData && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
              <div className="flex items-center justify-between border-b-2 border-black pb-4">
                <h2 className="text-xl font-black uppercase tracking-tight">Revisão Forense Combinada</h2>
                <Button variant="ghost" onClick={() => setStep(1)} className="font-black uppercase text-[10px] border-2 border-black rounded-none">Voltar</Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3"><CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><User size={14} /> Outorgante</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-1"><Label className="text-[9px] font-black uppercase">Nome Completo</Label><Input value={extractedData.cliente.nome} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})} className="border-black font-black uppercase rounded-none" /></div>
                  </CardContent>
                </Card>
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                    <CardHeader className="bg-[#f8f9fb] border-b-2 border-black py-3 flex flex-row items-center justify-between"><CardTitle className="text-[10px] font-black uppercase flex items-center gap-2"><Building2 size={14} /> Juízo & Banco</CardTitle></CardHeader>
                    <CardContent className="p-6 space-y-4">
                       <div className="grid gap-1"><Label className="text-[9px] font-black uppercase">Instituição Financeira</Label><Input value={extractedData.reuNome} onChange={(e) => setExtractedData({...extractedData, reuNome: e.target.value})} className="border-black font-black uppercase rounded-none" /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-1"><Label className="text-[9px] font-black uppercase">Processo (CNJ)</Label><Input value={extractedData.numeroProcesso} onChange={(e) => setExtractedData({...extractedData, numeroProcesso: e.target.value})} className="border-black font-black uppercase rounded-none font-mono" /></div>
                          <div className="grid gap-1"><Label className="text-[9px] font-black uppercase">Vara Cível</Label><Input value={extractedData.vara} onChange={(e) => setExtractedData({...extractedData, vara: e.target.value})} className="border-black font-black uppercase rounded-none" /></div>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />} Selar & Exportar Habilitação
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
