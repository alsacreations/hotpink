/**
 * Génère le site statique dans dist/ :
 * - une page par couleur nommée (/red/index.html, /hotpink/index.html…)
 * - une page par filtre (/couleurs-pastel/index.html…)
 *   avec contenu pré-rendu, meta SEO, données structurées et image Open Graph
 * - sitemap.xml et robots.txt
 *
 * Usage : node scripts/build.mjs
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { namedColors } from "../assets/js/modules/colors.js";
import { FILTER_SLUGS, PAGE_TITLES } from "../assets/js/modules/filters.js";
import { getColorFunFact } from "../assets/js/modules/funfacts.js";
import { hexToOklch } from "../assets/js/modules/utils.js";
import {
  colorCardHtml,
  colorPath,
  colorSheetHtml,
  colorSheetStyle,
  colorTitle,
  filterDescription,
  filterHeading,
  filterPageTitle,
  filterPath,
  getFilterColors,
  getNearbyColors,
  withHsl,
} from "../assets/js/modules/render.js";
import { renderColorOgImage, renderDefaultOgImage } from "./og-image.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://hotpink.alsacreations.com";

const escapeAttr = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

function assertMatch(source, pattern) {
  if (!pattern.test(source)) {
    throw new Error(`Motif introuvable dans index.html : ${pattern}`);
  }
}

/** Remplace une portion du gabarit, sinon échoue (gabarit modifié ?) */
function replaceOnce(source, pattern, replacement) {
  assertMatch(source, pattern);
  return source.replace(pattern, () => replacement);
}

/** Remplace la valeur d'un attribut capturé entre deux groupes : (avant)valeur(après) */
function setAttribute(source, pattern, value) {
  assertMatch(source, pattern);
  return source.replace(pattern, (_, before, after) => before + value + after);
}

/**
 * Applique les métadonnées de page (title, description, canonical, Open Graph,
 * JSON-LD) au gabarit.
 */
