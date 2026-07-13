"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Palette,
  Globe,
  Zap,
  Image as ImageIcon,
  Layout,
  Star,
  ShieldCheck,
  RefreshCcw,
  Waves,
  Trash2,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AUTHORITY_PRESETS, applyGlobalTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  persistOpacity,
  applyWallpaperUrl,
  resetWallpaper,
  saveWallpaperFile,
  loadVisualStateFromStorage,
  setCssOpacityVars,
} from "@/lib/visual-hardware";

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all border-2",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border/50 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function EngineOption({
  id,
  label,
  desc,
  active,
}: {
  id: string;
  label: string;
  desc: string;
  active: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-3 p-4 border-2 cursor-pointer transition-all mb-3",
        active
          ? "border-primary bg-primary/10"
          : "border-white/10 hover:border-white/30"
      )}
    >
      <RadioGroupItem value={id} id={id} className="mt-1" />
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-black text-white uppercase tracking-widest">
          {label}
        </span>
        <span className="text-[10px] text-white/50">{desc}</span>
      </div>
      {active && <Check className="ml-auto text-primary" size={16} />}
    </label>
  );
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Style");
  const [iaModel, setIaModel] = useState("xai");
  const [locale, setLocale] = useState("pt");

  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [fontColor, setFontColor] = useState("#0A0A0A");
  const [primaryColor, setPrimaryColor] = useState("#00D1FF");
  const [wallpaper, setWallpaper] = useState("");
  const [radius, setRadius] = useState(4);
  const [bgOpacity, setBgOpacity] = useState(85);
  const [sidebarOpacity, setSidebarOpacity] = useState(90);
  const [glassBlur, setGlassBlur] = useState(8);

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIaModel(localStorage.getItem("lexisPredict_preferred_ia") || "xai");
    setLocale(localStorage.getItem("lexisPredict_locale") || "pt");

    setBgColor(localStorage.getItem("lexisPredict_bg_color") || "#FFFFFF");
    setFontColor(localStorage.getItem("lexisPredict_font_color") || "#0A0A0A");
    setPrimaryColor(
      localStorage.getItem("lexisPredict_btn_bg_color") || "#00D1FF"
    );
    setRadius(parseInt(localStorage.getItem("lexisPredict_border_radius") || "4", 10));

    const visual = loadVisualStateFromStorage();
    setWallpaper(visual.wallpaper);
    setBgOpacity(Math.round(visual.bgOpacity01 * 100));
    setSidebarOpacity(Math.round(visual.sidebarOpacity01 * 100));
    setGlassBlur(visual.glassBlur);
    setCssOpacityVars(
      visual.bgOpacity01,
      visual.sidebarOpacity01,
      visual.glassBlur
    );
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLocale(lang);
    localStorage.setItem("lexisPredict_locale", lang);
    toast({
      title: "Idioma alterado",
      description: "Recarregando ambiente...",
    });
    setTimeout(() => window.location.reload(), 800);
  };

  const handlePresetChange = (preset: (typeof AUTHORITY_PRESETS)[number]) => {
    setBgColor(preset.colors.background);
    setFontColor(preset.colors.foreground);
    setPrimaryColor(preset.colors.primary);
    setRadius(preset.radius);
    applyGlobalTheme(
      preset.colors,
      preset.radius,
      bgOpacity / 100,
      sidebarOpacity / 100,
      glassBlur
    );
    toast({ title: `${preset.name} ativado` });
  };

  const handleWallpaperSelect = (url: string) => {
    setWallpaper(url);
    applyWallpaperUrl(url);
    toast({ title: "Atmosfera aplicada" });
  };

  const handleResetWallpaper = async () => {
    await resetWallpaper();
    setWallpaper("");
    toast({
      title: "Wallpaper removido",
      description: "Fundo padrão restaurado.",
    });
  };

  const handleWallpaperFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await saveWallpaperFile(file);
      setWallpaper(dataUrl);
      toast({ title: "Wallpaper enviado" });
    } catch {
      toast({
        title: "Erro ao carregar imagem",
        variant: "destructive",
      });
    }
  };

  const handleBgOpacity = (val: number[]) => {
    const pct = val[0];
    setBgOpacity(pct);
    persistOpacity(pct / 100, sidebarOpacity / 100, glassBlur);
  };

  const handleSidebarOpacity = (val: number[]) => {
    const pct = val[0];
    setSidebarOpacity(pct);
    persistOpacity(bgOpacity / 100, pct / 100, glassBlur);
  };

  const handleGlassBlur = (val: number[]) => {
    const px = val[0];
    setGlassBlur(px);
    persistOpacity(bgOpacity / 100, sidebarOpacity / 100, px);
  };

  const handleManualApply = () => {
    const customColors = {
      background: bgColor,
      foreground: fontColor,
      primary: primaryColor,
      border: bgColor === "#FFFFFF" ? "#E5E7EB" : "#1F2937",
      secondary: bgColor === "#FFFFFF" ? "#F3F4F6" : "#111111",
      card: bgColor,
      accent: primaryColor,
      wallpaper: wallpaper || undefined,
    };
    applyGlobalTheme(
      customColors,
      radius,
      bgOpacity / 100,
      sidebarOpacity / 100,
      glassBlur
    );
    if (wallpaper) {
      applyWallpaperUrl(wallpaper);
    }
    window.dispatchEvent(new Event("lexis-theme-changed"));
    toast({ title: "Hardware visual aplicado" });
  };

  const starlinkImages = Array.isArray(PlaceHolderImages)
    ? PlaceHolderImages.filter(
        (img: { id: string }) =>
          img.id.startsWith("starlink") || img.id.includes("atmosphere")
      )
    : [];

  if (!mounted) {
    return (
      <div className="flex h-screen bg-transparent">
        <div className="hidden lg:block w-64 glass-sidebar border-r border-border/50" />
        <main className="flex-1 glass-panel" />
      </div>
    );
  }

  return (
    <AppShell>
      <header className="h-16 border-b border-border/30 flex items-center justify-between px-8 shrink-0 bg-background/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-sm tracking-[0.2em] uppercase">
            Configurações
          </h1>
          <Badge
            variant="outline"
            className="border-primary text-primary text-[9px] uppercase font-bold tracking-[0.3em]"
          >
            Hardware Visual
          </Badge>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500 text-emerald-600 font-black uppercase text-[10px] flex items-center gap-1.5 px-3 py-1"
        >
          <ShieldCheck size={10} /> Authenticated
        </Badge>
      </header>

      <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <aside className="space-y-1">
            <NavButton
              active={activeTab === "Style"}
              onClick={() => setActiveTab("Style")}
              icon={<Palette size={14} />}
              label="Hardware Visual"
            />
            <NavButton
              active={activeTab === "Engine"}
              onClick={() => setActiveTab("Engine")}
              icon={<Cpu size={14} />}
              label="Núcleo Neural"
            />
            <NavButton
              active={activeTab === "System"}
              onClick={() => setActiveTab("System")}
              icon={<Globe size={14} />}
              label="Localização"
            />
          </aside>

          <div className="md:col-span-3 space-y-12 pb-20">
            {activeTab === "Style" && (
              <div className="space-y-12 animate-in fade-in duration-500">
                {/* Preview */}
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Live Preview
                  </Label>
                  <div className="glass-card border-2 border-border p-8 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Interface Mockup
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[8px] uppercase">
                        Opacidade {bgOpacity}%
                      </Badge>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="bg-primary text-primary-foreground font-bold uppercase text-[10px]"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Primary Action
                      </Button>
                      <Button
                        variant="outline"
                        className="border-2 border-border text-foreground font-bold uppercase text-[10px]"
                      >
                        Secondary Action
                      </Button>
                    </div>
                    <p className="mt-6 text-xs text-muted-foreground">
                      Texto de leitura sobre o painel. Baixe a opacidade para ver
                      o wallpaper atrás deste card.
                    </p>
                  </div>
                </section>

                {/* Presets */}
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Presets Authority
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AUTHORITY_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetChange(preset)}
                        className="border-2 border-border p-4 text-left hover:border-primary transition-all glass-card"
                      >
                        <div className="flex gap-1 mb-3">
                          <span
                            className="w-4 h-4 border border-border"
                            style={{ background: preset.colors.background }}
                          />
                          <span
                            className="w-4 h-4 border border-border"
                            style={{ background: preset.colors.primary }}
                          />
                          <span
                            className="w-4 h-4 border border-border"
                            style={{ background: preset.colors.foreground }}
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Starlink atmospheres */}
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Starlink Orbit Atmospheres
                  </Label>
                  {starlinkImages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma atmosfera na galeria. Use URL ou upload abaixo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {starlinkImages.map(
                        (img: {
                          id: string;
                          imageUrl: string;
                          description?: string;
                        }) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => handleWallpaperSelect(img.imageUrl)}
                            className={cn(
                              "relative aspect-video border-2 overflow-hidden group transition-all",
                              wallpaper === img.imageUrl
                                ? "border-primary shadow-[0_0_15px_rgba(0,209,255,0.3)]"
                                : "border-border/50"
                            )}
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.description || img.id}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Star className="text-white fill-white" size={20} />
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md text-[7px] font-black text-white uppercase">
                              {img.description || img.id}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </section>

                {/* Transparência */}
                <section className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Transparência & Glassmorphism
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 glass-card p-6 border-2 border-border">
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase font-bold flex items-center gap-2 text-primary">
                        <Waves size={12} /> Opacidade Fundo: {bgOpacity}%
                      </Label>
                      <Slider
                        value={[bgOpacity]}
                        max={100}
                        min={40}
                        step={1}
                        onValueChange={handleBgOpacity}
                      />
                      <p className="text-[9px] text-muted-foreground">
                        Recomendado 75–85% para ver o wallpaper.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase font-bold flex items-center gap-2 text-primary">
                        <Layout size={12} /> Opacidade Sidebar: {sidebarOpacity}%
                      </Label>
                      <Slider
                        value={[sidebarOpacity]}
                        max={100}
                        min={40}
                        step={1}
                        onValueChange={handleSidebarOpacity}
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] uppercase font-bold flex items-center gap-2 text-primary">
                        <RefreshCcw size={12} /> Glass Blur: {glassBlur}px
                      </Label>
                      <Slider
                        value={[glassBlur]}
                        max={24}
                        min={0}
                        step={1}
                        onValueChange={handleGlassBlur}
                      />
                    </div>
                  </div>
                </section>

                {/* Custom overrides */}
                <section className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Custom Engine Overrides
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 glass-card p-6 border-2 border-border">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold">
                          Background
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-12 h-10 p-1 rounded-none border-2 border-border"
                          />
                          <Input
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="font-mono text-xs rounded-none border-2 border-border"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold">
                          Text (Foreground)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-12 h-10 p-1 rounded-none border-2 border-border"
                          />
                          <Input
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="font-mono text-xs rounded-none border-2 border-border"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold">
                          Primary
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 p-1 rounded-none border-2 border-border"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="font-mono text-xs rounded-none border-2 border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold flex items-center gap-2">
                          <ImageIcon size={12} /> Wallpaper URL
                        </Label>
                        <Input
                          placeholder="https://..."
                          value={wallpaper}
                          onChange={(e) => setWallpaper(e.target.value)}
                          className="text-xs rounded-none border-2 border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold">
                          Upload de imagem
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleWallpaperFile}
                          className="text-xs rounded-none border-2 border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[9px] uppercase font-bold flex items-center gap-2">
                          <Layout size={12} /> Border Radius: {radius}px
                        </Label>
                        <Input
                          type="range"
                          min={0}
                          max={24}
                          value={radius}
                          onChange={(e) =>
                            setRadius(parseInt(e.target.value, 10))
                          }
                          className="accent-primary"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          onClick={handleManualApply}
                          className="flex-1 bg-foreground text-background hover:opacity-90 border-2 border-foreground font-black uppercase text-[10px] h-12 rounded-none"
                        >
                          Apply System Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetWallpaper}
                          className="h-12 border-2 border-foreground font-black uppercase text-[10px] rounded-none"
                          title="Remover wallpaper"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "Engine" && (
              <div className="bg-[#0F1117] border-2 border-white/10 p-6 animate-in slide-in-from-right-4">
                <div className="mb-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} /> Neural Mission Control
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase mt-1">
                    Selecione o motor de IA principal para as operações de
                    gabinete.
                  </p>
                </div>
                <RadioGroup
                  value={iaModel}
                  onValueChange={(val) => {
                    setIaModel(val);
                    localStorage.setItem("lexisPredict_preferred_ia", val);
                    toast({ title: "Motor neural atualizado" });
                  }}
                >
                  <EngineOption
                    id="xai"
                    label="xAI GROK 4.5"
                    desc="Raciocínio sênior de alta fidelidade."
                    active={iaModel === "xai"}
                  />
                  <EngineOption
                    id="airforce"
                    label="AIRFORCE DEEPSEEK-V3"
                    desc="Processamento ultra-veloz de dados."
                    active={iaModel === "airforce"}
                  />
                  <EngineOption
                    id="groq-llama"
                    label="GROQ LLAMA 3.3"
                    desc="Comunicação fluida em tempo real."
                    active={iaModel === "groq-llama"}
                  />
                  <EngineOption
                    id="groq-deepseek"
                    label="GROQ DEEPSEEK R1"
                    desc="Lógica profunda para análise forense."
                    active={iaModel === "groq-deepseek"}
                  />
                  <EngineOption
                    id="puter"
                    label="PUTER AI"
                    desc="Operação edge para baixa latência."
                    active={iaModel === "puter"}
                  />
                </RadioGroup>
              </div>
            )}

            {activeTab === "System" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    Idioma / Locale
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "pt", label: "Português (BR)" },
                      { id: "en", label: "English" },
                      { id: "es", label: "Español" },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id)}
                        className={cn(
                          "border-2 p-4 text-[10px] font-black uppercase tracking-widest transition-all",
                          locale === lang.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border glass-card hover:border-foreground/50"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="glass-card border-2 border-border p-6 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    Sessão
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Preferências de idioma e motor neural ficam neste navegador
                    (localStorage). Wallpaper e opacidade também.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
