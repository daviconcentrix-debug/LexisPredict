"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Copyright,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Database
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { syncRepoCases, fetchRepoCases } from '@/app/actions/case-actions';
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
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOperador) return;
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        toast({ title: "Formato Inválido", description: "Utilize apenas arquivos .csv", variant: "destructive" });
        return;
      }
      parseFile(selected);
    }
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setProgress(0);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        if (lines.length < 2) {
          toast({ title: "Arquivo Vazio", description: "O CSV não contém registros.", variant: "destructive" });
          setParsing(false);
          return;
        }

        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(separator).map(h => h.trim().toUpperCase());
        
        const parsedCases: LegalCase[] = [];
        const totalRows = lines.length - 1;

        for (let i = 1; i <= totalRows; i++) {
          const currentLine = lines[i].split(separator);
          const rowData: Record<string, string> = {};
          headers.forEach((h, index) => {
            rowData[h] = currentLine[index] ? currentLine[index].trim() : '';
          });
          
          parsedCases.push(processarCaso(rowData));
          
          if (i % 50 === 0 || i === totalRows) {
            setProgress(Math.round((i / totalRows) * 100));
            await new Promise(r => setTimeout(r, 1));
          }
        }

        setPreview(parsedCases);
        setStep('preview');
        setParsing(false);
      } catch (err) {
        toast({ title: "Falha no Parsing", description: "Verifique se o CSV está em UTF-8.", variant: "destructive" });
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const commitToStorage = async () => {
    if (!isOperador || preview.length === 0) return;
    
    try {
      const result = await syncRepoCases(preview);
      if (result.success) {
        toast({
          title: "Sincronia Global Concluída",
          description: `${preview.length} registros injetados no Cloud CRM.`,
        });
        setStep('upload');
        setPreview([]);
      } else {
        toast({ title: "Falha na Gravação", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Infraestrutura", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-foreground uppercase tracking-tight">Ingestão Estratégica</h1>
            <Badge variant="outline" className="border-primary text-primary font-black uppercase text-[10px]">Cloud Repository</Badge>
          </div>
          <div className="flex items-center gap-4">
             {step === 'preview' && (
               <Button onClick={() => setStep('upload')} variant="ghost" className="font-black uppercase text-[10px]">Descartar</Button>
             )}
             <Button 
               disabled={step === 'upload' || parsing} 
               onClick={commitToStorage} 
               className="bg-primary text-primary-foreground font-black px-8 transition-all uppercase text-[10px] rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
              >
               Confirmar & Sincronizar
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">
          {step === 'upload' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Database className="text-primary" size={32} />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Migração de Gabinete</h2>
                  <p className="text-muted-foreground text-sm font-black uppercase leading-relaxed">
                    Carregue seu relatório CSV mestre. O motor LexisPredict irá calcular prazos, níveis de risco e identificar tribunais automaticamente.
                  </p>
               </div>

               <label className={cn(
                  "group border-4 border-dashed border-border rounded-none p-24 flex flex-col items-center justify-center transition-all bg-card hover:bg-muted cursor-pointer relative overflow-hidden",
                  parsing && "pointer-events-none"
                )}>
                  {parsing ? (
                    <div className="space-y-6 w-full max-w-md text-center">
                       <p className="font-black text-foreground uppercase text-sm animate-pulse">Auditando Estruturas Neurais...</p>
                       <Progress value={progress} className="h-2 bg-muted [&>div]:bg-primary" />
                       <p className="text-[10px] font-black uppercase opacity-40">{progress}% PROCESSADO</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="text-primary w-16 h-16 mb-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <h3 className="text-foreground font-black text-xl mb-2 uppercase">Selecionar CSV de Gabinete</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">FORMATO CSV • CODIFICAÇÃO UTF-8</p>
                    </>
                  )}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <Feature icon={<TrendingUp />} title="Prazos" desc="Cálculo automático de retorno baseado em PRÓXIMO RETORNO." />
                   <Feature icon={<AlertTriangle />} title="Análise Semântica" desc="Detecção de risco crítico em observações e situação." />
                   <Feature icon={<ShieldCheck />} title="Isolamento" desc="Os dados são isolados e protegidos por criptografia SaaS." />
                </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Stat label="Total" value={stats.total} />
                  <Stat label="Tribunais" value={stats.tribunais} />
                  <Stat label="Vencidos" value={stats.vencidos} color="text-red-500" />
                  <Stat label="Críticos" value={stats.criticos} color="text-red-600" />
                  <Stat label="Atenção" value={stats.atencao} color="text-orange-500" />
               </div>

               <div className="bg-card border-2 border-border rounded-none shadow-xl overflow-hidden">
                  <div className="bg-muted p-4 flex items-center justify-between border-b-2 border-border">
                     <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Eye size={16} className="text-primary" /> Preview de Auditoria (Lote {stats.total})</h3>
                     <Badge className="bg-primary text-primary-foreground text-[10px] uppercase">Aguardando Selo</Badge>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-20">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px]">Cliente / Protocolo</TableHead>
                          <TableHead className="font-black uppercase text-[10px]">Status / Prazo</TableHead>
                          <TableHead className="font-black uppercase text-[10px]">Risco</TableHead>
                          <TableHead className="font-black uppercase text-[10px]">Escritório</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 50).map((c, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase">{c.cliente}</span>
                                  <span className="text-[9px] font-mono opacity-50">{c.protocolo}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className={cn("text-[9px] font-black uppercase", c.status === 'Vencido' && "text-red-500")}>{c.status}</span>
                                  <span className="text-[8px] font-bold opacity-40">{c.proximoPrazo || 'S/ Prazo'}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className={cn(
                                 "text-[8px] font-black uppercase border-2",
                                 c.risco === 'Crítico' ? "border-red-600 text-red-600" : c.risco === 'Atenção' ? "border-orange-500 text-orange-500" : "border-emerald-500 text-emerald-500"
                               )}>
                                 {c.risco}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] font-black uppercase opacity-60">
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
       <p className="text-[9px] font-black opacity-40 uppercase mb-1 tracking-widest">{label}</p>
       <p className={cn("text-2xl font-black uppercase", color)}>{value}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="bg-card border-2 border-border p-6 space-y-3">
       <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
       <h4 className="font-black text-xs uppercase">{title}</h4>
       <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">{desc}</p>
    </div>
  );
}
