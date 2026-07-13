'use server'

import { 
  getStoredCases, 
  saveStoredCases, 
  getStoredNotes, 
  saveStoredNotes,
  getUserContext 
} from '@/lib/server-db'
import { LegalCase, CaseNote, calcularStatus, calcularRisco, formatDateToISO } from '@/lib/case-logic'
import { revalidatePath } from 'next/cache'

/**
 * Busca todos os processos da empresa do usuário logado.
 */
export async function fetchRepoCases() {
  return await getStoredCases()
}

/**
 * Sincroniza uma lista de processos (usado na importação e edição).
 */
export async function syncRepoCases(cases: LegalCase[]) {
  const result = await saveStoredCases(cases)
  if (result.success) {
    revalidatePath('/cases')
    revalidatePath('/')
  }
  return result
}

/**
 * Salva ou atualiza um único caso.
 */
export async function upsertCaseAction(formData: any) {
  const status = calcularStatus(formData.proximoPrazo, formData.situacao)
  const risco = calcularRisco(formData.observacao, formData.statusInterno, formData.situacao)
  
  const caseData: LegalCase = {
    ...formData,
    status,
    risco
  }

  const result = await saveStoredCases([caseData])
  if (result.success) revalidatePath('/cases')
  return result
}

/**
 * Busca notas de evidência da empresa.
 */
export async function fetchRepoNotes() {
  return await getStoredNotes()
}

/**
 * Sincroniza a lista de notas.
 */
export async function syncRepoNotesAction(notes: CaseNote[]) {
  const result = await saveStoredNotes(notes)
  if (result.success) revalidatePath('/notes')
  return result
}

export async function syncRepoNotes(notes: CaseNote[]) {
  return await syncRepoNotesAction(notes)
}
