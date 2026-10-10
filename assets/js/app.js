import { namedColors } from "./modules/colors.js";
import {
  hexToRgb,
  rgbToHsl,
  getContrastRatio,
  hexToOklch,
} from "./modules/utils.js";
import { filterFunctions } from "./modules/filters.js";
import { ColorQuiz } from "./modules/quiz.js";
import { palettes } from "./modules/palettes.js";
import { getColorFunFact } from "./modules/funfacts.js";
import { getDominantColor } from "./modules/image-color.js";

// DOM Elements
const searchInput = document.getElementById("color-search");
const suggestionsList = document.getElementById("search-suggestions");
const selectedColorDisplay = document.getElementById("selected-color-display");
const resultsTitle = document.getElementById("results-title");
const nearbyColorsContainer = document.getElementById("nearby-colors");
const favoritesList = document.getElementById("favorites-list");
const palettesList = document.getElementById("palettes-list");

const hueSlider = document.getElementById("hue-slider");
const filterChips = document.querySelectorAll("#special-filters .chip");
const filterDescription = document.getElementById("filter-description");

const imageUpload = document.getElementById("image-upload");
const imageResult = document.getElementById("image-result");
const imageThumb = document.getElementById("image-thumb");
const imageHex = document.getElementById("image-hex");
const imageNear = document.getElementById("image-near");

const marqueeTrack = document.getElementById("marquee-track");
const toast = document.getElementById("toast");

const MARQUEE_COLORS = [
  "hotpink",
  "papayawhip",
  "rebeccapurple",
  "peachpuff",
  "mediumturquoise",
  "gold",
  "tomato",
  "lavenderblush",
  "chartreuse",
  "orchid",
  "lightgoldenrodyellow",
  "cornflowerblue",
];

const FILTER_TITLES = {
  "all-lightness": "Toutes les couleurs (par luminosité) ☀️",
  historical: "Couleurs historiques 🕰️",
  pastel: "Couleurs pastel 🍬",
  vintage: "Couleurs vintage 📻",
  grays: "Niveaux de gris 🐘",
  edible: "Couleurs comestibles 😋",
  plants: "Plantes & Fleurs 🌸",
  minerals: "Minéraux & Pierres 💎",
  system: "Couleurs système 🖥️",
};

const FILTER_DESCRIPTIONS = {
  "all-lightness":
    "L'ensemble des 148 couleurs CSS nommées (147 de CSS3 + rebeccapurple ajoutée en CSS4), hors couleurs système, triées de la plus claire à la plus sombre.",
  historical:
    "Les 16 couleurs originelles du HTML, héritées du système VGA. Elles sont supportées par tous les navigateurs depuis toujours.",
  pastel:
    "Couleurs douces et claires, parfaites pour créer des interfaces délicates et apaisantes.",
  vintage:
    "Palette de couleurs chaudes et terreuses évoquant les années 50 à 70, pour un aspect rétro et nostalgique.",
  grays:
    "Toutes les nuances de gris disponibles en CSS, du noir au blanc. Essentielles pour les hiérarchies visuelles.",
  edible:
    "Couleurs inspirées par la nourriture et les boissons. De quoi donner faim en codant !",
  plants:
    "Couleurs évoquant la nature, les fleurs et les plantes. Apportez une touche végétale à vos interfaces.",
  minerals:
    "Couleurs inspirées par les pierres précieuses et les minéraux. Pour des designs qui brillent !",
  system:
    "Couleurs système qui s'adaptent automatiquement au thème de l'utilisateur (clair/sombre). Leur rendu dépend du navigateur.",
};

const PAGE_TITLES = {
  "all-lightness": "Toutes les couleurs",
  historical: "Couleurs historiques",
  pastel: "Couleurs pastel",
  vintage: "Couleurs vintage",
  grays: "Niveaux de gris",
  edible: "Couleurs comestibles",
  plants: "Plantes & Fleurs",
  minerals: "Minéraux & Pierres",
  system: "Couleurs système",
};

// State
let colorsWithHsl = [];
let currentColor = null;
let favorites =
  JSON.parse(localStorage.getItem("color-finder-favorites")) || [];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Initialize
