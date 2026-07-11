/**
 * MOTOR DE ENGENHARIA CROMÁTICA v24000.0 ELITE
 * Gerenciamento de Variáveis de Hardware e Soberania de Contraste.
 * Propriedade de W1 Capital | Fundador: Davi Alves Figueredo
 */

export type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  border: string;
  secondary: string;
  card: string;
  accent: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  colors: ThemeColors;
  radius: number;
  description?: string;
};

export const AUTHORITY_PRESETS: ThemePreset[] = [
  {
    id: 'executive-aston',
    name: 'Executivo Aston',
    description: 'Preto Matte & Dourado Champagne. Autoridade máxima.',
    radius: 0,
    colors: {
      background: '#0A0A0A',
      foreground: '#FFFFFF',
      primary: '#C9A227',
      border: '#1F1F1F',
      secondary: '#111111',
      card: '#111111',
      accent: '#C9A227'
    }
  },
  {
    id: 'minimal-steel',
    name: 'Padrão (Claro)',
    radius: 4,
    colors: {
      background: '#FFFFFF',
      foreground: '#0A0A0A',
      primary: '#00D1FF',
      border: '#E5E7EB',
      secondary: '#F3F4F6',
      card: '#FFFFFF',
      accent: '#00D1FF'
    }
  },
  {
    id: 'midnight-pro',
    name: 'Noturno Pro',
    radius: 4,
    colors: {
      background: '#020617',
      foreground: '#E0E7FF',
      primary: '#6366F1',
      border: '#1E2937',
      secondary: '#0F172A',
      card: '#0F172A',
      accent: '#22D3EE'
    }
  }
];

export function hexToHsl(hex: string): string {
  if (!hex) return '0 0% 0%';
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyGlobalTheme(preset: ThemePreset) {
  if (typeof document === 'undefined' || !preset || !preset.id) return;
  const root = document.documentElement;
  const { colors, radius, id } = preset;

  // Fix: Safe detection of theme name from ID
  const themeName = id.includes('minimal') ? 'light' : id.includes('aston') ? 'executivo' : 'dark';
  
  localStorage.setItem('lexisPredict_theme', themeName);
  localStorage.setItem('lexisPredict_bg_color', colors.background);
  localStorage.setItem('lexisPredict_font_color', colors.foreground);
  localStorage.setItem('lexisPredict_btn_bg_color', colors.primary);
  localStorage.setItem('lexisPredict_border_radius', radius.toString());

  root.classList.remove('theme-light', 'theme-dark', 'theme-executivo');
  root.classList.add('theme-' + themeName);

  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--foreground', hexToHsl(colors.foreground));
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--card', hexToHsl(colors.card));
  root.style.setProperty('--border', hexToHsl(colors.border));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary));
  root.style.setProperty('--radius', `${radius}px`);
}
