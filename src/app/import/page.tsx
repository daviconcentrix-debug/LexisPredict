"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Upload, 
  FileSpreadsheet, 
  X
} from 'lucide-react';
import { LegalCase, processarCaso } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { syncRepoCases } from '@/app/actions/case-actions';
import { cn } from '@/lib/utils';

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
        toast({ title: "Invalid File", description: "The CSV appears to be empty.", variant: "destructive" });
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
    const cached = localStorage.getItem('lexisPredict_cloud_cache');
    const existing: LegalCase[] = cached ? JSON.parse(cached) : [];
    
    // Use protocol as key for deduplication
    const caseMap = new Map();
    existing.forEach(c => caseMap.set(c.protocolo, c));
    preview.forEach(c => caseMap.set(c.protocolo, c));
    
    const combined = Array.from(caseMap.values());
    
    const result = await syncRepoCases(combined);
    
    if (result.success) {
      localStorage.setItem('lexisPredict_cloud_cache', JSON.stringify(combined));
      toast({
        title: "Database Synced",
        description: `${preview.length} cases updated in the cloud CRM.`,
      });
      setFile(null);
      setPreview([]);
    } else {
      toast({ title: "Sync Failed", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="font-headline font-bold text-xl text-white">Migration Tool</h1>
          {preview.length > 0 && (
            <Button onClick={commitToStorage} className="bg-primary hover:bg-primary/90 font-bold px-6">
              Confirm & Cloud Sync
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-headline font-bold text-white">Legal Data Ingestion</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Upload CSVs to sync cases across all machines. Duplicates are merged by protocol number.
              </p>
            </div>

            {!file ? (
              <label className="group border-2 border-dashed border-border rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="p-6 bg-secondary rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-primary w-12 h-12" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Select Legal Spreadsheet</h3>
                <p className="text-sm text-muted-foreground">Format: CSV (UTF-8)</p>
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
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tribunals</p>
                        <p className="text-xl font-headline font-bold text-white">{new Set(preview.map(p => p.tribunal)).size}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Critical</p>
                        <p className="text-xl font-headline font-bold text-destructive">{preview.filter(p => p.status === 'Vencido').length}</p>
                      </div>
                      <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Healthy</p>
                        <p className="text-xl font-headline font-bold text-chart-3">{preview.filter(p => p.status === 'No Prazo').length}</p>
                      </div>
                    </div>

                    <div className="bg-secondary/30 rounded-xl p-4 max-h-64 overflow-auto space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-secondary/30 pb-2">Batch Preview</p>
                      {preview.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm text-white font-medium">{c.cliente}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] text-white border-border">{c.tribunal}</Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{c.protocolo}</span>
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
