
"use client";

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Shield, User, Bell, Database, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-background font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-white">
        <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="font-headline font-bold text-xl text-white">System Settings</h1>
        </header>

        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1 space-y-1">
              <NavSettingItem icon={<User size={18} />} label="My Profile" active />
              <NavSettingItem icon={<Bell size={18} />} label="Notifications" />
              <NavSettingItem icon={<Shield size={18} />} label="Security" />
              <NavSettingItem icon={<Database size={18} />} label="API Config" />
              <NavSettingItem icon={<HardDrive size={18} />} label="Data Sync" />
            </aside>

            <div className="md:col-span-3 space-y-8">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-white font-headline">Procedural Engine</CardTitle>
                  <CardDescription>Configure how the system weighs your legal cases and court deadines.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white font-bold">Auto-Calculate Weights</Label>
                      <p className="text-xs text-muted-foreground">Calculate urgency weights automatically on new imports.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white font-bold">CNJ External Linking</Label>
                      <p className="text-xs text-muted-foreground">Open court portals directly via pattern recognition.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-white font-headline">Data Persistence</CardTitle>
                  <CardDescription>Management of your repository and cloud storage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <HardDrive size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Local Repo Storage</p>
                        <p className="text-xs text-muted-foreground">Syncing data directly with Git/GitHub files.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest border-border text-white">Verify Sync</Button>
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

function NavSettingItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      active ? "bg-primary text-white font-bold shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-white"
    )}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
