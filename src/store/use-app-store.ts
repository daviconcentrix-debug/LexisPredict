
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * MOTOR DE ESTADO GLOBAL v110.0 (ZUSTAND)
 * Gerencia o estado persistente de processos, notas e preferências de UI.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LegalCase, CaseNote } from '@/lib/case-logic';
import { Locale } from '@/lib/i18n';

interface AppState {
  cases: LegalCase[];
  notes: CaseNote[];
  locale: Locale;
  theme: string;
  isDarkMode: boolean;
  lastSync: string | null;
  tutorialCompleted: boolean;
  isTutorialActive: boolean;
  aiCosts: {
    totalTokens: number;
    totalCalls: number;
  };
  
  // Actions
  setCases: (cases: LegalCase[]) => void;
  setNotes: (notes: CaseNote[]) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: string) => void;
  setDarkMode: (isDark: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  setTutorialActive: (active: boolean) => void;
  updateLastSync: () => void;
  addAiMetrics: (tokens: number) => void;
  clearState: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      cases: [],
      notes: [],
      locale: 'pt',
      theme: 'white-prestige',
      isDarkMode: false,
      lastSync: null,
      tutorialCompleted: false,
      isTutorialActive: false,
      aiCosts: {
        totalTokens: 0,
        totalCalls: 0,
      },

      setCases: (cases) => set({ cases }),
      setNotes: (notes) => set({ notes }),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setDarkMode: (isDarkMode) => {
        set({ isDarkMode });
        if (typeof document !== 'undefined') {
          if (isDarkMode) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          localStorage.setItem('lexis_dark_mode', String(isDarkMode));
        }
      },
      setTutorialCompleted: (tutorialCompleted) => set({ tutorialCompleted }),
      setTutorialActive: (isTutorialActive) => set({ isTutorialActive }),
      updateLastSync: () => set({ lastSync: new Date().toISOString() }),
      addAiMetrics: (tokens) => set((state) => ({
        aiCosts: {
          totalTokens: state.aiCosts.totalTokens + tokens,
          totalCalls: state.aiCosts.totalCalls + 1
        }
      })),
      clearState: () => set({ cases: [], notes: [], lastSync: null, aiCosts: { totalTokens: 0, totalCalls: 0 } }),
    }),
    {
      name: 'lexispredict-enterprise-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
