"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Users, 
  Search, 
  Trash2, 
  Briefcase, 
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { LegalCase, cn } from '@/lib/case-logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ClientDirectory() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('lexisPredict_cases');
    if (stored) {
      setCases(JSON.parse(stored));
    }
  }, []);

  const clientGroups = useMemo(() => {
    const groups: Record<string, LegalCase[]> = {};
    cases.forEach(c => {
      if (!groups[c.cliente]) groups[c.cliente] = [];
      groups[c.cliente].push(c);
    });
    
    return Object.entries(groups)
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[1].length - a[1].length);
  }, [cases, search]);

  const deleteClient = (name: string) => {
    if (confirm(`Excluir CLIENTE: ${name}? Todos os ${cases.filter(c => c.cliente === name).length} processos serão removidos.`)) {
      const updated = cases.filter(c => c.cliente !== name);
      setCases(updated);
      localStorage.setItem('lexisPredict_cases', JSON.stringify(updated));
      toast({ title: "Client Removed", description: "All associated case logs were deleted." });
    }
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Client Directory</h1>
            <Badge variant="outline" className="text-muted-foreground">{clientGroups.length} unique accounts</Badge>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="mb-8 flex justify-between items-center bg-card border border-border p-4 rounded-2xl">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search by client name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-none h-11 text-sm rounded-xl focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientGroups.length > 0 ? clientGroups.map(([name, clientCases]) => (
                <div key={name} className="bg-card border border-border rounded-2xl p-6 group hover:border-primary/50 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Users size={24} />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteClient(name)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="font-headline font-bold text-lg text-white group-hover:text-primary transition-colors truncate pr-4">{name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Briefcase size={12} />
                      <span>{clientCases.length} Processos Ativos</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {Array.from(new Set(clientCases.map(c => c.tribunal))).slice(0, 3).map(trib => (
                        <div key={trib} className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-white" title={trib}>
                          {trib}
                        </div>
                      ))}
                      {new Set(clientCases.map(c => c.tribunal)).size > 3 && (
                        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          +{new Set(clientCases.map(c => c.tribunal)).size - 3}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest hover:text-primary">
                      Open Profile <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                      <Users className="text-muted-foreground" size={32} />
                    </div>
                    <h3 className="text-white font-bold text-xl">Directory Empty</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">No clients found matching your search. Try importing a case log to populate the database.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
