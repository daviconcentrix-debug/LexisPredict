import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um link de WhatsApp de forma resiliente.
 * Remove caracteres especiais e garante o prefixo internacional.
 */
export function formatWhatsAppLink(phone: string, text?: string) {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  // Adiciona 55 se o número tiver 10 ou 11 dígitos (formato brasileiro padrão)
  const finalPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? `55${cleanPhone}` : cleanPhone;
  const encodedText = text ? encodeURIComponent(text) : '';
  return `https://wa.me/${finalPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}
