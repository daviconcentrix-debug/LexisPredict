
"use client";

import React, { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Copyright,
  Database,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { importarCSVAction } from '@/app/actions/import-actions';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ImportPage() {
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  const { isOperador } = useAdmin();
  const { toast } = useToast();

  const stats = useMemo(() => {
    return {
      total: preview.length,
      vencidos: preview.filter(c => c.status === 'Vencido').length,
      criticos: preview.filter(c => c.risco === 'Crítico').length,
      atencao: preview.filter(c => c.risco === 'Atenção').length,
      tribunais: new Set(preview.map(c => c.tribunal)).size
    };
  }, [preview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOperador) return;
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        toast({ title: "Formato Inválido", description: "Utilize apenas arquivos .csv", variant: "destructive" });
        return;
      }
      setFileToUpload(selected);
      // Geração de preview básica local
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).slice(0, 51);
        const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
        const tempCases: LegalCase[] = [];
        for(let i=1; i < lines.length; i++) {
            const currentLine = lines[i].split(',');
            const rowData: Record<string, string> = {};
            headers.forEach((h, index) => { rowData[h] = currentLine[index] || ''; });
            if(rowData['CLIENTE'] || rowData['PROTOCOLO']) tempCases.push(processarCaso(rowData));
        }
        setPreview(tempCases);
        setStep('preview');
      };
      reader.readAsText(selected);
    }
  };

  const commitToStorage = async () => {
    if (!isOperador || !fileToUpload) return;
    
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      const result = await importarCSVAction(formData);
      if (result.success) {
        toast({
          title: "Sincronia Global Concluída",
          description: result.message,
        });
        setStep('upload');
        setPreview([]);
        setFileToUpload(null);
      } else {
        toast({ title: "Falha na Gravação", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Infraestrutura", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Ingestão Estratégica</h1>
            <Badge variant="outline" className="border-primary text-primary font-black uppercase text-[10px]">Cloud Repository</Badge>
          </div>
          <div className="flex items-center gap-4">
             {step === 'preview' && (
               <Button onClick={() => setStep('upload')} variant="ghost" className="font-black uppercase text-[10px] text-foreground">Descartar</Button>
             )}
             <Button 
               disabled={step === 'upload' || parsing} 
               onClick={commitToStorage} 
               className="bg-primary text-primary-foreground font-black px-8 transition-all uppercase text-[10px] rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
              >
               {parsing ? <><Loader2 className="animate-spin mr-2" /> Gravando...</> : "Confirmar & Sincronizar"}
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {step === 'upload' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Database className="text-primary" size={32} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Migração de Gabinete</h2>
                  <p className="text-muted-foreground text-sm font-black uppercase leading-relaxed">
                    Carregue seu relatório CSV mestre. O motor LexisPredict irá calcular prazos, níveis de risco e identificar tribunais automaticamente.
                  </p>
               </div>

               <label className={cn(
                  "group border-4 border-dashed border-border rounded-none p-16 lg:p-24 flex flex-col items-center justify-center transition-all bg-card hover:bg-muted cursor-pointer relative overflow-hidden",
                  parsing && "pointer-events-none"
                )}>
                  <Upload className="text-primary w-16 h-16 mb-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-foreground font-black text-xl mb-2 uppercase">Selecionar CSV de Gabinete</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">FORMATO CSV • CODIFICAÇÃO UTF-8</p>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                   <Feature icon={<TrendingUp />} title="Prazos" desc="Cálculo automático de retorno baseado em PRÓXIMO RETORNO." />
                   <Feature icon={<AlertTriangle />} title="Análise Semântica" desc="Detecção de risco crítico em observações e situação." />
                   <Feature icon={<ShieldCheck />} title="Isolamento" desc="Os dados são isolados e protegidos por criptografia SaaS." />
                </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Stat label="Total Localizado" value={stats.total} />
                  <Stat label="Tribunais" value={stats.tribunais} />
                  <Stat label="Vencidos" value={stats.vencidos} color="text-red-500" />
                  <Stat label="Críticos (IA)" value={stats.criticos} color="text-red-600" />
                  <Stat label="Atenção" value={stats.atencao} color="text-orange-500" />
               </div>

               <div className="bg-card border-2 border-border rounded-none shadow-xl overflow-hidden">
                  <div className="bg-muted p-4 flex items-center justify-between border-b-2 border-border">
                     <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground"><Eye size={16} className="text-primary" /> Preview de Auditoria (Top 50)</h3>
                     <Badge className="bg-primary text-primary-foreground text-[10px] uppercase rounded-none">Aguardando Selo</Badge>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-20">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] text-foreground">Cliente / Protocolo</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-foreground">Status / Prazo</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-foreground">Risco Analítico</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-foreground">Escritório</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 50).map((c, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors border-border/10">
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase text-foreground">{c.cliente}</span>
                                  <span className="text-[9px] font-mono opacity-50 text-foreground">{c.protocolo}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className={cn("text-[9px] font-black uppercase", c.status === 'Vencido' && "text-red-500")}>{c.status}</span>
                                  <span className="text-[8px] font-bold opacity-40 text-foreground">{c.proximoPrazo || 'S/ Prazo'}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className={cn(
                                 "text-[8px] font-black uppercase border-2 rounded-none",
                                 c.risco === 'Crítico' ? "border-red-600 text-red-600" : c.risco === 'Atenção' ? "border-orange-500 text-orange-500" : "border-emerald-500 text-emerald-500"
                               )}>
                                 {c.risco}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] font-black uppercase opacity-60 text-foreground">
                               {c.escritorio}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
               </div>
            </div>
          )}
        </div>

        <footer className="h-10 border-t border-border bg-card flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2"><Copyright size={10} /> 2026 W1 Capital.</div>
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value, color = "text-foreground" }: any) {
  return (
    <div className="bg-card border-2 border-border p-4 shadow-sm">
       <p className="text-[9px] font-black opacity-40 uppercase mb-1 tracking-widest text-foreground">{label}</p>
       <p className={cn("text-2xl font-black uppercase", color)}>{value}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="bg-card border-2 border-border p-6 space-y-3">
       <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center border border-primary/20">{icon}</div>
       <h4 className="font-black text-xs uppercase text-foreground">{title}</h4>
       <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">{desc}</p>
    </div>
  );
}