function applyMeta(html, { title, description, url, image, imageAlt, jsonLd }) {
  const safeTitle = escapeAttr(title);
  const safeDescription = escapeAttr(description);

  html = replaceOnce(html, /<title>.*?<\/title>/s, `<title>${safeTitle}</title>`);
  html = setAttribute(html, /(<meta\s+name="description"\s+content=")[^"]*(")/s, safeDescription);
  html = setAttribute(html, /(<link rel="canonical" href=")[^"]*(")/, url);
  html = setAttribute(html, /(<meta property="og:title" content=")[^"]*(")/, safeTitle);
  html = setAttribute(html, /(<meta\s+property="og:description"\s+content=")[^"]*(")/s, safeDescription);
  html = setAttribute(html, /(<meta property="og:url" content=")[^"]*(")/, url);
  html = setAttribute(html, /(<meta\s+property="og:image"\s+content=")[^"]*(")/s, image);
  html = setAttribute(html, /(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/s, escapeAttr(imageAlt));
  return replaceOnce(
    html,
    /<\/head>/,
    `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`
  );
}

/** Le h1 « Hotpink » du bandeau devient un simple paragraphe hors accueil */
function demoteBrandTitle(html) {
  const pattern = /<h1 class="brand-title">([\s\S]*?)<\/h1>/;
  assertMatch(html, pattern);
  return html.replace(pattern, (_, inner) => `<p class="brand-title">${inner}</p>`);
}

/* ----------------------------------
 * Pages de couleurs
 * ---------------------------------- */
function buildColorDescription(color) {
  const fact = stripHtml(getColorFunFact(color.name));
  const text = `${color.name} : couleur CSS nommée ${color.hex.toUpperCase()} (${hexToOklch(color.hex)}). ${fact}`;
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

function buildColorPage(template, color, colors) {
  const url = `${SITE_URL}${colorPath(color)}`;
  const description = buildColorDescription(color);
  const nearby = getNearbyColors(color, colors, 12);

  let html = applyMeta(template, {
    title: colorTitle(color),
    description,
    url,
    image: `${SITE_URL}/og/${color.name.toLowerCase()}.png`,
    imageAlt: `Couleur CSS ${color.name} (${color.hex.toUpperCase()})`,
    jsonLd: {
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
    },
  });

  html = demoteBrandTitle(html);
  html = replaceOnce(
    html,
    /<section\s+id="selected-color-display"\s+class="color-sheet"\s+aria-label="Couleur sélectionnée"\s*>\s*<\/section>/,
    `<section id="selected-color-display" class="color-sheet" aria-label="Couleur sélectionnée" style="${colorSheetStyle(color)}">${colorSheetHtml(color, "h1")}</section>`
  );
  return replaceOnce(
    html,
    /<div id="nearby-colors" class="grid-colors"><\/div>/,
    `<div id="nearby-colors" class="grid-colors">${nearby.map(colorCardHtml).join("")}</div>`
  );
}

/* ----------------------------------
 * Pages de filtres
 * ---------------------------------- */
function buildFilterPage(template, key, colors) {
  const matches = getFilterColors(key, colors);
  const url = `${SITE_URL}${filterPath(key)}`;
  const description = filterDescription(key);

  let html = applyMeta(template, {
    title: filterPageTitle(key, matches.length),
    description,
    url,
    image: `${SITE_URL}/og/${FILTER_SLUGS[key]}.png`,
    imageAlt: PAGE_TITLES[key],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_TITLES[key],
      description,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: matches.length,
        itemListElement: matches.map((color, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: color.name,
          url: `${SITE_URL}${colorPath(color)}`,
        })),
      },
    },
  });

  html = demoteBrandTitle(html);
  // La fiche couleur est masquée sur une page de filtre
  html = replaceOnce(
    html,
    /<section\s+id="selected-color-display"\s+class="color-sheet"/,
    `<section id="selected-color-display" class="color-sheet" hidden`
  );
  html = replaceOnce(
    html,
    /<h2 id="results-title" class="section-title">.*?<\/h2>/,
    `<h1 id="results-title" class="section-title">${filterHeading(key, matches.length)}</h1>`
  );
  html = replaceOnce(
    html,
    /<p id="filter-description" class="filter-description" hidden><\/p>/,
    `<p id="filter-description" class="filter-description">${description}</p>`
  );
  html = setAttribute(
    html,
    new RegExp(`(data-filter="${key}" aria-pressed=")false(")`),
    "true"
  );
  return replaceOnce(
    html,
    /<div id="nearby-colors" class="grid-colors"><\/div>/,
    `<div id="nearby-colors" class="grid-colors">${matches.map(colorCardHtml).join("")}</div>`
  );
}

/** Échantillon réparti uniformément (pour varier les pastilles de l'image) */
function pickSpread(items, count) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, i) =>
    items[Math.floor((i * (items.length - 1)) / (count - 1))]
  );
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
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
  write(join(DIST, "index.html"), template);
  write(join(DIST, "og", "default.png"), renderDefaultOgImage({
    swatches: ["hotpink", "papayawhip", "mediumturquoise", "gold", "rebeccapurple", "tomato", "orchid", "chartreuse"],
  }));

  const colors = namedColors.filter((c) => !c.system).map(withHsl);

  // Une page (et une image Open Graph) par couleur nommée
  for (const color of colors) {
    const slug = color.name.toLowerCase();
    write(join(DIST, slug, "index.html"), buildColorPage(template, color, colors));
    write(join(DIST, "og", `${slug}.png`), renderColorOgImage(color));
  }

  // Une page (et une image Open Graph) par filtre
  const filterKeys = Object.keys(FILTER_SLUGS);
  for (const key of filterKeys) {
    const slug = FILTER_SLUGS[key];
    write(join(DIST, slug, "index.html"), buildFilterPage(template, key, colors));
    write(join(DIST, "og", `${slug}.png`), renderDefaultOgImage({
      title: PAGE_TITLES[key],
      subtitle: "Les couleurs nommées du Web et leur histoire",
      swatches: pickSpread(getFilterColors(key, colors), 8).map((c) => c.hex),
    }));
  }

  // Sitemap et robots.txt
  const paths = ["/", ...filterKeys.map(filterPath), ...colors.map(colorPath)];
  const urls = paths.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n");
  write(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  write(
    join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  console.log(`✓ ${colors.length} pages de couleurs + ${filterKeys.length} pages de filtres générées dans dist/`);
}

main();
