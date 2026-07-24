
"use client";

/**
 * @fileOverview Módulo de Onboarding Interativo v200.0 ELITE
 * Conduz o usuário por TODAS as abas estratégicas do LexisPredict sem perdas de progresso.
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 */

import React, { useEffect } from 'react';
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
  Sparkles,
  Users,
  FileText,
  FileSignature,
  Repeat,
  FileStack,
  MessageCircle,
  Upload,
  StickyNote,
  ScanText,
  BarChart3,
  ShieldAlert,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/use-app-store';

interface TourStep {
  title: string;
  content: string;
  icon: React.ReactNode;
  route: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Misson Control (Dashboard)",
    content: "Seja bem-vindo ao LexisPredict Elite. Aqui você tem o controle total da sua carteira, o índice de risco global e o Briefing Neural processado por nossa IA.",
    icon: <Zap className="text-primary" />,
    route: "/"
  },
  {
    title: "Fila de Atendimento",
    content: "O sistema organiza automaticamente sua fila de contatos com base em prazos vencidos e urgências, permitindo que você bata suas metas diárias com precisão.",
    icon: <Target className="text-red-500" />,
    route: "/tarefas"
  },
  {
    title: "Gestão de Carteira",
    content: "Visualize toda a sua banca de processos com filtros dinâmicos por advogado. Controle a volumetria e a saúde jurídica de cada caso individualmente.",
    icon: <Briefcase className="text-blue-500" />,
    route: "/cases"
  },
  {
    title: "Diretório de Equipe",
    content: "Gerencie sua cadeia de comando. Promova membros, audite acessos e visualize o ranking de autoridade do seu gabinete.",
    icon: <Users className="text-purple-500" />,
    route: "/team"
  },
  {
    title: "Auditoria 3D Elite",
    content: "A ferramenta de triagem mais poderosa do mercado. Insira um CNJ para que a IA analise o histórico do DataJud e gere um parecer estratégico completo.",
    icon: <FileSearch className="text-emerald-500" />,
    route: "/veredito"
  },
  {
    title: "Gerador de Procurações",
    content: "Automatize a criação de procurações ad judicia. A IA extrai os dados do contrato e preenche a peça em segundos com selagem digital.",
    icon: <FileText className="text-amber-500" />,
    route: "/documents"
  },
  {
    title: "Módulo de Habilitação",
    content: "Gere peças de habilitação combinadas com procuração. Tudo o que você precisa para ingressar em um processo em um único clique.",
    icon: <FileSignature className="text-orange-500" />,
    route: "/habilitacao-peca"
  },
  {
    title: "Substabelecimento Digital",
    content: "Transfira poderes de forma segura. Gere substabelecimentos sem reserva de poderes com conformidade técnica total.",
    icon: <Repeat className="text-indigo-500" />,
    route: "/substabelecimento"
  },
  {
    title: "Peça de Substabelecimento",
    content: "Documentação específica para peticionamento de substabelecimento, garantindo a atualização correta do patrono nos autos.",
    icon: <FileStack className="text-rose-500" />,
    route: "/substabelecimento-peca"
  },
  {
    title: "Terminal WhatsApp",
    content: "Comunicação direta e automatizada. Envie despachos gerados por IA via Evolution API e mantenha o histórico real sincronizado.",
    icon: <MessageCircle className="text-emerald-600" />,
    route: "/whatsapp"
  },
  {
    title: "Unidade de Ingestão",
    content: "Importe seus dumps de dados ou planilhas CSV. O sistema corrige codificações e datas automaticamente para uma sincronia perfeita.",
    icon: <Upload className="text-blue-400" />,
    route: "/import"
  },
  {
    title: "Livro de Evidências",
    content: "Registre notas, fotos e andamentos estratégicos. Use a IA para auditar suas evidências e extrair pontos fortes e riscos operacionais.",
    icon: <StickyNote className="text-yellow-500" />,
    route: "/notes"
  },
  {
    title: "Motor de OCR Soberano",
    content: "Transcrição visual de alta precisão. Converta scans e fotos de documentos em texto editável utilizando processamento neural local.",
    icon: <ScanText className="text-cyan-500" />,
    route: "/tools/ocr"
  },
  {
    title: "Business Intelligence",
    content: "Indicadores gráficos de volumetria por tribunal e performance de banca. Transforme dados em decisões executivas.",
    icon: <BarChart3 className="text-pink-500" />,
    route: "/analytics"
  },
  {
    title: "Algoritmo de Urgência",
    content: "Calibre a sensibilidade do motor de alertas. Defina os pesos matemáticos que determinam quando um processo deve ser priorizado.",
    icon: <ShieldAlert className="text-red-600" />,
    route: "/urgency"
  },
  {
    title: "Hardware Visual",
    content: "Personalize a atmosfera do seu gabinete. Ajuste cores, opacidades, blurs e wallpapers para um ambiente de trabalho premium.",
    icon: <Palette className="text-violet-500" />,
    route: "/settings"
  },
  {
    title: "Omni Export Master",
    content: "O Dossiê Omnipresente. Gere um único PDF contendo o 'print' técnico de absolutamente todas as abas do seu gabinete.",
    icon: <Printer className="text-slate-800" />,
    route: "/master-export"
  }
];

