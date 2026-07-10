import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um link de WhatsApp de forma resiliente.
 */
export function formatWhatsAppLink(phone: string, text?: string) {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) ? `55${cleanPhone}` : cleanPhone;
  const encodedText = text ? encodeURIComponent(text) : '';
  return `https://wa.me/${finalPhone}${encodedText ? `?text=${encodedText}` : ''}`;
}

/**
 * Calcula a luminância de uma cor hex para verificar contraste.
 */
export function getLuminance(hex: string) {
  const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => {
    let c = parseInt(x, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) || [0, 0, 0];
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Calcula a razão de contraste entre duas cores.
 * WCAG 2.1: 4.5:1 para AA, 7:1 para AAA.
 */
export function getContrastRatio(hex1: string, hex2: string) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function getIdealTextColor(bgColor: string) {
  return getLuminance(bgColor) > 0.45 ? "#000000" : "#FFFFFF";
}

export function getAccessibilityRating(bgColor: string, textColor: string) {
  const ratio = getContrastRatio(bgColor, textColor);
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'FAIL';
}