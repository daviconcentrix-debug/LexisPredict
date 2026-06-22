
"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Shield, User, Bell, Database, HardDrive, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { fetchRepoCases } from '@/app/actions/case-actions';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Sync');
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetchRepoCases();
      toast({ title: "Supabase Synced", description: "CRM state is now up to date." });
    } catch (e) {
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-xl text-white">System Settings</h1>
            <Badge variant="outline" className="text-accent border-accent/30 font-bold uppercase text-[10px]">CRM Operational</Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 space-y-1">
              <NavSettingItem icon={<HardDrive size={18} />} label="Cloud Sync" active={activeTab === 'Sync'} onClick={() => setActiveTab('Sync')} />
              <NavSettingItem icon={<Database size={18} />} label="API Config" active={activeTab === 'API'} onClick={() => setActiveTab('API')} />
              <NavSettingItem icon={<Shield size={18} />} label="Security" active={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />
            </aside>

            <div className="md:col-span-3 space-y-8">
              <Card className="bg-card border-border shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white font-headline text-lg">CRM Engine</CardTitle>
                  <CardDescription>Configure automation and cloud behavior.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white font-bold cursor-pointer">Live Cloud Connection</Label>
                      <p className="text-xs text-muted-foreground">Keep data synchronized across all devices via Supabase.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-white">Supabase Status</p>
                        <p className="text-xs text-muted-foreground">Active Connection</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleManualSync}
                      disabled={syncing}
                      className="text-[10px] font-bold uppercase border-border text-white hover:bg-primary"
                    >
                      {syncing ? <RefreshCcw className="w-3 h-3 animate-spin mr-2" /> : "Force Sync"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavSettingItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean,
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left",
        active ? "bg-primary text-white font-bold shadow-lg" : "text-muted-foreground hover:bg-secondary hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