export function GuidedTour() {
  const router = useRouter();
  const { 
    isTutorialActive, 
    setTutorialActive, 
    setTutorialCompleted,
    tutorialStep,
    setTutorialStep
  } = useAppStore();

  useEffect(() => {
    if (isTutorialActive && TOUR_STEPS[tutorialStep]) {
      router.push(TOUR_STEPS[tutorialStep].route);
    }
  }, [tutorialStep, isTutorialActive, router]);

  if (!isTutorialActive) return null;

  const handleNext = () => {
    if (tutorialStep < TOUR_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const finishTour = () => {
    setTutorialActive(false);
    setTutorialCompleted(true);
    setTutorialStep(0);
    router.push('/');
  };

  const step = TOUR_STEPS[tutorialStep];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white border-4 border-black shadow-[20px_20px_0px_#000] relative overflow-hidden flex flex-col">
        {/* Barra de Progresso Real */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-100">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-out" 
            style={{ width: `${((tutorialStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={finishTour}
          className="absolute top-6 right-6 p-2 hover:bg-black hover:text-white transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="p-12 pt-16 space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black flex items-center justify-center text-white border-2 border-black shadow-lg">
              {React.cloneElement(step.icon as React.ReactElement, { size: 32 })}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Módulo {tutorialStep + 1} de {TOUR_STEPS.length}</p>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{step.title}</h2>
            </div>
          </div>

          <div className="bg-[#f8f9fb] border-l-4 border-primary p-8">
            <p className="text-sm font-bold uppercase leading-relaxed text-black/80 tracking-tight italic">
              "{step.content}"
            </p>
          </div>

          <div className="pt-8 flex items-center justify-between border-t-2 border-black/5">
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              disabled={tutorialStep === 0}
              className="h-12 px-6 font-black uppercase text-[10px] border-2 border-transparent hover:border-black rounded-none transition-all disabled:opacity-20"
            >
              <ChevronLeft size={18} className="mr-2" /> Anterior
            </Button>
            
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={finishTour}
                className="h-12 px-6 font-black uppercase text-[10px] text-black/40 hover:text-black rounded-none"
              >
                Pular
              </Button>
              <Button 
                onClick={handleNext}
                className="h-12 px-10 bg-black text-white hover:bg-primary hover:text-black font-black uppercase text-[11px] tracking-widest rounded-none shadow-[6px_6px_0px_#00D1FF] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                {tutorialStep === TOUR_STEPS.length - 1 ? "Concluir Onboarding" : "Próximo Módulo"} <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-black text-white p-4 flex items-center justify-center gap-3">
          <ShieldCheck size={16} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ambiente Certificado • W1 Capital</span>
        </div>
      </div>
    </div>
  );
}
