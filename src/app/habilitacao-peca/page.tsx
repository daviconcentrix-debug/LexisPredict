"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { FileText, Loader2, CheckCircle2, Shield, Info, Edit3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateHabilitacaoPecaPDFAction } from '@/app/actions/document-actions';

export default function HabilitacaoPecaGenerator() {
  const [loading, setLoading] = useState(false);
  const [vara, setVara] = useState("02ª VARA CÍVEL");
  const [comarca, setComarca] = useState("JAGUARIUNA - SP");
  const [numeroProcesso, setNumeroProcesso] = useState("1003224-40.2025.8.26.0296");
  
  const [cliente, setCliente] = useState({
    nome: "EBERT RONALD LEME",
    nacionalidade: "brasileiro",
    estadoCivil: "casado",
    profissao: "empresário",
    rg: "26130466",
    cpf: "300.483.608-48",
    endereco: "Rua: Maranhão, número: 489, Casa 13, Jardim Bela Vista, Jaguariúna - SP",
    cep: "13911-414",
    email: "ebertrl@hotmail.com"
  });

  const [advogado, setAdvogado] = useState({
    nome: "DIEGO GOMES DIAS",
    oab: "370.898",
    endereco: "Av. São Miguel, nº 4810, Ponte Rasa, São Paulo-SP",
    cep: "03870-100",
    email: "lucenadiasadvogados@gmail.com"
  });

  const [tipoAcao, setTipoAcao] = useState("AÇÃO DE REVISÃO CONTRATUAL COM PEDIDO DE TUTELA DE URGÊNCIA");
  const [reuNome, setReuNome] = useState("BANCO AYMORÉ CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.");
  const [reuCnpj, setReuCnpj] = useState("07.707.650/0001-10");
  const [cidadeEmissao, setCidadeEmissao] = useState("São Paulo");

  const { toast } = useToast();

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
            <h1 className="font-black text-xl uppercase">Habilitação + Procuração</h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
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
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
            Gerar Peça de Habilitação
          </Button>
        </div>
      </main>
    </div>
  );
}
