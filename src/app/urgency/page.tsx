
"use client";

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';

export default function UrgencyEngine() {
  const { isAdmin } = useAdmin();

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">Urgency Engine</h1>
            <Badge className="bg-accent/20 text-accent border-accent/30 font-bold uppercase text-[10px]">Algorithm Active</Badge>
            {!isAdmin && (
              <Badge variant="secondary" className="bg-secondary/50 text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock size={10} /> Visitor Mode
              </Badge>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full space-y-8">
          <section className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldAlert size={120} className="text-primary" />
            </div>
            <div className="relative z-10 space-y-4 max-w-2xl">
              <h2 className="text-2xl font-headline font-bold text-white">Automated Priority Weights</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The engine automatically assigns urgency levels by calculating the distance between the <span className="text-white font-bold">Return Date</span> and today's date. Adjust the sensitivity below to calibrate the technical triage of your incoming filings.
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UrgencyLevelCard 
              icon={<ShieldAlert className="text-destructive" />} 
              label="Vencido (Crítico)" 
              condition="Return Date < Today"
              description="Maximum priority. Impact on legal compliance and client reputation."
            />
            <UrgencyLevelCard 
              icon={<AlertTriangle className="text-accent" />} 
              label="Atenção (Alerta)" 
              condition="Remaining Days ≤ 7"
              description="Immediate action required to ensure internal review time."
            />
            <UrgencyLevelCard 
              icon={<CheckCircle2 className="text-chart-3" />} 
              label="No Prazo (Saudável)" 
              condition="Remaining Days > 7"
              description="Routine monitoring. Standard procedural flow is maintained."
            />
          </div>

          <Card className={cn("bg-card border-border", !isAdmin && "opacity-60")}>
            <CardHeader>
              <CardTitle className="text-white font-headline">Engine Calibration</CardTitle>
              <CardDescription>
                {isAdmin ? "Fine-tune the mathematical boundaries for procedural alerts." : "Access restricted to Administrators."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 py-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white font-bold text-sm">Alert Threshold (Days)</Label>
                  <span className="text-accent font-bold">7 Days</span>
                </div>
                <Slider defaultValue={[7]} max={30} step={1} className="[&_[role=slider]]:bg-accent" disabled={!isAdmin} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Cases with return dates closer than this value will be flagged as 'Atenção'.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white font-bold text-sm">Critical Buffer (Days)</Label>
                  <span className="text-destructive font-bold">2 Days</span>
                </div>
                <Slider defaultValue={[2]} max={10} step={1} className="[&_[role=slider]]:bg-destructive" disabled={!isAdmin} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Hard buffer for final procedural review before filing expires.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function UrgencyLevelCard({ icon, label, condition, description }: { icon: React.ReactNode, label: string, condition: string, description: string }) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl space-y-3 hover:border-primary/30 transition-all">
      <div className="p-2 bg-secondary rounded-lg w-fit">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-bold text-sm">{label}</h3>
        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">{condition}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
