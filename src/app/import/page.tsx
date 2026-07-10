
"use client";

import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  FileSpreadsheet, 
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Database,
  ArrowRight,
  ShieldCheck,
  Copyright
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
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [stats, setStats] = useState({ total: 0, critical: 0, tribunals: 0 });

  const { isOperador } = useAdmin();
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOperador) return;
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        toast({ title: "Formato Inválido", description: "Utilize apenas arquivos .csv", variant: "destructive" });
        return;
      }
      setFile(selected);
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

        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i].split(separator);
          const rowData: Record<string, string> = {};
          headers.forEach((h, index) => {
            rowData[h] = currentLine[index] ? currentLine[index].trim() : '';
          });
          
          const processed = processarCaso(rowData);
          parsedCases.push(processed);
          
          if (i % 50 === 0 || i === totalRows) {
            setProgress(Math.round((i / totalRows) * 100));
            // Pequeno delay para garantir que o React renderize o progresso
            await new Promise(r => setTimeout(r, 1));
          }
        }

        setPreview(parsedCases);
        setStats({
          total: parsedCases.length,
          critical: parsedCases.filter(c => c.status === 'Vencido').length,
          tribunals: new Set(parsedCases.map(c => c.tribunal)).size
        });
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
      const existing = await fetchRepoCases();
      const existingArray = Array.isArray(existing) ? existing : [];
      
      // Fusão Inteligente: Protege registros existentes, prioriza importação nova
      const caseMap = new Map();
      existingArray.forEach(c => caseMap.set(c.protocolo, c));
      preview.forEach(c => caseMap.set(c.protocolo, c));
      
      const combined = Array.from(caseMap.values());
      const result = await syncRepoCases(combined);
      
      if (result.success) {
        toast({
          title: "Sincronia Global Concluída",
          description: `${preview.length} registros foram injetados no Cloud CRM.`,
        });
        resetImport();
      } else {
        toast({ title: "Falha na Gravação", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Infraestrutura", description: "Falha ao conectar com o servidor.", variant: "destructive" });
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview([]);
    setStep('upload');
    setProgress(0);
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="icon-3d-wrapper">
              <div className="icon-3d-block black w-10 h-10 rounded-none border-2 border-black flex items-center justify-center p-1">
                 <FileSpreadsheet className="text-white w-5 h-5" />
              </div>
            </div>
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Ingestão de Dados v900.0</h1>
            <Badge variant="outline" className="border-black text-black font-black uppercase text-[10px]">Cloud Repository</Badge>
          </div>
          <div className="flex items-center gap-4">
             {step === 'preview' && (
               <Button onClick={resetImport} variant="ghost" className="font-black uppercase text-[10px] hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-black rounded-none">Descartar</Button>
             )}
             <Button 
               disabled={step === 'upload' || parsing} 
               onClick={commitToStorage} 
               className="bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black px-8 transition-all uppercase text-[10px] rounded-none shadow-[4px_4px_0px_#000] hover:shadow-none"
              >
               Confirmar & Sincronizar
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          {step === 'upload' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="text-center space-y-4 mb-12">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Motor de Migração SaaS</h2>
                  <p className="text-black/60 max-w-2xl mx-auto text-sm font-black uppercase leading-relaxed">
                    Carregue seu relatório CSV. O sistema realizará a triagem automática de tribunais, calculará prazos e preparará os dados para o monitoramento em nuvem.
                  </p>
               </div>

               <label className={cn(
                  "group border-4 border-dashed border-black/10 rounded-none p-24 flex flex-col items-center justify-center transition-all bg-white hover:bg-black hover:border-white cursor-pointer relative overflow-hidden shadow-xl",
                  parsing && "pointer-events-none"
                )}>
                  {parsing ? (
                    <div className="space-y-6 w-full max-w-md text-center">
                       <p className="font-black text-black group-hover:text-white uppercase text-sm animate-pulse">Lendo Estruturas Neurais...</p>
                       <Progress value={progress} className="h-3 bg-gray-100 border-2 border-black [&>div]:bg-black group-hover:border-white group-hover:[&>div]:bg-white" />
                       <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white/40">{progress}% PROCESSADO</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-8 bg-[#f3f2f2] rounded-none mb-6 group-hover:bg-white transition-all border-2 border-black">
                        <Upload className="text-black w-16 h-16" />
                      </div>
                      <h3 className="text-black group-hover:text-white font-black text-xl mb-2 uppercase">Selecionar Planilha de Gabinete</h3>
                      <p className="text-xs text-black/40 group-hover:text-white/40 font-black uppercase tracking-widest">FORMATO CSV • CODIFICAÇÃO UTF-8</p>
                    </>
                  )}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                   <FeatureBox icon={<ShieldCheck size={20}/>} title="Tenant Isolation" desc="Seus dados são criptografados e isolados por ID de Empresa." />
                   <FeatureBox icon={<Database size={20}/>} title="Deduplicação" desc="Processos com o mesmo protocolo são mesclados automaticamente." />
                   <FeatureBox icon={<AlertCircle size={20}/>} title="Validação Forense" desc="O sistema detecta erros de formatação no CNJ em tempo real." />
                </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatItem label="Total de Registros" value={stats.total} />
                  <StatItem label="Tribunais Únicos" value={stats.tribunals} />
                  <StatItem label="Alertas Críticos" value={stats.critical} color="text-red-600" />
                  <StatItem label="Integridade" value="100%" color="text-green-600" />
               </div>

               <div className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                  <div className="bg-black text-white p-4 flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Eye size={16} /> Preview de Ingestão (Lote {stats.total})</h3>
                     <Badge variant="outline" className="text-white border-white font-black text-[9px] uppercase">Aguardando Confirmação</Badge>
                  </div>
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="bg-[#f8f9fb] border-b-2 border-black sticky top-0 z-20">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-black uppercase text-[10px] text-black">Cliente / Protocolo</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-black">Tribunal</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-black">Status / Prazo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 50).map((c, i) => (
                          <TableRow key={i} className="hover:bg-black group transition-colors">
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase group-hover:text-white">{c.cliente}</span>
                                  <span className="text-[9px] font-mono text-black/40 group-hover:text-white/40">{c.protocolo}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="border-black border-2 font-black text-[8px] uppercase group-hover:bg-white group-hover:text-black">{c.tribunal}</Badge>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className={cn("text-[9px] font-black uppercase", c.status === 'Vencido' ? "text-red-600 group-hover:text-red-400" : "group-hover:text-white")}>{c.status}</span>
                                  <span className="text-[8px] font-bold text-black/40 group-hover:text-white/40">{c.proximoPrazo || 'S/ Prazo'}</span>
                               </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {preview.length > 50 && (
                      <div className="p-4 text-center border-t-2 border-black bg-gray-50 italic text-[10px] font-black uppercase">
                        Exibindo apenas os primeiros 50 registros de {stats.total}.
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital.
          </div>
          <span className="w-1 h-1 bg-black rounded-full opacity-30" />
          <span className="uppercase">Relatório Consolidado • DAVI ALVES FIGUEREDO</span>
        </footer>
      </main>
    </div>
  );
}

function StatItem({ label, value, color = "text-black" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000]">
       <p className="text-[9px] font-black text-black/40 uppercase mb-1 tracking-widest">{label}</p>
       <p className={cn("text-2xl font-black uppercase", color)}>{value}</p>
    </div>
  );
}

function FeatureBox({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white/50 border-2 border-dashed border-black/10 p-6 space-y-3 hover:border-black transition-all">
       <div className="w-10 h-10 bg-black text-white flex items-center justify-center">{icon}</div>
       <h4 className="font-black text-xs uppercase">{title}</h4>
       <p className="text-[10px] font-bold text-black/40 uppercase leading-relaxed">{desc}</p>
    </div>
  );
}
