/**
 * MOTOR DE ENGENHARIA CROMÁTICA v170000.0 ELITE
 * Gerenciamento de Variáveis de Hardware e Presets Authority Series.
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
};

export const AUTHORITY_PRESETS: ThemePreset[] = [
  {
    id: 'minimal-steel',
    name: 'Minimal Steel (Default)',
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
    name: 'Midnight Professional',
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
  },
  {
    id: 'charcoal-authority',
    name: 'Charcoal Authority',
    radius: 6,
    colors: {
      background: '#0F172A',
      foreground: '#F8FAFC',
      primary: '#3B82F6',
      border: '#334155',
      secondary: '#1E2937',
      card: '#1E2937',
      accent: '#3B82F6'
    }
  },
  {
    id: 'obsidian-prestige',
    name: 'Obsidian Prestige',
    radius: 0,
    colors: {
      background: '#050505',
      foreground: '#F1F5F9',
      primary: '#00D1FF',
      border: '#1F2937',
      secondary: '#111111',
      card: '#0A0A0A',
      accent: '#00D1FF'
    }
  },
  {
    id: 'slate-corporate',
    name: 'Slate Corporate',
    radius: 8,
    colors: {
      background: '#F1F5F9',
      foreground: '#0F172A',
      primary: '#2563EB',
      border: '#CBD5E1',
      secondary: '#E2E8F0',
      card: '#FFFFFF',
      accent: '#2563EB'
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
  
  localStorage.setItem('lexisPredict_bg_color', colors.background);
  localStorage.setItem('lexisPredict_font_color', colors.foreground);
  localStorage.setItem('lexisPredict_btn_bg_color', colors.primary);
  localStorage.setItem('lexisPredict_border_color', colors.border);
  localStorage.setItem('lexisPredict_secondary_color', colors.secondary);
  localStorage.setItem('lexisPredict_border_radius', radius.toString());

  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--card', hexToHsl(colors.card || colors.background));
  root.style.setProperty('--foreground', hexToHsl(colors.foreground));
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--border', hexToHsl(colors.border));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary));
  root.style.setProperty('--radius', `${radius}px`);
  
  root.style.setProperty('--sidebar-background', hexToHsl(colors.background));
  root.style.setProperty('--sidebar-foreground', hexToHsl(colors.foreground));
  root.style.setProperty('--sidebar-border', hexToHsl(colors.border));
  root.style.setProperty('--sidebar-primary', hexToHsl(colors.primary));
  root.style.setProperty('--sidebar-accent', hexToHsl(colors.secondary));

  if (bgOpacity !== undefined) root.style.setProperty('--bg-opacity', bgOpacity.toString());
  if (sidebarOpacity !== undefined) root.style.setProperty('--sidebar-opacity', sidebarOpacity.toString());
  if (glassBlur !== undefined) root.style.setProperty('--glass-blur', `${glassBlur}px`);
}
