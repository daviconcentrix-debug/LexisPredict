"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  ShieldAlert, 
  Scale, 
  Users
} from 'lucide-react';
import { LegalCase } from '@/lib/case-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('lexisPredict_cases');
    if (stored) {
      setCases(JSON.parse(stored));
    }
  }, []);

  const metrics = useMemo(() => {
    const total = cases.length;
    const statusCounts = { Vencido: 0, Atenção: 0, 'No Prazo': 0, Arquivado: 0, 'Sem Prazo': 0 };
    const tribunalCounts: Record<string, number> = {};
    const attorneyCounts: Record<string, number> = {};

    cases.forEach(c => {
      const status = c.status || 'Sem Prazo';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status as keyof typeof statusCounts]++;
      } else {
        statusCounts['Sem Prazo']++;
      }
      tribunalCounts[c.tribunal] = (tribunalCounts[c.tribunal] || 0) + 1;
      attorneyCounts[c.advogado] = (attorneyCounts[c.advogado] || 0) + 1;
    });

    // Grouping for logical display
    // Active cases without defined deadlines are grouped with Routine (No Prazo)
    const healthyTotal = statusCounts['No Prazo'] + statusCounts['Sem Prazo'];
    const archivedTotal = statusCounts.Arquivado;

    const topTribunals = Object.entries(tribunalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topAttorneys = Object.entries(attorneyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { 
      total, 
      statusCounts, 
      healthyTotal, 
      archivedTotal, 
      topTribunals, 
      topAttorneys 
    };
  }, [cases]);

  const getPercent = (val: number) => metrics.total ? Math.round((val / metrics.total) * 100) : 0;

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Analytics Hub</h1>
            <Badge variant="outline" className="text-accent border-accent/30 font-bold uppercase text-[10px]">Technical View</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Section: Criticidade Processual */}
          <section className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-primary/20 rounded-full border border-primary/30">
                <ShieldAlert className="text-primary w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-white uppercase tracking-wider">Criticidade Processual</h2>
                <p className="text-xs text-muted-foreground">Distribution of cases based on calculated deadline proximity.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricItem label="Vencido (Crítico)" value={metrics.statusCounts.Vencido} pct={getPercent(metrics.statusCounts.Vencido)} color="bg-destructive" />
              <MetricItem label="Atenção (≤ 7 dias)" value={metrics.statusCounts.Atenção} pct={getPercent(metrics.statusCounts.Atenção)} color="bg-accent" />
              <MetricItem label="No Prazo (> 7 dias)" value={metrics.healthyTotal} pct={getPercent(metrics.healthyTotal)} color="bg-chart-3" />
              <MetricItem label="Arquivado / Encerrado" value={metrics.archivedTotal} pct={getPercent(metrics.archivedTotal)} color="bg-muted-foreground/50" />
            </div>

            <div className="h-3 w-full bg-secondary/50 rounded-full flex overflow-hidden">
              <div style={{ width: `${getPercent(metrics.statusCounts.Vencido)}%` }} className="bg-destructive h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.statusCounts.Atenção)}%` }} className="bg-accent h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.healthyTotal)}%` }} className="bg-chart-3 h-full transition-all duration-1000" />
              <div style={{ width: `${getPercent(metrics.archivedTotal)}%` }} className="bg-muted-foreground/30 h-full transition-all duration-1000" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            {/* Tribunal concentration */}
            <section className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-accent/20 rounded-full border border-accent/30">
                  <Scale className="text-accent w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-white uppercase tracking-wider">Concentração por Tribunal</h2>
                  <p className="text-xs text-muted-foreground">Procedural load distributed across identified court regions.</p>
                </div>
              </div>

              <div className="space-y-7">
                {metrics.topTribunals.length > 0 ? metrics.topTribunals.map(([name, count]) => (
                  <div key={name} className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{count} cases ({getPercent(count)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${getPercent(count)}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">Waiting for ingested data...</p>
                  </div>
                )}
              </div>
            </section>

            {/* Attorney Load */}
            <section className="bg-card border border-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-chart-3/20 rounded-full border border-chart-3/30">
                  <Users className="text-chart-3 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-white uppercase tracking-wider">Carga por Advogado</h2>
                  <p className="text-xs text-muted-foreground">Resource allocation based on assigned case volume.</p>
                </div>
              </div>

              <div className="space-y-7">
                {metrics.topAttorneys.length > 0 ? metrics.topAttorneys.map(([name, count]) => (
                  <div key={name} className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white">
                      <span className="truncate pr-4">{name}</span>
                      <span className="text-muted-foreground shrink-0">{count} cases ({getPercent(count)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${getPercent(count)}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">Waiting for ingested data...</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricItem({ label, value, pct, color }: { label: string, value: number, pct: number, color: string }) {
  return (
    <div className="p-5 bg-secondary/20 border border-border rounded-2xl">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-headline font-bold text-white leading-none">{value}</span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded text-white mb-0.5", color)}>{pct}%</span>
      </div>
    </div>
  );
}