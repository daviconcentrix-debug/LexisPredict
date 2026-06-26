
"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  FileSpreadsheet, 
  X,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { syncRepoCases, fetchRepoCases } from '@/app/actions/case-actions';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const { isOperador, isAdmin } = useAdmin();
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOperador) return;
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseFile(selected);
    }
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setProgress(0);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      
      if (lines.length < 2) {
        toast({ title: "Arquivo Inválido", description: "O CSV parece estar vazio.", variant: "destructive" });
        setParsing(false);
        return;
      }

      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().toUpperCase());
      
      const parsedCases: LegalCase[] = [];
      const total = lines.length - 1;

      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(separator);
        const rowData: Record<string, string> = {};
        headers.forEach((h, index) => {
          rowData[h] = currentLine[index] ? currentLine[index].trim() : '';
        });
        
        parsedCases.push(processarCaso(rowData));
        
        if (i % 20 === 0 || i === total) {
          setProgress(Math.round((i / total) * 100));
          await new Promise(r => setTimeout(r, 10));
        }
      }

      setPreview(parsedCases);
      setParsing(false);
    };
    reader.readAsText(file);
  };

  const commitToStorage = async () => {
    if (!isOperador) return;
    
    try {
      const existing = await fetchRepoCases();
      const existingArray = Array.isArray(existing) ? existing : [];
      
      const caseMap = new Map();
      existingArray.forEach(c => caseMap.set(c.protocolo, c));
      preview.forEach(c => caseMap.set(c.protocolo, c));
      
      const combined = Array.from(caseMap.values());
      const result = await syncRepoCases(combined);
      
      if (result.success) {
        toast({
          title: "Base Sincronizada",
          description: `${preview.length} processos atualizados no Cloud CRM.`,
        });
        setFile(null);
        setPreview([]);
      } else {
        toast({ title: "Falha na Sincronia", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro de Nuvem", description: "Não foi possível conectar ao banco.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f2f2] font-sans text-black">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#dddbda] bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xl text-black uppercase hover:bg-black hover:text-white px-2 py-1 transition-all rounded-sm cursor-default">Migração de Dados</h1>
            <Badge variant="outline" className="border-black text-black font-black uppercase text-[10px]">Cloud Active</Badge>
          </div>
          {preview.length > 0 && isOperador && (
            <Button onClick={commitToStorage} className="bg-white text-black border border-black hover:bg-black hover:text-white font-black px-6 transition-all uppercase text-xs">
              Confirmar & Sincronizar Nuvem
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="text-center space-y-2 group hover:bg-black p-4 rounded-sm border border-transparent hover:border-black transition-all cursor-default">
              <h2 className="text-2xl font-black text-black group-hover:text-white uppercase tracking-tight transition-colors">Ingestão de Dados Jurídicos</h2>
              <p className="text-black/60 group-hover:text-white/60 max-w-xl mx-auto text-sm font-black uppercase transition-colors">
                Carregue arquivos CSV para sincronizar processos entre todas as máquinas. Duplicatas são mescladas pelo número de protocolo.
              </p>
            </div>

            {!file ? (
              <label className={cn(
                "group border-2 border-dashed border-black rounded-sm p-16 flex flex-col items-center justify-center transition-all bg-white hover:bg-black cursor-pointer"
              )}>
                <div className="p-6 bg-[#f3f2f2] rounded-sm mb-6 group-hover:bg-white transition-all">
                  <Upload className="text-black w-12 h-12" />
                </div>
                <h3 className="text-black group-hover:text-white font-black text-lg mb-1 uppercase">Selecionar Planilha Jurídica</h3>
                <p className="text-sm text-black/60 group-hover:text-white/40 font-black uppercase">Formato: CSV (UTF-8)</p>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="bg-white border border-black rounded-sm p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#f3f2f2] rounded-sm border border-black">
                      <FileSpreadsheet className="text-black" />
                    </div>
                    <div>
                      <p className="font-black text-black uppercase">{file.name}</p>
                      <p className="text-[10px] text-black/40 font-black uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { setFile(null); setPreview([]); }} className="text-black hover:bg-black hover:text-white">
                    <X size={20} />
                  </Button>
                </div>

                {parsing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-black uppercase">
                      <span>Analisando Estruturas...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-[#f3f2f2] [&>div]:bg-black" />
                  </div>
                )}

                {preview.length > 0 && !parsing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#f3f2f2] rounded-sm border border-black group hover:bg-black transition-all cursor-default">
                        <p className="text-[10px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest mb-1">Processos</p>
                        <p className="text-xl font-black text-black group-hover:text-white">{preview.length}</p>
                      </div>
                      <div className="p-4 bg-[#f3f2f2] rounded-sm border border-black group hover:bg-black transition-all cursor-default">
                        <p className="text-[10px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest mb-1">Tribunais</p>
                        <p className="text-xl font-black text-black group-hover:text-white">{new Set(preview.map(p => p.tribunal)).size}</p>
                      </div>
                      <div className="p-4 bg-[#f3f2f2] rounded-sm border border-black group hover:bg-red-600 transition-all cursor-default">
                        <p className="text-[10px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest mb-1">Críticos</p>
                        <p className="text-xl font-black text-black group-hover:text-white">{preview.filter(p => p.status === 'Vencido').length}</p>
                      </div>
                      <div className="p-4 bg-[#f3f2f2] rounded-sm border border-black group hover:bg-green-600 transition-all cursor-default">
                        <p className="text-[10px] font-black text-black/40 group-hover:text-white/40 uppercase tracking-widest mb-1">Saudáveis</p>
                        <p className="text-xl font-black text-black group-hover:text-white">{preview.filter(p => p.status === 'No Prazo').length}</p>
                      </div>
                    </div>

                    <div className="bg-[#f3f2f2] rounded-sm p-4 max-h-64 overflow-auto space-y-2 border border-black">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest sticky top-0 bg-[#f3f2f2] pb-2 border-b border-black/10">Prévia de Lote</p>
                      {preview.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-black/10 last:border-0 hover:bg-black group px-2 transition-all cursor-default">
                          <span className="text-xs text-black group-hover:text-white font-black uppercase transition-colors">{c.cliente}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[9px] text-black border-black group-hover:bg-white group-hover:text-black font-black uppercase transition-all">{c.tribunal}</Badge>
                            <span className="text-[9px] font-mono text-black/40 group-hover:text-white/40 font-bold uppercase transition-colors">{c.protocolo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
