
"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  Database, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Loader2,
  Copyright,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { syncRepoCases } from '@/app/actions/case-actions';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Função de auxílio para fazer o parse correto de uma linha CSV 
 * lidando com campos entre aspas que podem conter vírgulas.
 */
function parseCsvRow(row: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportPage() {
  const [parsing, setParsing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [textInput, setTextInput] = useState('');
  const [stats, setStats] =统计({ total: 0, critical: 0, tribunals: 0 });

  const { isOperador } = useAdmin();
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        await processRawText(text);
      } catch (err) {
        toast({ title: "Falha no Parsing", variant: "destructive" });
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = async () => {
    if (!textInput.trim()) return;
    setParsing(true);
    await processRawText(textInput);
  };

  const processRawText = async (text: string) => {
    // Detecta o separador mais comum (ponto e vírgula ou vírgula)
    const separator = text.includes(';') ? ';' : ',';
    
    // Divide por quebras de linha respeitando possíveis quebras dentro de aspas
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;
    for (const char of text) {
      if (char === '"') inQuotes = !inQuotes;
      if (char === '\n' && !inQuotes) {
        lines.push(currentLine.replace(/\r$/, ''));
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine) lines.push(currentLine.replace(/\r$/, ''));

    const filteredLines = lines.filter(l => l.trim().length > 0);
    
    if (filteredLines.length < 1) {
      toast({ title: "Entrada Vazia", variant: "destructive" });
      setParsing(false);
      return;
    }

    const parsedCases: LegalCase[] = [];
    const totalRows = filteredLines.length;
    
    // Parsing dos headers usando o row parser robusto
    const rawHeaders = parseCsvRow(filteredLines[0], separator);

    for (let i = 1; i < filteredLines.length; i++) {
      let rowData: any = {};
      const fields = parseCsvRow(filteredLines[i], separator);
      
      rawHeaders.forEach((h, index) => {
        rowData[h] = fields[index] || '';
      });

      if (Object.keys(rowData).length > 0) {
        try {
          const processed = processarCaso(rowData);
          parsedCases.push(processed);
        } catch (e) {
          console.warn(`Erro ao processar linha ${i}:`, e);
        }
      }
      
      if (i % 50 === 0) {
        setProgress(Math.round((i / totalRows) * 100));
        await new Promise(r => setTimeout(r, 1));
      }
    }

    setPreview(parsedCases);
    setStats({
      total: parsedCases.length,
      critical: parsedCases.filter(c => c.risco === 'Crítico').length,
      tribunals: new Set(parsedCases.map(c => c.tribunal)).size
    });
    setStep('preview');
    setParsing(false);
  };

  const commitToStorage = async () => {
    if (!isOperador) {
       toast({ title: "Acesso Negado", description: "Permissão insuficiente.", variant: "destructive" });
       return;
    }
    if (preview.length === 0) return;

    setSyncing(true);
    try {
      const result = await syncRepoCases(preview);
      if (result.success) {
        toast({ title: "Sincronia Concluída", description: `${preview.length} registros atualizados.` });
        setPreview([]);
        setStep('upload');
      } else {
        toast({ title: "Falha na Gravação", description: result.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro de Infraestrutura", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const resetImport = () => {
    setTextInput('');
    setPreview([]);
    setStep('upload');
    setProgress(0);
    setSyncing(false);
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black relative z-10">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Ingestão de Dados</h1>
            <Badge variant="outline" className="border-black text-black font-black uppercase text-[10px]">Cloud Repository</Badge>
          </div>
          <div className="flex items-center gap-4">
             {step === 'preview' && (
               <Button onClick={resetImport} variant="ghost" disabled={syncing} className="font-black uppercase text-[10px] hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-black rounded-none">Descartar</Button>
             )}
             <Button 
               disabled={step === 'upload' || parsing || syncing} 
               onClick={commitToStorage} 
               className="bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black px-8 transition-all uppercase text-[10px] rounded-none shadow-[4px_4px_0px_#000] hover:shadow-none"
              >
               {syncing ? <><Loader2 className="animate-spin mr-2" /> Gravando...</> : "Confirmar & Sincronizar"}
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
          {step === 'upload' ? (
            <Tabs defaultValue="text" className="space-y-8 animate-in fade-in duration-500">
               <div className="text-center space-y-4 mb-8">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Unidade de Migração Elite</h2>
                  <p className="text-black/60 max-w-2xl mx-auto text-sm font-black uppercase leading-relaxed">
                    Carregue seu dump de banco ou cole o texto do CSV. O sistema detectará automaticamente o formato e corrigirá erros de codificação e datas.
                  </p>
               </div>

               <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-none p-1 border-2 border-black shadow-[4px_4px_0px_#000]">
                  <TabsTrigger value="text" className="rounded-none font-black uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-white">Texto de Gabinete / Dump</TabsTrigger>
                  <TabsTrigger value="csv" className="rounded-none font-black uppercase text-xs data-[state=active]:bg-black data-[state=active]:text-white">Planilha CSV</TabsTrigger>
               </TabsList>

               <TabsContent value="text" className="space-y-4">
                  <Textarea 
                    placeholder="COLE O CONTEÚDO AQUI (DUMP OU CSV)..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="min-h-[350px] border-2 border-black font-black uppercase text-[11px] rounded-none resize-none leading-relaxed bg-white shadow-inner"
                    disabled={parsing}
                  />
                  <Button 
                    onClick={handleTextImport} 
                    disabled={parsing || !textInput.trim()}
                    className="w-full h-14 bg-black text-white font-black uppercase text-xs rounded-none border-2 border-black hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_#22c55e]"
                  >
                    {parsing ? <><Zap className="animate-spin mr-2" /> Analisando Estruturas...</> : <><Database size={16} className="mr-2" /> Processar Texto de Gabinete</>}
                  </Button>
               </TabsContent>

               <TabsContent value="csv">
                  <label className={cn(
                    "group border-4 border-dashed border-black/10 rounded-none p-24 flex flex-col items-center justify-center transition-all bg-white hover:bg-black hover:border-white cursor-pointer relative overflow-hidden shadow-xl",
                    parsing && "pointer-events-none"
                  )}>
                    {parsing ? (
                      <div className="space-y-6 w-full max-w-md text-center">
                        <p className="font-black text-black group-hover:text-white uppercase text-sm animate-pulse">Lendo Fluxo Neural...</p>
                        <Progress value={progress} className="h-3 bg-gray-100 border-2 border-black [&>div]:bg-black group-hover:border-white group-hover:[&>div]:bg-white" />
                        <p className="text-[10px] font-black uppercase text-black/40 group-hover:text-white/40">{progress}% PROCESSADO</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-8 bg-[#f3f2f2] rounded-none mb-6 group-hover:bg-white transition-all border-2 border-black shadow-[6px_6px_0px_#000]">
                          <Upload className="text-black w-16 h-16" />
                        </div>
                        <h3 className="text-black group-hover:text-white font-black text-xl mb-2 uppercase">Selecionar CSV</h3>
                        <p className="text-xs text-black/40 group-hover:text-white/40 font-black uppercase tracking-widest text-center">CORREÇÃO DE ENCODING E DATAS ATIVA</p>
                      </>
                    )}
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
               </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatItem label="Total Detectado" value={stats.total} />
                  <StatItem label="Tribunais Únicos" value={stats.tribunals} />
                  <StatItem label="Alertas Críticos" value={stats.critical} color="text-red-600" />
                  <StatItem label="Status Dados" value="SANEADOS" color="text-green-600" />
               </div>

               <div className="bg-white border-2 border-black rounded-none shadow-[8px_8px_0px_#000] overflow-hidden">
                  <div className="bg-black text-white p-4 flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Eye size={16} /> Preview de Higiene (Lote {stats.total})</h3>
                     <Badge variant="outline" className="text-white border-white font-black text-[9px] uppercase">Isolamento por Operador Ativo</Badge>
                  </div>
                  <div className="max-h-[500px] overflow-auto bg-[#fafafa]">
                    <Table>
                      <TableHeader className="bg-[#f8f9fb] border-b-2 border-black sticky top-0 z-20">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-black uppercase text-[10px] text-black">Cliente / Protocolo</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-black">Tribunal</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-black">Status / Prazo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 100).map((c, i) => (
                          <TableRow key={i} className="hover:bg-black group transition-colors cursor-default">
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase group-hover:text-white transition-colors">{c.cliente}</span>
                                  <span className="text-[9px] font-mono text-black/40 group-hover:text-white/40">{c.protocolo}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="border-black border-2 font-black text-[8px] uppercase group-hover:bg-white group-hover:text-black transition-all">{c.tribunal}</Badge>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col">
                                  <span className={cn("text-[9px] font-black uppercase", c.risco === 'Crítico' ? "text-red-600 group-hover:text-red-400" : "group-hover:text-white")}>{c.status}</span>
                                  <span className="text-[8px] font-bold text-black/40 group-hover:text-white/40">{c.proximoPrazo || 'S/ Prazo'}</span>
                               </div>
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

        <footer className="h-10 border-t border-[#dddbda] bg-white flex items-center justify-center gap-6 text-[10px] text-black/60 font-black uppercase tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-2">
            <Copyright size={10} /> 2026 W1 Capital.
          </div>
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
