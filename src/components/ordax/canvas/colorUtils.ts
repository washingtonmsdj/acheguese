/**
 * Color utility functions for canvas rendering
 */

export function hslToHsla(hsl: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const t = (hsl || "").trim();
  if (t.startsWith("hsla(")) return t;

  // Accept Tailwind-style HSL triplet strings: "210 100% 50%"
  const triplet = t.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (triplet) {
    const [, h, s, l] = triplet;
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }

  if (!t.startsWith("hsl(")) return t;
  return t.replace(/^hsl\(/, "hsla(").replace(/\)\s*$/, `, ${a})`);
}

export function normalizeCssColor(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const t = input.trim();
  if (!t) return fallback;
  if (t.startsWith("hsl(") || t.startsWith("hsla(") || t.startsWith("#") || t.startsWith("rgb(")) return t;
  
  // Tailwind-style HSL triplet
  const triplet = t.match(/^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (triplet) {
    const [, h, s, l] = triplet;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return fallback;
}
