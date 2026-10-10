/**
 * Génère le site statique dans dist/ :
 * - une page par couleur nommée (/red/index.html, /hotpink/index.html…)
 *   avec contenu pré-rendu, meta SEO et données structurées
 * - sitemap.xml et robots.txt
 *
 * Usage : node scripts/build.mjs
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { namedColors } from "../assets/js/modules/colors.js";
import { getColorFunFact } from "../assets/js/modules/funfacts.js";
import { hexToOklch } from "../assets/js/modules/utils.js";
import {
  colorCardHtml,
  colorPath,
  colorSheetHtml,
  colorSheetStyle,
  colorTitle,
  getNearbyColors,
  withHsl,
} from "../assets/js/modules/render.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://hotpink.alsacreations.com";

const escapeAttr = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

/** Remplace exactement une occurrence, sinon échoue (template modifié ?) */
function replaceOnce(source, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error(`Motif introuvable dans index.html : ${pattern}`);
  }
  return source.replace(pattern, () => replacement);
}

/** Remplace la valeur d'un attribut capturé entre deux groupes : (avant)valeur(après) */
function setAttribute(source, pattern, value) {
  if (!pattern.test(source)) {
    throw new Error(`Motif introuvable dans index.html : ${pattern}`);
  }
  return source.replace(pattern, (_, before, after) => before + value + after);
}

function buildDescription(color) {
  const fact = stripHtml(getColorFunFact(color.name));
  const intro = `${color.name} : couleur CSS nommée ${color.hex.toUpperCase()} (${hexToOklch(color.hex)}).`;
  const text = `${intro} ${fact}`;
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

function buildPage(template, color, colors) {
  const url = `${SITE_URL}${colorPath(color)}`;
  const title = escapeAttr(colorTitle(color));
  const description = escapeAttr(buildDescription(color));
  const nearby = getNearbyColors(color, colors, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: color.name,
    termCode: color.hex.toUpperCase(),
    description: stripHtml(getColorFunFact(color.name)),
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Couleurs nommées CSS",
      url: `${SITE_URL}/`,
    },
  };

  let html = template;
  html = replaceOnce(html, /<title>.*?<\/title>/s, `<title>${title}</title>`);
  html = setAttribute(html, /(<meta\s+name="description"\s+content=")[^"]*(")/s, description);
  html = setAttribute(html, /(<link rel="canonical" href=")[^"]*(")/, url);
  html = setAttribute(html, /(<meta property="og:title" content=")[^"]*(")/, title);
  html = setAttribute(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/s, description);
  html = setAttribute(html, /(<meta property="og:url" content=")[^"]*(")/, url);
  html = replaceOnce(
    html,
    /<\/head>/,
    `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`
  );

  // Contenu pré-rendu (réhydraté par app.js au chargement)
  html = replaceOnce(
    html,
    /<section\s+id="selected-color-display"\s+class="color-sheet"\s+aria-label="Couleur sélectionnée"\s*>\s*<\/section>/,
    `<section id="selected-color-display" class="color-sheet" aria-label="Couleur sélectionnée" style="${colorSheetStyle(color)}">${colorSheetHtml(color)}</section>`
  );
  html = replaceOnce(
    html,
    /<div id="nearby-colors" class="grid-colors"><\/div>/,
    `<div id="nearby-colors" class="grid-colors">${nearby.map(colorCardHtml).join("")}</div>`
  );

  return html;
}

function main() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  // Fichiers statiques
  cpSync(join(ROOT, "assets"), join(DIST, "assets"), { recursive: true });
  for (const file of ["CNAME", "styleguide.html"]) {
    cpSync(join(ROOT, file), join(DIST, file));
  }

  const template = readFileSync(join(ROOT, "index.html"), "utf8");
  writeFileSync(join(DIST, "index.html"), template);

  // Une page par couleur nommée (hors couleurs système)
  const colors = namedColors.filter((c) => !c.system).map(withHsl);
  for (const color of colors) {
    const dir = join(DIST, color.name.toLowerCase());
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), buildPage(template, color, colors));
  }

  // Sitemap et robots.txt
  const urls = ["/", ...colors.map(colorPath)]
    .map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`)
    .join("\n");
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  writeFileSync(
    join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  console.log(`✓ ${colors.length} pages générées dans dist/`);
}

main();
