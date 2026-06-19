
"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Scale
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { syncRepoCases } from '@/app/actions/case-actions';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<LegalCase[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const stored = localStorage.getItem('lexisPredict_cases');
    const existing: LegalCase[] = stored ? JSON.parse(stored) : [];
    
    const combined = [...existing, ...preview];
    
    // 1. Save to LocalStorage
    localStorage.setItem('lexisPredict_cases', JSON.stringify(combined));
    
    // 2. Save to Server Repository (GitHub Sync)
    await syncRepoCases(combined);
    
    toast({
      title: "Sucesso!",
      description: `${preview.length} processos foram migrados para a base local e sincronizados com o repositório.`,
    });
    
    setFile(null);
    setPreview([]);
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="font-headline font-bold text-xl text-white">Migration Tool</h1>
          {preview.length > 0 && (
            <Button onClick={commitToStorage} className="bg-primary hover:bg-primary/90 font-bold px-6">
              Commit to Repo Storage
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-headline font-bold text-white">Legal Data Ingestion</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Upload your CSV files to automatically map cases, identify tribunals via CNJ patterns, and calculate urgency weights.
              </p>
            </div>

            {!file ? (
              <label className="group border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="p-6 bg-secondary rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-primary w-12 h-12" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Select Legal Spreadsheet</h3>
                <p className="text-sm text-muted-foreground">Supported format: CSV (encoded in UTF-8)</p>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary rounded-xl">
                      <FileSpreadsheet className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { setFile(null); setPreview([]); }} className="text-muted-foreground hover:text-white">
                    <X size={20} />
                  </Button>
                </div>

                {parsing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-primary">
                      <span>Analyzing Structures...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {preview.length > 0 && !parsing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Extracted Cases</p>
                        <p className="text-xl font-headline font-bold text-white">{preview.length}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tribunals Found</p>
                        <p className="text-xl font-headline font-bold text-white">{new Set(preview.map(p => p.tribunal)).size}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vencidos</p>
                        <p className="text-xl font-headline font-bold text-destructive">{preview.filter(p => p.status === 'Vencido').length}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">No Prazo</p>
                        <p className="text-xl font-headline font-bold text-chart-3">{preview.filter(p => p.status === 'No Prazo' || p.status === 'Sem Prazo').length}</p>
                      </div>
                    </div>

                    <div className="bg-secondary/30 rounded-xl p-4 max-h-64 overflow-auto space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-secondary/30 pb-2">Batch Preview (First 5 records)</p>
                      {preview.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm text-white font-medium">{c.cliente}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] text-white border-border">{c.tribunal}</Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{c.protocolo}</span>
                          </div>
                        </div>
                      ))}
                      {preview.length > 5 && <p className="text-center text-xs text-muted-foreground pt-2">And {preview.length - 5} more records...</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureItem 
                icon={<CheckCircle2 className="text-green-500" />} 
                title="CNJ Logic" 
                description="Automatic recognition of court regions and direct portal links."
              />
              <FeatureItem 
                icon={<Scale className="text-primary" />} 
                title="Urgency Weighing" 
                description="Deadlines are mathematically calculated against current date."
              />
              <FeatureItem 
                icon={<AlertCircle className="text-accent" />} 
                title="Validation Sentry" 
                description="Checks for missing attorneys, phones, and mandatory contacts."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
      <div className="p-2 bg-secondary rounded-lg w-fit">
        {icon}
      </div>
      <h3 className="font-bold text-white text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