function init() {
  // Pre-calculate HSL for sorting
  colorsWithHsl = namedColors.map((c) => {
    // System colors don't have hex values: resolve them for display only
    if (c.system) {
      return { ...c, value: resolveSystemColor(c.hex), hsl: { h: 0, s: 0, l: 50 } };
    }
    const rgb = hexToRgb(c.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { ...c, value: c.hex, hsl };
  });

  renderMarquee();
  setupEventListeners();
  renderFavorites();
  renderPalettes();

  // Check URL hash for initial color, "hotpink" by default
  const hash = window.location.hash.slice(1);
  const initial =
    findColor(hash) || colorsWithHsl.find((c) => c.name === "hotpink");
  if (initial) selectColor(initial, { updateHistory: Boolean(hash) });

  // Initialize quiz
  const quiz = new ColorQuiz(colorsWithHsl);
  document
    .getElementById("quiz-btn")
    .addEventListener("click", () => quiz.open());
}

function findColor(name) {
  if (!name) return null;
  return colorsWithHsl.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Resolve a CSS system color keyword (ex. "Canvas") to its hex value
 * @param {string} keyword
 * @returns {string}
 */
function resolveSystemColor(keyword) {
  const probe = document.createElement("span");
  probe.style.color = keyword;
  document.body.appendChild(probe);
  const channels = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [
    0, 0, 0,
  ];
  probe.remove();
  return (
    "#" +
    channels
      .slice(0, 3)
      .map((v) => Math.round(Number(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function getTextColor(hex) {
  return getContrastRatio(hex, "#000000") >= getContrastRatio(hex, "#ffffff")
    ? "#1a0714"
    : "#ffffff";
}

function setupEventListeners() {
  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("keydown", handleKeyDown);

  hueSlider.addEventListener("input", handleHueSlider);
  filterChips.forEach((chip) =>
    chip.addEventListener("click", () => handleSpecialFilter(chip))
  );

  imageUpload.addEventListener("change", handleImageUpload);

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) closeSuggestions();
  });

  // Handle browser back/forward navigation
  window.addEventListener("popstate", () => {
    const color = findColor(window.location.hash.slice(1));
    if (color) selectColor(color, { updateHistory: false });
  });
}

/* ----------------------------------
 * Bandeau défilant
 * ---------------------------------- */
function renderMarquee() {
  const items = [...MARQUEE_COLORS, ...MARQUEE_COLORS]
    .map(
      (name) =>
        `<span class="marquee-item" style="--swatch: ${name}">${name}</span>`
    )
    .join("");
  marqueeTrack.innerHTML = items;
  stopMarqueeSmoothly();
}

/* Ralentit puis arrête le défilement après 3 secondes (WCAG 2.2.2) */
function stopMarqueeSmoothly(delay = 3000, duration = 1500) {
  const animation = marqueeTrack.getAnimations()[0];
  if (!animation) return;

  setTimeout(() => {
    const start = performance.now();
    const initialRate = animation.playbackRate;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      animation.playbackRate = initialRate * (1 - progress * progress);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        animation.pause();
      }
    };
    requestAnimationFrame(tick);
  }, delay);
}

/* ----------------------------------
 * Recherche
 * ---------------------------------- */
function handleSearchInput(e) {
  resetFilters();

  const query = e.target.value.toLowerCase().trim();
  if (query.length < 1) {
    closeSuggestions();
    return;
  }

  renderSuggestions(getMatches(query));
}

function getMatches(query) {
  return colorsWithHsl
    .filter((c) => c.name.toLowerCase().includes(query))
    .sort(
      (a, b) =>
        b.name.toLowerCase().startsWith(query) -
          a.name.toLowerCase().startsWith(query) ||
        a.name.length - b.name.length
    );
}

// Keyboard Navigation State
let currentFocus = -1;

function handleKeyDown(e) {
  const items = suggestionsList.querySelectorAll("li");
  if (e.key === "ArrowDown") {
    currentFocus++;
    addActive(items);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    currentFocus--;
    addActive(items);
    e.preventDefault();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentFocus > -1 && items[currentFocus]) {
      items[currentFocus].click();
    } else {
      // Exact match first, then first suggestion
      const query = searchInput.value.toLowerCase().trim();
      const color = findColor(query) || getMatches(query)[0];
      if (query && color) pickSuggestion(color);
    }
  } else if (e.key === "Escape") {
    closeSuggestions();
  }
}

function addActive(items) {
  if (!items.length) return;
  removeActive(items);
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;

  items[currentFocus].classList.add("suggestion-active");
  items[currentFocus].setAttribute("aria-selected", "true");
  searchInput.setAttribute("aria-activedescendant", items[currentFocus].id);
  items[currentFocus].scrollIntoView({ block: "nearest" });
}

function removeActive(items) {
  items.forEach((item) => {
    item.classList.remove("suggestion-active");
    item.setAttribute("aria-selected", "false");
  });
  searchInput.removeAttribute("aria-activedescendant");
}

function closeSuggestions() {
  suggestionsList.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  currentFocus = -1;
}

function renderSuggestions(matches) {
  suggestionsList.innerHTML = "";
  currentFocus = -1;

  if (matches.length === 0) {
    closeSuggestions();
    return;
  }

  matches.slice(0, 10).forEach((color, index) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.id = `suggestion-${index}`;
    li.role = "option";
    li.setAttribute("aria-selected", "false");
    li.innerHTML = `
      <span class="suggestion-swatch" style="--swatch: ${color.hex}" aria-hidden="true"></span>
      <span>${color.name}</span>
      <span class="suggestion-hex">${formatHex(color)}</span>
    `;
    li.addEventListener("click", () => pickSuggestion(color));
    suggestionsList.appendChild(li);
  });

  suggestionsList.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function pickSuggestion(color) {
  searchInput.value = color.name;
  closeSuggestions();
  selectColor(color, { scroll: true });
}

function formatHex(color) {
  return color.system ? color.value.toUpperCase() : color.hex.toUpperCase();
}

/* ----------------------------------
 * Filtres (teinte et filtres originaux)
 * ---------------------------------- */
function resetFilters() {
  filterChips.forEach((chip) => chip.setAttribute("aria-pressed", "false"));
}

function handleHueSlider(e) {
  resetFilters();
  searchInput.value = "";
  closeSuggestions();

  const hue = parseInt(e.target.value, 10);
  hueSlider.style.setProperty("--hue-color", `hsl(${hue} 95% 60%)`);

  // Filter colors within +/- 20 degrees of the selected hue
  // Handle wrap-around (0/360)
  const matches = colorsWithHsl.filter((c) => {
    // Skip grays and system colors for hue filtering
    if (c.system || c.hsl.s < 5) return false;

    let diff = Math.abs(c.hsl.h - hue);
    if (diff > 180) diff = 360 - diff;
    return diff < 20;
  });

  // Sort by lightness to make it look nice
  matches.sort((a, b) => b.hsl.l - a.hsl.l);

  renderList({
    title: `Teinte ${hue}° (${pluralize(matches.length)})`,
    colors: matches,
    emptyText: "Aucune couleur trouvée pour cette teinte.",
  });
}

function handleSpecialFilter(chip) {
  const filterType = chip.dataset.filter;
  const wasActive = chip.getAttribute("aria-pressed") === "true";

  resetFilters();
  searchInput.value = "";
  closeSuggestions();

  // Second click on the active chip: back to nearby colors
  if (wasActive) {
    if (currentColor) selectColor(currentColor, { updateHistory: false });
    return;
  }

  chip.setAttribute("aria-pressed", "true");

  const filterFn = filterFunctions[filterType];
  if (!filterFn) return;

  // Sort by lightness (descending) for better aesthetics
  const matches = filterFn(colorsWithHsl).sort((a, b) => b.hsl.l - a.hsl.l);

  document.title = `Hotpink - ${PAGE_TITLES[filterType] || "Filtre"}`;
  renderList({
    title: `${FILTER_TITLES[filterType] || "Résultats du filtre"} (${pluralize(
      matches.length
    )})`,
    description: FILTER_DESCRIPTIONS[filterType],
    colors: matches,
    emptyText: "Aucune couleur trouvée pour ce filtre.",
  });
}

function pluralize(count) {
  return `${count} couleur${count > 1 ? "s" : ""}`;
}

/* ----------------------------------
 * Liste de couleurs (proches, filtres, palettes)
 * ---------------------------------- */
function renderList({ title, description = "", colors, emptyText = "" }) {
  resultsTitle.textContent = title;
  filterDescription.textContent = description;
  filterDescription.hidden = !description;

  nearbyColorsContainer.innerHTML = "";
  if (colors.length === 0) {
    nearbyColorsContainer.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }
  colors.forEach((c) => nearbyColorsContainer.appendChild(createColorCard(c)));
}

function createColorCard(color) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "color-card";
  button.innerHTML = `
    <span class="color-card-swatch" style="--swatch: ${color.hex}"></span>
    <span class="color-card-name">${color.name}</span>
    <span class="color-card-hex">${formatHex(color)}</span>
  `;
  button.addEventListener("click", () => {
    searchInput.value = "";
    closeSuggestions();
    selectColor(color, { scroll: true });
  });
  return button;
}

