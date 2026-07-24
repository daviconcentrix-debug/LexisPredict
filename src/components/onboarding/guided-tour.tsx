
"use client";

/**
 * @fileOverview Módulo de Onboarding Interativo v100.0
 * Conduz o usuário pelas principais funcionalidades estratégicas do LexisPredict.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  ShieldCheck, 
  Target, 
  Briefcase, 
  FileSearch, 
  Palette,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/use-app-store';

interface TourStep {
  title: string;
  content: string;
  icon: React.ReactNode;
  route: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Seja Bem-vindo ao LexisPredict",
    content: "Este é o seu Mission Control. Aqui você visualiza a saúde global da sua carteira, o índice de risco e o Briefing Neural gerado pela nossa inteligência.",
    icon: <Zap className="text-primary" />,
    route: "/"
  },
  {
    title: "Fila de Atendimento",
    content: "No módulo de Tarefas, o sistema organiza automaticamente quem você deve contatar hoje com base em prazos vencidos e urgências críticas.",
    icon: <Target className="text-red-500" />,
    route: "/tarefas"
  },
  {
    title: "Gestão de Carteira",
    content: "Em Processos, você tem a tabela completa. Use os filtros por advogado para equilibrar a carga de trabalho da sua banca.",
    icon: <Briefcase className="text-blue-500" />,
    route: "/cases"
  },
  {
    title: "Auditoria 3D Elite",
    content: "O Veredito é nossa ferramenta mais poderosa. Insira um CNJ para que a IA analise todo o histórico do tribunal e sugira o próximo passo estratégico.",
    icon: <FileSearch className="text-emerald-500" />,
    route: "/veredito"
  },
  {
    title: "Selagem de Documentos",
    content: "Gere Procurações, Habilitações e Substabelecimentos em segundos. Nossa IA extrai os dados dos contratos e preenche as peças automaticamente.",
    icon: <Sparkles className="text-amber-500" />,
    route: "/documents"
  },
  {
    title: "Hardware Visual",
    content: "Personalize a atmosfera do seu gabinete. Altere cores, opacidades e wallpapers para criar um ambiente executivo sob medida.",
    icon: <Palette className="text-purple-500" />,
    route: "/settings"
  }
];

export function GuidedTour() {
  const router = useRouter();
  const { isTutorialActive, setTutorialActive, setTutorialCompleted } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isTutorialActive) {
      router.push(TOUR_STEPS[currentStep].route);
    }
  }, [currentStep, isTutorialActive, router]);

  if (!isTutorialActive) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finishTour = () => {
    setTutorialActive(false);
    setTutorialCompleted(true);
    setCurrentStep(0);
    router.push('/');
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white border-4 border-black shadow-[15px_15px_0px_#000] relative overflow-hidden flex flex-col">
        {/* Barra de Progresso */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={finishTour}
          className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 pt-14 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black flex items-center justify-center text-white border-2 border-black">
              {React.cloneElement(step.icon as React.ReactElement, { size: 28 })}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Passo {currentStep + 1} de {TOUR_STEPS.length}</p>
              <h2 className="text-xl font-black uppercase tracking-tighter">{step.title}</h2>
            </div>
          </div>

          <p className="text-sm font-bold uppercase leading-relaxed text-black/70 tracking-tight italic">
            "{step.content}"
          </p>

          <div className="pt-6 flex items-center justify-between border-t-2 border-black/5">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={handlePrev} 
                disabled={currentStep === 0}
                className="h-10 px-4 font-black uppercase text-[10px] border-2 border-transparent hover:border-black rounded-none"
              >
                <ChevronLeft size={16} className="mr-1" /> Anterior
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={finishTour}
                className="h-10 px-4 font-black uppercase text-[10px] text-black/40 hover:text-black rounded-none"
              >
                Pular
              </Button>
              <Button 
                onClick={handleNext}
                className="h-10 px-8 bg-black text-white hover:bg-primary hover:text-black font-black uppercase text-[10px] rounded-none shadow-[4px_4px_0px_#00D1FF] transition-all"
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Finalizar" : "Próximo"} <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#f8f9fb] border-t-2 border-black p-4 flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Protocolo de Onboarding W1 Capital</span>
        </div>
      </div>
    </div>
  );
}
