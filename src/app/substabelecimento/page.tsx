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
  MapPin, 
  User, 
  Repeat, 
  Eye,
  Fingerprint,
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
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generateSubstabelecimentoPDFAction } from '@/app/actions/document-actions';
import { listAdvogadosBanca } from '@/lib/server-db';
import Link from 'next/link';

export default function SubstabelecimentoGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [banca, setBanca] = useState<any[]>([]);
  const [advLeavingId, setAdvLeavingId] = useState('');
  const [advEnteringId, setAdvEnteringId] = useState('');
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
        setAdvLeavingId(data[0].id);
        setAdvEnteringId(data[0].id);
        setSelectedState(Object.keys(data[0].oabs || {})[0] || 'SP');
      }
    }
    load();
  }, []);

  const advLeaving = banca.find(a => a.id === advLeavingId);
  const advEntering = banca.find(a => a.id === advEnteringId);

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
    if (!inputText || !advLeaving || !advEntering) return;
    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, advEntering.nome, selectedState);
      if (res.success) {
        setExtractedData({
          cliente: res.cliente,
          processo: res.processos[0] || { banco: 'INSTITUIÇÃO', numero: 'S/N', acao: 'REVISIONAL', cnpjBanco: '' },
          substabelecente: {
            nome: advLeaving.nome,
            estadoCivil: advLeaving.genero === 'F' ? 'casada' : 'casado',
            oabCompleta: `OAB/${selectedState} sob o n.º ${advLeaving.oabs[selectedState] || ''}`,
            oabCurta: `OAB/${selectedState} ${advLeaving.oabs[selectedState] || ''}`
          },
          substabelecido: {
            nome: advEntering.nome,
            oabCompleta: `OAB/${selectedState} sob o n.º ${advEntering.oabs[selectedState] || ''}`,
            oabCurta: `OAB/${selectedState} ${advEntering.oabs[selectedState] || ''}`
          },
          comarca: selectedState === 'SP' ? 'São Paulo' : 'Comarca Local',
          dataExtenso: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    if (!extractedData) return;
    setLoading(true);
    try {
      const res = await generateSubstabelecimentoPDFAction({ ...extractedData, includeBankInfo, includeProcessNumber });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Substabelecimento_${extractedData.cliente.nome.replace(/\s/g, '_')}.pdf`;
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
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center"><Repeat size={20} className="text-white" /></div>
              <h1 className="font-bold text-sm tracking-[0.2em] uppercase text-black">Substabelecimento</h1>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
           {banca.length === 0 ? (
             <Alert className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                <Settings className="h-4 w-4" />
                <AlertTitle className="font-black uppercase text-xs">Banca Vazia</AlertTitle>
                <AlertDescription className="text-[10px] font-bold uppercase"><Button asChild className="bg-black text-white rounded-none mt-2"><Link href="/settings">Configurar Advogados</Link></Button></AlertDescription>
             </Alert>
           ) : step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">Configuração</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="uppercase text-[10px] font-black">Cedente (Sai)</Label>
                           <Select value={advLeavingId} onValueChange={setAdvLeavingId}>
                              <SelectTrigger className="border-2 border-black rounded-none"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border-2 border-black rounded-none">
                                 {banca.map(a => <SelectItem key={a.id} value={a.id} className="font-black uppercase text-[10px]">{a.nome}</SelectItem>)}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="uppercase text-[10px] font-black">Cessionário (Entra)</Label>
                           <Select value={advEnteringId} onValueChange={setAdvEnteringId}>
                              <SelectTrigger className="border-2 border-black rounded-none"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white border-2 border-black rounded-none">
                                 {banca.map(a => <SelectItem key={a.id} value={a.id} className="font-black uppercase text-[10px]">{a.nome}</SelectItem>)}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black">Estado OAB</Label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                           <SelectTrigger className="border-2 border-black rounded-none"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-white border-2 border-black rounded-none">
                              {advEntering && Object.keys(advEntering.oabs || {}).map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>
                  </CardContent>
               </Card>
               <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                  <CardContent className="p-6 space-y-4">
                     <Textarea placeholder="COLE O TEXTO DO DOCUMENTO..." className="min-h-[250px] border-2 border-black rounded-none" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                     <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none shadow-[6px_6px_0px_#22c55e]">
                        {loading ? <Loader2 className="animate-spin" /> : <Repeat size={16} className="mr-2" />} Gerar Draft
                     </Button>
                  </CardContent>
               </Card>
            </div>
           )}

           {step === 2 && extractedData && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
               <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                  <CardContent className="p-6 space-y-4">
                     <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Cedente</Label><Input value={extractedData.substabelecente.nome} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" /></div>
                     <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Cessionário</Label><Input value={extractedData.substabelecido.nome} readOnly className="border-black font-black uppercase rounded-none bg-gray-50" /></div>
                     <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Cliente</Label><Input value={extractedData.cliente.nome} onChange={(e) => setExtractedData({...extractedData, cliente: {...extractedData.cliente, nome: e.target.value}})} className="border-black font-black uppercase rounded-none" /></div>
                  </CardContent>
               </Card>
               <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none shadow-[6px_6px_0px_#22c55e]">
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />} Selar PDF
               </Button>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
