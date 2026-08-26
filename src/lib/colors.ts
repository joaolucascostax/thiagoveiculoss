// Hex <-> HSL helpers for design token overrides.

export function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "0 0% 0%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyPalette(colors: {
  color_primary?: string | null;
  color_background?: string | null;
  color_foreground?: string | null;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (colors.color_primary) {
    root.style.setProperty("--primary", hexToHsl(colors.color_primary));
    root.style.setProperty("--primary-container", hexToHsl(colors.color_primary));
    root.style.setProperty("--ring", hexToHsl(colors.color_primary));
  }
  if (colors.color_background) {
    root.style.setProperty("--background", hexToHsl(colors.color_background));
    root.style.setProperty("--surface", hexToHsl(colors.color_background));
  }
  if (colors.color_foreground) {
    root.style.setProperty("--foreground", hexToHsl(colors.color_foreground));
    root.style.setProperty("--on-surface", hexToHsl(colors.color_foreground));
  }
}
