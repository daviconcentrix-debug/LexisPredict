import { browserStorage } from "@/lib/browser-storage";

export function setCssOpacityVars(
  bgOpacity01: number,
  sidebarOpacity01: number,
  blurPx: number
) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--bg-opacity", String(bgOpacity01));
  root.style.setProperty("--sidebar-opacity", String(sidebarOpacity01));
  root.style.setProperty("--glass-blur", `${blurPx}px`);
}

export function persistOpacity(
  bgOpacity01: number,
  sidebarOpacity01: number,
  blurPx: number
) {
  localStorage.setItem("lexisPredict_bg_opacity", String(bgOpacity01));
  localStorage.setItem("lexisPredict_sidebar_opacity", String(sidebarOpacity01));
  localStorage.setItem("lexisPredict_glass_blur", String(blurPx));
  setCssOpacityVars(bgOpacity01, sidebarOpacity01, blurPx);
  window.dispatchEvent(new Event("lexis-theme-changed"));
}

export function applyWallpaperUrl(url: string) {
  localStorage.setItem("lexisPredict_wallpaper", url);
  window.dispatchEvent(new Event("lexis-wallpaper-changed"));
}

export async function resetWallpaper() {
  localStorage.removeItem("lexisPredict_wallpaper");
  localStorage.removeItem("wallpaper");
  localStorage.removeItem("main_wallpaper_url");
  try {
    await browserStorage.removeAsset("main_wallpaper_blob");
    await browserStorage.removeAsset("side_wallpaper_blob");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("lexis-wallpaper-changed"));
}

export async function saveWallpaperFile(file: File): Promise<string> {
  await browserStorage.saveAsset("main_wallpaper_blob", file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      try {
        if (dataUrl) {
          localStorage.setItem("lexisPredict_wallpaper", dataUrl);
        }
      } catch {
        localStorage.removeItem("lexisPredict_wallpaper");
      }
      window.dispatchEvent(new Event("lexis-wallpaper-changed"));
      resolve(dataUrl || "");
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export function loadVisualStateFromStorage() {
  const bg = parseFloat(localStorage.getItem("lexisPredict_bg_opacity") || "0.85");
  const side = parseFloat(
    localStorage.getItem("lexisPredict_sidebar_opacity") || "0.9"
  );
  const blur = parseFloat(localStorage.getItem("lexisPredict_glass_blur") || "8");
  const wallpaper = localStorage.getItem("lexisPredict_wallpaper") || "";

  return {
    bgOpacity01: Number.isFinite(bg) ? bg : 0.85,
    sidebarOpacity01: Number.isFinite(side) ? side : 0.9,
    glassBlur: Number.isFinite(blur) ? blur : 8,
    wallpaper,
  };
}
