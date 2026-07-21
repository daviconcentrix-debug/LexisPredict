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
  Repeat, 
  Info, 
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extrairTextoDoPDFAction, extrairDadosProcuracaoAction, generatePecaSubstabelecimentoPDFAction } from '@/app/actions/document-actions';
import { listAdvogadosBanca } from '@/lib/server-db';
import Link from 'next/link';

export default function SubstabelecimentoPecaGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [banca, setBanca] = useState<any[]>([]);
  const [advLeavingId, setAdvLeavingId] = useState('');
  const [advEnteringId, setAdvEnteringId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
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

  const handleExtract = async () => {
    if (!inputText || !advLeaving || !advEntering) return;
    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, advEntering.nome, selectedState);
      if (res.success) {
        const oabLeavingNum = String(advLeaving.oabs[selectedState] || '').split('/')[0];
        const oabEnteringNum = String(advEntering.oabs[selectedState] || '').split('/')[0];

        setExtractedData({
          advogadoSubstabelecente: advLeaving.nome,
          estadoCivilSubstabelecente: advLeaving.genero === 'F' ? 'casada' : 'casado',
          oabSubstabelecente: `OAB/${selectedState} sob o n.º ${oabLeavingNum}`,
          oabSubstabelecenteCurta: `OAB/${selectedState} ${oabLeavingNum}`,
          advogadoSubstabelecido: advEntering.nome,
          oabSubstabelecido: `OAB/${selectedState} sob o n.º ${oabEnteringNum}`,
          oabSubstabelecidoCurta: `OAB/${selectedState} ${oabEnteringNum}`,
          clienteNome: (res as any).cliente?.nome || "CLIENTE",
          tipoAcao: (res as any).processos?.[0]?.acao || "AÇÃO REVISIONAL",
          reuNome: (res as any).processos?.[0]?.banco || "BANCO",
          reuCnpj: (res as any).processos?.[0]?.cnpjBanco || "",
          numeroProcesso: (res as any).processos?.[0]?.numero || "S/N",
          cidadeComarca: selectedState === 'SP' ? 'São Paulo' : 'Comarca Local',
          dataFormatada: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
          selectedState
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
      const res = await generatePecaSubstabelecimentoPDFAction({ ...extractedData, includeBankInfo, includeProcessNumber });
      if (res.success && res.base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${res.base64}`;
        link.download = `Peça_Subst_${extractedData.clienteNome}.pdf`;
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
              <div className="w-10 h-10 rounded-sm bg-black flex items-center justify-center"><Repeat size={20} className="text-white" /></div>
              <h1 className="font-black text-xl text-black uppercase tracking-tighter">Peça de Substabelecimento</h1>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
           {banca.length === 0 ? (
             <Alert className="border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                <Settings className="h-4 w-4" />
                <AlertTitle className="font-black uppercase text-xs">Configuração Requerida</AlertTitle>
                <AlertDescription className="text-[10px] font-bold uppercase">
                  <p>Cadastre advogados em Configurações para habilitar este módulo.</p>
                  <Button asChild className="bg-black text-white rounded-none mt-2 h-10 font-black uppercase text-[9px]">
                    <Link href="/settings">Configurar Banca</Link>
                  </Button>
                </AlertDescription>
             </Alert>
           ) : step === 1 && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                  <CardHeader className="bg-black text-white py-3"><CardTitle className="text-[10px] font-black uppercase">Gabinete Banca</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="uppercase text-[10px] font-black">Cedente (Sai)</Label>
                          <Select value={advLeavingId} onValueChange={setAdvLeavingId}>
                            <SelectTrigger className="border-black rounded-none h-11"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">{banca.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label className="uppercase text-[10px] font-black">Cessionário (Entra)</Label>
                          <Select value={advEnteringId} onValueChange={setAdvEnteringId}>
                            <SelectTrigger className="border-black rounded-none h-11"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white border-2 border-black rounded-none">{banca.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                     </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
                  <CardContent className="p-6 space-y-4">
                     <Textarea placeholder="TEXTO DA PROCURAÇÃO ANTIGA..." className="min-h-[300px] border-2 border-black rounded-none" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                     <Button onClick={handleExtract} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none">Gerar Peça Forense</Button>
                  </CardContent>
                </Card>
             </div>
           )}

           {step === 2 && extractedData && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
                <Card className="bg-white border-2 border-black rounded-none shadow-[6px_6px_0px_#000]">
                   <CardContent className="p-6 space-y-6">
                      <div className="grid gap-4">
                         <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Advogado Cedente</Label><Input value={extractedData.advogadoSubstabelecente} readOnly className="border-black font-black rounded-none bg-gray-50" /></div>
                         <div className="space-y-2"><Label className="text-[9px] font-black uppercase">Advogado Cessionário</Label><Input value={extractedData.advogadoSubstabelecido} readOnly className="border-black font-black rounded-none bg-gray-50" /></div>
                      </div>
                   </CardContent>
                </Card>
                <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none shadow-[6px_6px_0px_#22c55e]">Selar & Exportar</Button>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
