"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Filter, 
  Download,
  MoreVertical,
  Plus,
  Briefcase
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('lexisPredict_cases');
    if (stored) {
      setCases(JSON.parse(stored));
    }
  }, []);

  const deleteCase = (id: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      const updated = cases.filter(c => c.id !== id);
      setCases(updated);
      localStorage.setItem('lexisPredict_cases', JSON.stringify(updated));
      toast({ title: "Case Deleted", description: "The record has been removed from the local store." });
    }
  };

  const clearAll = () => {
    if (confirm('DANGER: This will wipe ALL cases from your local database. Continue?')) {
      setCases([]);
      localStorage.removeItem('lexisPredict_cases');
      toast({ title: "Database Wiped", description: "All records cleared.", variant: "destructive" });
    }
  };

  const filtered = cases.filter(c => 
    c.cliente.toLowerCase().includes(search.toLowerCase()) || 
    c.protocolo.includes(search) ||
    c.advogado.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Case Management</h1>
            <Badge variant="outline" className="text-muted-foreground">{filtered.length} active records</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="destructive" size="sm" onClick={clearAll} className="h-8 font-bold">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear Database
            </Button>
            <Button size="sm" className="h-8 bg-primary font-bold">
              <Plus className="w-3.5 h-3.5 mr-2" /> New Case
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="bg-card border border-border rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Filter by name, protocol, or attorney..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-none h-10 text-sm focus-visible:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-10 px-4 border-border text-xs font-bold">
                  <Filter className="w-4 h-4 mr-2" /> Filters
                </Button>
                <Button variant="outline" size="sm" className="h-10 px-4 border-border text-xs font-bold">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    <th className="px-6 py-4">Client / CNJ Protocol</th>
                    <th className="px-6 py-4">Tribunal</th>
                    <th className="px-6 py-4">Assigned Attorney</th>
                    <th className="px-6 py-4">Procedural Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{c.cliente}</span>
                          <span className="text-xs font-mono text-muted-foreground mt-0.5 tracking-tight">{c.protocolo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="secondary" className="bg-sidebar border-border font-bold text-[10px]">
                          {c.tribunal}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm text-muted-foreground font-medium">
                        {c.advogado}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={c.status} />
                          <p className="text-[10px] text-muted-foreground font-medium">{c.proximoPrazo || 'No Deadline Set'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-white">
                            <a href={c.linkConsulta} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border text-white">
                              <DropdownMenuLabel>Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="focus:bg-primary focus:text-white">Edit Details</DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-primary focus:text-white">Run AI Analysis</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive focus:text-white"
                                onClick={() => deleteCase(c.id)}
                              >
                                Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto">
                            <Briefcase className="text-muted-foreground" />
                          </div>
                          <h3 className="text-white font-bold">Base Clear</h3>
                          <p className="text-sm text-muted-foreground">Search yielded zero matches or your local database is currently empty.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: LegalCase['status'] }) {
  const styles = {
    'Vencido': "bg-destructive/10 text-destructive border-destructive/20",
    'Atenção': "bg-accent/10 text-accent border-accent/20",
    'No Prazo': "bg-chart-3/10 text-chart-3 border-chart-3/20",
    'Arquivado': "bg-muted text-muted-foreground border-border",
    'Sem Prazo': "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge className={cn("px-2 py-0.5 font-bold text-[10px] uppercase tracking-tighter", styles[status])}>
      {status}
    </Badge>
  );
}