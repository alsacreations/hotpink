/**
 * Convert Hex to RGB
 * @param {string} hex
 * @returns {{r: number, g: number, b: number} | null}
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to HSL
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{h: number, s: number, l: number}}
 */
export function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Calculate relative luminance
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number}
 */
export function getLuminance(r, g, b) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculate contrast ratio
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}
 */
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Get accessible text color (black or white) for a given background color
 * @param {string} hexColor
 * @returns {string} '#000000' or '#ffffff'
 */
export function getAccessibleTextColor(hexColor) {
  const whiteContrast = getContrastRatio(hexColor, "#ffffff");
  const blackContrast = getContrastRatio(hexColor, "#000000");
  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}

/**
 * Convert Hex to OKLCH string (approximation for display)
 * Ideally we would use a library, but for display purposes we can rely on CSS.
 * However, to display the value text, we might want a JS conversion or just use the hex.
 * Let's just return a formatted string if we had the values, but here we will rely on CSS `oklch(from hex ...)` if supported,
 * or just display the hex. The requirement says "Notations associées également affichées : OKLCH".
 * We can use a simple RGB to OKLCH converter or just display "oklch(from [hex] l c h)".
 * Let's implement a basic RGB to OKLCH converter for display.
 */

// Simple sRGB to Linear sRGB
const srgb_transfer_function = (v) => {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

// Linear sRGB to OKLCH
export function hexToOklch(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";

  let r = srgb_transfer_function(rgb.r / 255);
  let g = srgb_transfer_function(rgb.g / 255);
  let b = srgb_transfer_function(rgb.b / 255);

  // Linear sRGB to LMS
  let l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  let m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  let s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  let l_ = Math.cbrt(l);
  let m_ = Math.cbrt(m);
  let s_ = Math.cbrt(s);

  let L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  let a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  let b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  let C = Math.sqrt(a * a + b_ * b_);
  let h = (Math.atan2(b_, a) * 180) / Math.PI;

  if (h < 0) h += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`;
}
