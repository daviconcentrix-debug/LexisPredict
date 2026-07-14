/**
 * MOTOR DE ENGENHARIA CROMÁTICA v190000.0 ELITE
 * Gerenciamento de Variáveis de Hardware e Presets Authority Series.
 */

export type ThemeColors = {
  background: string;
  bgSecondary: string;
  foreground: string;
  fontMuted: string;
  primary: string;
  accent: string;
  border: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  colors: ThemeColors;
  radius: number;
};

export const AUTHORITY_PRESETS: ThemePreset[] = [
  {
    id: 'minimal-steel',
    name: 'Minimal Steel (Default)',
    radius: 4,
    colors: {
      background: '#FFFFFF',
      bgSecondary: '#F3F4F6',
      foreground: '#0A0A0A',
      fontMuted: '#6B7280',
      primary: '#00D1FF',
      accent: '#E5E7EB',
      border: '#000000'
    }
  },
  {
    id: 'obsidian-prestige',
    name: 'Obsidian Prestige',
    radius: 0,
    colors: {
      background: '#050505',
      bgSecondary: '#111111',
      foreground: '#F1F5F9',
      fontMuted: '#94A3B8',
      primary: '#00D1FF',
      accent: '#1F2937',
      border: '#FFFFFF'
    }
  }
];

export function hexToHsl(hex: string): string {
  if (!hex || hex[0] !== '#') return '0 0% 0%';
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
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

export function applyGlobalTheme(colors: ThemeColors, radius: number, bgOpacity?: number, sidebarOpacity?: number, glassBlur?: number) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Persistência local
  localStorage.setItem('lexisPredict_bg_color', colors.background);
  localStorage.setItem('lexisPredict_bg_secondary_color', colors.bgSecondary);
  localStorage.setItem('lexisPredict_font_color', colors.foreground);
  localStorage.setItem('lexisPredict_font_muted_color', colors.fontMuted);
  localStorage.setItem('lexisPredict_btn_bg_color', colors.primary);
  localStorage.setItem('lexisPredict_btn_inactive_color', colors.accent);
  localStorage.setItem('lexisPredict_border_color', colors.border);
  localStorage.setItem('lexisPredict_border_radius', radius.toString());

  // Injeção de variáveis CSS
  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--secondary', hexToHsl(colors.bgSecondary));
  root.style.setProperty('--foreground', hexToHsl(colors.foreground));
  root.style.setProperty('--muted-foreground', hexToHsl(colors.fontMuted));
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--accent', hexToHsl(colors.accent));
  root.style.setProperty('--border', hexToHsl(colors.border));
  root.style.setProperty('--radius', `${radius}px`);
  
  // Sidebar e Cards seguem a lógica técnica
  root.style.setProperty('--sidebar-background', hexToHsl(colors.background));
  root.style.setProperty('--sidebar-foreground', hexToHsl(colors.foreground));
  root.style.setProperty('--card', hexToHsl(colors.background));

  if (bgOpacity !== undefined) root.style.setProperty('--bg-opacity', bgOpacity.toString());
  if (sidebarOpacity !== undefined) root.style.setProperty('--sidebar-opacity', sidebarOpacity.toString());
  if (glassBlur !== undefined) root.style.setProperty('--glass-blur', `${glassBlur}px`);
}
