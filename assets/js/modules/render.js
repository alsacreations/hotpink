/**
 * Rendu HTML pur (sans DOM), partagé entre l'application (navigateur)
 * et le script de génération des pages statiques (Node).
 */
import {
  hexToRgb,
  rgbToHsl,
  getContrastRatio,
  hexToOklch,
} from "./utils.js";
import { getColorFunFact } from "./funfacts.js";
import {
  FILTER_DESCRIPTIONS,
  FILTER_SLUGS,
  FILTER_TITLES,
  PAGE_TITLES,
  filterFunctions,
} from "./filters.js";

export const SITE_NAME = "Hotpink";

/** URL (chemin) d'une couleur : /hotpink/ */
export function colorPath(color) {
  return `/${color.name.toLowerCase()}/`;
}

export function colorTitle(color) {
  return `${color.name} (${color.hex.toUpperCase()}) : couleur CSS nommée | ${SITE_NAME}`;
}

export function pluralize(count) {
  return `${count} couleur${count > 1 ? "s" : ""}`;
}

/* ----------------------------------
 * Pages de filtres (/couleurs-pastel/…)
 * ---------------------------------- */
export function filterPath(key) {
  return `/${FILTER_SLUGS[key]}/`;
}

/** Clé de filtre à partir d'un slug d'URL, sinon null */
export function findFilterBySlug(slug) {
  return Object.keys(FILTER_SLUGS).find((key) => FILTER_SLUGS[key] === slug) ?? null;
}

export function filterPageTitle(key, count) {
  return `${PAGE_TITLES[key]} : ${count} couleurs CSS nommées | ${SITE_NAME}`;
}

export function filterHeading(key, count) {
  return `${FILTER_TITLES[key]} (${pluralize(count)})`;
}

export function filterDescription(key) {
  return FILTER_DESCRIPTIONS[key];
}

/** Couleurs d'un filtre, triées de la plus claire à la plus sombre */
export function getFilterColors(key, colors) {
  return filterFunctions[key](colors).sort((a, b) => b.hsl.l - a.hsl.l);
}

/** Ajoute la teinte/saturation/luminosité à une couleur non système */
export function withHsl(color) {
  const rgb = hexToRgb(color.hex);
  return { ...color, value: color.hex, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };
}

export function getTextColor(hex) {
  return getContrastRatio(hex, "#000000") >= getContrastRatio(hex, "#ffffff")
    ? "#1a0714"
    : "#ffffff";
}

export function getLevel(ratio) {
  if (ratio >= 7) return "Contraste OK AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA grand texte";
  return "Contraste insuffisant";
}

export function formatRatio(ratio) {
  return `${ratio.toFixed(2).replace(".", ",")}:1`;
}

export function formatHex(color) {
  return color.system ? color.value.toUpperCase() : color.hex.toUpperCase();
}

/* ----------------------------------
 * Couleurs proches
 * ---------------------------------- */
export function getColorDistance(c1, c2) {
  // For grays (low saturation), ignore hue and focus on lightness
  const isGray1 = c1.hsl.s < 10;
  const isGray2 = c2.hsl.s < 10;

  // If both are grays, only compare saturation and lightness
  if (isGray1 && isGray2) {
    return Math.sqrt(
      Math.pow(c1.hsl.s - c2.hsl.s, 2) + Math.pow(c1.hsl.l - c2.hsl.l, 2)
    );
  }

  // If one is gray and the other isn't, they're far apart
  if (isGray1 !== isGray2) {
    return 1000;
  }

  // Hue is circular (0-360)
  let hDiff = Math.abs(c1.hsl.h - c2.hsl.h);
  if (hDiff > 180) hDiff = 360 - hDiff;

  // Weight hue more heavily for colored items
  return Math.sqrt(
    Math.pow(hDiff * 2, 2) +
      Math.pow(c1.hsl.s - c2.hsl.s, 2) +
      Math.pow(c1.hsl.l - c2.hsl.l, 2)
  );
}

/**
 * Couleurs proches d'une couleur, triées de la plus claire à la plus sombre
 * @param {object} targetColor
 * @param {object[]} colors - couleurs avec `hsl`
 * @param {number} count
 */
export function getNearbyColors(targetColor, colors, count = 12) {
  return colors
    .filter((c) => !c.system && c.name !== targetColor.name)
    .sort(
      (a, b) =>
        getColorDistance(targetColor, a) - getColorDistance(targetColor, b)
    )
    .slice(0, count)
    .sort((a, b) => b.hsl.l - a.hsl.l);
}

/* ----------------------------------
 * Carte de couleur (lien vers la page de la couleur)
 * ---------------------------------- */
export function colorCardInnerHtml(color) {
  return `
    <span class="color-card-swatch" style="--swatch: ${color.hex}"></span>
    <span class="color-card-name">${color.name}</span>
    <span class="color-card-hex">${formatHex(color)}</span>
  `;
}

export function colorCardHtml(color) {
  return `<a class="color-card" href="${colorPath(color)}">${colorCardInnerHtml(color)}</a>`;
}

/* ----------------------------------
 * Fiche de la couleur sélectionnée
 * ---------------------------------- */
export function colorSheetStyle(color) {
  return `--swatch: ${color.hex}; --on-swatch: ${getTextColor(color.value)}`;
}

/**
 * @param {object} color
 * @param {"h1"|"h2"} headingTag - h1 sur la page dédiée à la couleur
 */
export function colorSheetHtml(color, headingTag = "h2") {
  const hex = color.value;
  const rgb = hexToRgb(hex);
  const contrastBlack = getContrastRatio(hex, "#000000");
  const contrastWhite = getContrastRatio(hex, "#ffffff");

  const values = [
    { label: "HEX", value: hex.toUpperCase() },
    { label: "OKLCH", value: hexToOklch(hex) },
    { label: "RGB", value: `rgb(${rgb.r} ${rgb.g} ${rgb.b})` },
  ];

  const valueRows = values
    .map(
      ({ label, value }) => `
        <div class="color-value-row">
          <span class="color-value-label" lang="en">${label}</span>
          <span class="color-value-text">${value}</span>
          <button type="button" class="copy-btn" data-value="${value}" aria-label="Copier la valeur ${label}">Copier</button>
        </div>`
    )
    .join("");

  const contrastTile = (label, text, ratio) => `
    <div class="contrast-tile" style="--tile-text: ${text}; --tile-bg: ${
    text === "#000000" ? "#ffffff" : "#2b0b22"
  }">
      <span class="contrast-tile-sample" aria-hidden="true">Aa</span>
      <span class="contrast-tile-ratio">${label} · ${formatRatio(ratio)}</span>
      <span class="contrast-tile-level">${getLevel(ratio)}</span>
    </div>`;

  return `
    <div class="color-sheet-preview">
      <div class="color-sheet-top">
        <span class="color-sheet-tag">Couleur sélectionnée</span>
        <button type="button" class="fav-btn" id="toggle-fav-btn"></button>
      </div>
      <div class="color-sheet-name" style="--name-len: ${color.name.length}">
        <${headingTag}>${color.name}</${headingTag}>
        <span>${hex.toUpperCase()}</span>
      </div>
    </div>
    <div class="color-sheet-info">
      <p class="color-funfact">${getColorFunFact(color.name)}</p>
      <div class="color-values">${valueRows}</div>
      <div class="contrast-tiles">
        ${contrastTile("Texte noir", "#000000", contrastBlack)}
        ${contrastTile("Texte blanc", "#ffffff", contrastWhite)}
      </div>
    </div>
  `;
}
