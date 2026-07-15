"use client";
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */

import React, { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Edit3, Loader2, Repeat, CheckCircle2, Eye, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { extrairDadosProcuracaoAction, generatePecaSubstabelecimentoPDFAction } from '@/app/actions/document-actions';

export default function PecaSubstabelecimento() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const [advLeaving, setAdvLeaving] = useState("DR. ERALDO FRANCISCO DA SILVA JUNIOR");
  const [advEntering, setAdvEntering] = useState("DR. DIEGO GOMES DIAS");
  const [extractedData, setExtractedData] = useState<any>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const res = await extrairDadosProcuracaoAction(inputText, advEntering, 'SP');
      setExtractedData({
        advogadoSubstabelecente: advLeaving,
        estadoCivilSubstabelecente: "casado",
        oabSubstabelecente: "OAB/SP sob o n.º 327.677",
        oabSubstabelecenteCurta: "OAB/SP 327.677",
        advogadoSubstabelecido: advEntering,
        oabSubstabelecido: "OAB/SP sob o n.º 370.898",
        oabSubstabelecidoCurta: "OAB/SP 370.898",
        clienteNome: res.cliente.nome,
        tipoAcao: res.processos[0].acao,
        numeroProcesso: res.processos[0].numero,
        cidadeComarca: "São Paulo",
        dataFormatada: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
      });
      setStep(2);
    } finally { setLoading(false); }
  };

  const handleSeal = async () => {
    setLoading(true);
    const res = await generatePecaSubstabelecimentoPDFAction(extractedData);
    if (res.success && res.base64) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${res.base64}`;
      link.download = `Peca_Substabelecimento_${extractedData.clienteNome}.pdf`;
      link.click();
      toast({ title: "PDF Gerado" });
    }
    setLoading(false);
  };

  const styles = {
    container: { maxWidth: '850px', margin: '20px auto', padding: '40px', backgroundColor: '#fff', color: '#000', fontFamily: 'serif', fontSize: '11pt', lineHeight: '1.6', border: '1px solid #eee' },
    title: { textAlign: 'center' as const, fontWeight: 'bold', fontSize: '13pt', marginBottom: '5px' },
    subtitle: { textAlign: 'center' as const, fontWeight: 'bold', marginBottom: '40px' },
    paragraph: { textAlign: 'justify' as const, textIndent: '60px', marginBottom: '40px' },
    bold: { fontWeight: 'bold' }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-white flex items-center px-8 justify-between">
          <h1 className="font-black uppercase text-xl">Peça de Substabelecimento</h1>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {step === 1 ? (
            <Card className="max-w-3xl mx-auto border-2 border-black rounded-none shadow-[8px_8px_0px_#000]">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">Substabelecente</Label>
                    <Input value={advLeaving} onChange={(e) => setAdvLeaving(e.target.value)} className="border-black rounded-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px]">Substabelecido</Label>
                    <Input value={advEntering} onChange={(e) => setAdvEntering(e.target.value)} className="border-black rounded-none" />
                  </div>
                </div>
                <Textarea placeholder="Cole o contrato aqui..." className="min-h-[200px] border-black rounded-none" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                <Button onClick={handleExtract} disabled={loading} className="w-full h-12 bg-black text-white font-black uppercase text-xs rounded-none">
                  {loading ? <Loader2 className="animate-spin" /> : <Repeat size={16} className="mr-2" />} Extrair e Preparar Peça
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div style={styles.container}>
                <div style={styles.title}>SUBSTABELECIMENTO</div>
                <div style={styles.subtitle}>(sem reserva de poderes)</div>
                <p style={styles.paragraph}>
                  O <span style={styles.bold}>{extractedData.advogadoSubstabelecente}</span>, brasileiro, {extractedData.estadoCivilSubstabelecente}, advogado, inscrito na <span style={styles.bold}>{extractedData.oabSubstabelecente}</span>, <span style={styles.bold}>SUBSTABELECE SEM RESERVA DE PODERES</span> na pessoa do <span style={styles.bold}>{extractedData.advogadoSubstabelecido}</span>, inscrito na <span style={styles.bold}>{extractedData.oabSubstabelecido}</span>, os poderes conferidos por <span style={styles.bold}>{extractedData.clienteNome}</span>, <span style={styles.bold}>PARA A PROMOÇÃO DE {extractedData.tipoAcao}</span>, processo de n.º <span style={styles.bold}>{extractedData.numeroProcesso}</span>...
                </p>
                <div className="text-center mt-12">{extractedData.cidadeComarca}, {extractedData.dataFormatada}</div>
              </div>
              <Button onClick={handleSeal} disabled={loading} className="w-full h-14 bg-black text-white font-black uppercase rounded-none border-2 border-black shadow-[6px_6px_0px_#22c55e]">
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2" />} Selar e Exportar PDF
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
