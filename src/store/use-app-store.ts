
/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * MOTOR DE ESTADO GLOBAL v100.0 (ZUSTAND)
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
  lastSync: string | null;
  aiCosts: {
    totalTokens: number;
    totalCalls: number;
  };
  
  // Actions
  setCases: (cases: LegalCase[]) => void;
  setNotes: (notes: CaseNote[]) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: string) => void;
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
      lastSync: null,
      aiCosts: {
        totalTokens: 0,
        totalCalls: 0,
      },

      setCases: (cases) => set({ cases }),
      setNotes: (notes) => set({ notes }),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
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