/* ----------------------------------
 * Sélection d'une couleur
 * ---------------------------------- */
function selectColor(color, { updateHistory = true, scroll = false } = {}) {
  currentColor = color;

  if (updateHistory && window.location.hash.slice(1) !== color.name) {
    window.history.pushState({}, "", `#${color.name}`);
  }
  document.title = `Hotpink - couleur ${color.name}`;

  // Update slider position
  if (!color.system) {
    const hue = Math.round(color.hsl.h);
    hueSlider.value = hue;
    hueSlider.style.setProperty("--hue-color", `hsl(${hue} 95% 60%)`);
  }

  resetFilters();
  renderSelectedColor(color);
  renderNearbyColors(color);

  if (scroll) {
    selectedColorDisplay.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }
}

function getLevel(ratio) {
  if (ratio >= 7) return "Contraste OK AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA grand texte";
  return "Contraste insuffisant";
}

function formatRatio(ratio) {
  return `${ratio.toFixed(2).replace(".", ",")}:1`;
}

function renderSelectedColor(color) {
  const hex = color.value;
  const rgb = hexToRgb(hex);
  const textColor = getTextColor(hex);
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

  selectedColorDisplay.style.setProperty("--swatch", color.hex);
  selectedColorDisplay.style.setProperty("--on-swatch", textColor);
  selectedColorDisplay.innerHTML = `
    <div class="color-sheet-preview">
      <div class="color-sheet-top">
        <span class="color-sheet-tag">Couleur sélectionnée</span>
        <button type="button" class="fav-btn" id="toggle-fav-btn"></button>
      </div>
      <div class="color-sheet-name" style="--name-len: ${color.name.length}">
        <h2>${color.name}</h2>
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

  const favBtn = document.getElementById("toggle-fav-btn");
  updateFavButton(favBtn, color);
  favBtn.addEventListener("click", () => {
    toggleFavorite(color.name);
    updateFavButton(favBtn, color);
    favBtn.classList.remove("is-popping");
    // Force reflow to replay the animation
    void favBtn.offsetWidth;
    favBtn.classList.add("is-popping");
  });

  selectedColorDisplay.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => copyValue(btn.dataset.value));
  });
}

function updateFavButton(button, color) {
  const isFav = favorites.includes(color.name);
  const label = isFav ? "Retirer des favoris" : "Ajouter aux favoris";
  button.setAttribute("aria-pressed", String(isFav));
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = `<span aria-hidden="true">${isFav ? "★" : "☆"}</span>`;
}

async function copyValue(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(`✓ ${value} copié !`);
  } catch (err) {
    console.error("Failed to copy!", err);
  }
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

function renderNearbyColors(targetColor) {
  const nearby = getNearbyColors(targetColor, 12);

  // Sort by lightness for better display
  nearby.sort((a, b) => b.hsl.l - a.hsl.l);

  renderList({ title: "Couleurs proches", colors: nearby });
}

function getNearbyColors(targetColor, count) {
  return colorsWithHsl
    .filter((c) => !c.system && c.name !== targetColor.name)
    .sort(
      (a, b) =>
        getColorDistance(targetColor, a) - getColorDistance(targetColor, b)
    )
    .slice(0, count);
}

function getColorDistance(c1, c2) {
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

/* ----------------------------------
 * Favoris
 * ---------------------------------- */
function toggleFavorite(colorName) {
  if (favorites.includes(colorName)) {
    favorites = favorites.filter((f) => f !== colorName);
  } else {
    favorites.push(colorName);
  }
  localStorage.setItem("color-finder-favorites", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  favoritesList.innerHTML = "";
  const favColors = favorites.map(findColor).filter(Boolean);

  if (favColors.length === 0) {
    favoritesList.innerHTML =
      '<p class="empty-state">Aucun favori pour le moment.</p>';
    return;
  }

  favColors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fav-item";
    button.setAttribute("aria-label", `${color.name}, sélectionner la couleur`);
    button.innerHTML = `
      <span class="fav-item-swatch" style="--swatch: ${color.hex}"></span>
      <span class="fav-item-name">${color.name}</span>
    `;
    button.addEventListener("click", () =>
      selectColor(color, { scroll: true })
    );
    favoritesList.appendChild(button);
  });
}

/* ----------------------------------
 * Palettes
 * ---------------------------------- */
function renderPalettes() {
  palettesList.innerHTML = "";
  palettes.forEach((palette) => {
    palettesList.appendChild(createPaletteCard(palette));
  });
}

function createPaletteCard(palette) {
  const card = document.createElement("div");
  card.className = "palette-card";

  const stripes = document.createElement("div");
  stripes.className = "palette-stripes";

  palette.colors.forEach((colorName) => {
    const color = findColor(colorName);
    if (!color) return;
    const stripe = document.createElement("button");
    stripe.type = "button";
    stripe.className = "palette-stripe";
    stripe.title = color.name;
    stripe.setAttribute("aria-label", `${color.name}, sélectionner la couleur`);
    stripe.style.setProperty("--swatch", color.hex);
    stripe.style.setProperty("--on-swatch", getTextColor(color.value));
    stripe.innerHTML = `<span aria-hidden="true">${color.name}</span>`;
    stripe.addEventListener("click", () =>
      selectColor(color, { scroll: true })
    );
    stripes.appendChild(stripe);
  });

  const name = document.createElement("button");
  name.type = "button";
  name.className = "palette-name";
  name.textContent = palette.name;
  name.setAttribute("aria-label", `Afficher la palette ${palette.name}`);
  name.addEventListener("click", () => loadPalette(palette));

  card.append(stripes, name);
  return card;
}

function loadPalette(palette) {
  resetFilters();
  document.title = `Hotpink - Palette ${palette.name}`;

  renderList({
    title: `Palette : ${palette.name}`,
    description: `Couleurs : ${palette.colors.join(", ")}`,
    colors: palette.colors.map(findColor).filter(Boolean),
  });

  nearbyColorsContainer.parentElement.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

/* ----------------------------------
 * Couleur depuis une image
 * ---------------------------------- */
let imageObjectUrl = null;

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  searchInput.value = "";
  closeSuggestions();

  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = URL.createObjectURL(file);

  const img = new Image();
  img.onload = () => {
    const dominantColor = getDominantColor(img);
    const closestColor = findClosestNamedColor(dominantColor);

    imageThumb.src = imageObjectUrl;
    imageHex.textContent = dominantColor.hex.toUpperCase();
    imageNear.textContent = closestColor.name;
    imageResult.hidden = false;

    selectColor(closestColor, { scroll: true });
  };
  img.src = imageObjectUrl;
}

function findClosestNamedColor(rgb) {
  const targetColor = { hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };

  let closest = null;
  let minDistance = Infinity;

  colorsWithHsl.forEach((color) => {
    if (color.system) return;

    const distance = getColorDistance(targetColor, color);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  });

  return closest;
}

// Run
init();
