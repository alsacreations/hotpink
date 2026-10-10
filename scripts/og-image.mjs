/**
 * Génération des images Open Graph (1200×630) en PNG.
 * SVG rasterisé avec resvg, polices embarquées dans scripts/fonts/.
 */
import { Resvg } from "@resvg/resvg-js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getTextColor } from "../assets/js/modules/render.js";

const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const FONT_FILES = [
  join(FONTS_DIR, "chicle-v27-latin-regular.ttf"),
  join(FONTS_DIR, "lexend-v26-latin-variable.ttf"),
];

const WIDTH = 1200;
const HEIGHT = 630;
const INK = "#1a0714";
const PRIMARY = "#ff69b4";
const DOMAIN = "hotpink.alsacreations.com";

const escapeXml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function toPng(svg) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: "Lexend",
    },
  })
    .render()
    .asPng();
}

/** Image d'une couleur : aplat de la couleur, nom en grand, code HEX */
export function renderColorOgImage({ name, hex }) {
  const fg = getTextColor(hex);
  // Largeur moyenne d'un caractère de Chicle ≈ 0.5em
  const nameSize = Math.min(200, Math.floor(1040 / (name.length * 0.4)));
  const nameY = HEIGHT - 120;

  return toPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${hex}"/>
  <rect x="30" y="30" width="${WIDTH - 60}" height="${HEIGHT - 60}" rx="56" fill="none" stroke="${fg}" stroke-width="10"/>
  <text x="80" y="120" font-family="Chicle" font-size="64" fill="${fg}">Hotpink</text>
  <text x="${WIDTH - 80}" y="116" font-family="Lexend" font-size="30" font-weight="500" text-anchor="end" fill="${fg}">couleur CSS nommée</text>
  <text x="82" y="${nameY - nameSize * 0.85}" font-family="Lexend" font-size="44" font-weight="500" fill="${fg}">${hex.toUpperCase()}</text>
  <text x="76" y="${nameY}" font-family="Chicle" font-size="${nameSize}" fill="${fg}">${name}</text>
  <text x="${WIDTH - 80}" y="${HEIGHT - 66}" font-family="Lexend" font-size="26" font-weight="500" text-anchor="end" fill="${fg}">${DOMAIN}</text>
</svg>`);
}

/** Image par défaut (accueil, pages de filtres) : bandeau de pastilles de couleurs */
export function renderDefaultOgImage({
  title = "Hotpink",
  subtitle = "Les couleurs nommées du Web et leur histoire",
  swatches = [],
} = {}) {
  const dots = swatches
    .slice(0, 8)
    .map(
      (color, i) =>
        `<circle cx="${130 + i * 134}" cy="${HEIGHT - 120}" r="52" fill="${color}" stroke="${INK}" stroke-width="8"/>`
    )
    .join("");
  const titleSize = Math.min(190, Math.floor(1040 / (title.length * 0.42)));

  return toPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PRIMARY}"/>
  <rect x="30" y="30" width="${WIDTH - 60}" height="${HEIGHT - 60}" rx="56" fill="none" stroke="${INK}" stroke-width="10"/>
  <text x="80" y="${titleSize + 50}" font-family="Chicle" font-size="${titleSize}" fill="${INK}">${escapeXml(title)}</text>
  <text x="84" y="${titleSize + 120}" font-family="Lexend" font-size="38" font-weight="500" fill="${INK}">${escapeXml(subtitle)}</text>
  ${dots}
  <text x="84" y="${titleSize + 185}" font-family="Lexend" font-size="28" font-weight="500" fill="${INK}">${DOMAIN}</text>
</svg>`);
}
