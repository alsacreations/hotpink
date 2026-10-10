import { namedColors } from "./modules/colors.js";
import { hexToRgb, rgbToHsl } from "./modules/utils.js";
import {
  colorCardInnerHtml,
  colorPath,
  colorSheetHtml,
  colorSheetStyle,
  colorTitle,
  filterDescription as getFilterDescription,
  filterHeading,
  filterPageTitle,
  filterPath,
  findFilterBySlug,
  formatHex,
  getFilterColors,
  getTextColor,
  pluralize,
  getColorDistance,
  getNearbyColors,
} from "./modules/render.js";
import { FILTER_SLUGS, PAGE_TITLES, filterFunctions } from "./modules/filters.js";
import { ColorQuiz } from "./modules/quiz.js";
import { palettes } from "./modules/palettes.js";
import { getDominantColor } from "./modules/image-color.js";

// DOM Elements
const searchInput = document.getElementById("color-search");
const suggestionsList = document.getElementById("search-suggestions");
const selectedColorDisplay = document.getElementById("selected-color-display");
let resultsTitle = document.getElementById("results-title");
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

// State
let colorsWithHsl = [];
let currentColor = null;
let pageMode = "home"; // "home" | "color" | "filter"
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

  // Page initiale : /red/ (couleur), /couleurs-pastel/ (filtre), ancien
  // format #red (redirigé vers /red/), sinon "hotpink" sur l'accueil
  const fromPath = findColor(getPathSlug());
  const fromHash = findColor(window.location.hash.slice(1));
  const filterKey = fromPath ? null : findFilterBySlug(getPathSlug());

  if (!fromPath && fromHash) {
    window.history.replaceState({}, "", colorPath(fromHash));
  }

  if (filterKey) {
    currentColor = getDefaultColor();
    showFilter(filterKey, { updateHistory: false });
  } else {
    selectColor(fromPath || fromHash || getDefaultColor(), {
      updateHistory: false,
    });
  }

  // Initialize quiz
  const quiz = new ColorQuiz(colorsWithHsl);
  document
    .getElementById("quiz-btn")
    .addEventListener("click", () => quiz.open());
}

/** Premier segment de l'URL : /red/ → "red" */
function getPathSlug() {
  return decodeURIComponent(window.location.pathname.split("/")[1] || "");
}

function getDefaultColor() {
  return colorsWithHsl.find((c) => c.name === "hotpink");
}

/**
 * Remplace le nom de balise d'un élément en conservant attributs et contenu
 * (ex. h1 ↔ h2 ↔ p), pour garder un seul h1 pertinent par page.
 */
function swapTag(el, tag) {
  if (!el || el.localName === tag) return el;
  const next = document.createElement(tag);
  [...el.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

/**
 * Le h1 dépend de la page : « Hotpink » sur l'accueil, le nom de la couleur
 * sur /red/, le titre du filtre sur /couleurs-pastel/.
 */
function setPageMode(mode) {
  pageMode = mode;
  swapTag(document.querySelector(".brand-title"), mode === "home" ? "h1" : "p");
  resultsTitle = swapTag(resultsTitle, mode === "filter" ? "h1" : "h2");
  selectedColorDisplay.hidden = mode === "filter";
  // Évite un second h1 dans la fiche couleur (masquée ou plus à la une)
  if (mode !== "color") {
    swapTag(selectedColorDisplay.querySelector("h1"), "h2");
  }
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
    const color = findColor(getPathSlug());
    const filterKey = color ? null : findFilterBySlug(getPathSlug());
    if (filterKey) {
      showFilter(filterKey, { updateHistory: false });
    } else {
      selectColor(color || getDefaultColor(), { updateHistory: false });
    }
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

  // Second click on the active chip: back to a color page
  if (wasActive) {
    searchInput.value = "";
    closeSuggestions();
    selectColor(currentColor || getDefaultColor());
    return;
  }

  showFilter(filterType);
}

function showFilter(filterType, { updateHistory = true } = {}) {
  const filterFn = filterFunctions[filterType];
  if (!filterFn) return;

  resetFilters();
  searchInput.value = "";
  closeSuggestions();

  filterChips.forEach((chip) => {
    if (chip.dataset.filter === filterType) {
      chip.setAttribute("aria-pressed", "true");
    }
  });

  // Sort by lightness (descending) for better aesthetics
  const matches = getFilterColors(filterType, colorsWithHsl);

  // Les couleurs système n'ont pas de page dédiée
  if (FILTER_SLUGS[filterType]) {
    if (updateHistory && window.location.pathname !== filterPath(filterType)) {
      window.history.pushState({}, "", filterPath(filterType));
    }
    setPageMode("filter");
    document.title = filterPageTitle(filterType, matches.length);
  } else {
    document.title = `Hotpink - ${PAGE_TITLES[filterType] || "Filtre"}`;
  }

  renderList({
    title: filterHeading(filterType, matches.length),
    description: getFilterDescription(filterType),
    colors: matches,
    emptyText: "Aucune couleur trouvée pour ce filtre.",
  });
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
  const link = document.createElement("a");
  link.className = "color-card";
  link.href = colorPath(color);
  link.innerHTML = colorCardInnerHtml(color);
  link.addEventListener("click", (e) => {
    // Laisse le navigateur gérer ouverture dans un nouvel onglet, etc.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    searchInput.value = "";
    closeSuggestions();
    selectColor(color, { scroll: true });
  });
  return link;
}

/* ----------------------------------
 * Sélection d'une couleur
 * ---------------------------------- */
function selectColor(color, { updateHistory = true, scroll = false } = {}) {
  currentColor = color;

  if (updateHistory && getPathSlug() !== color.name) {
    window.history.pushState({}, "", colorPath(color));
  }
  document.title = colorTitle(color);
  setPageMode(getPathSlug() === color.name ? "color" : "home");

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

function renderSelectedColor(color) {
  selectedColorDisplay.setAttribute("style", colorSheetStyle(color));
  selectedColorDisplay.innerHTML = colorSheetHtml(
    color,
    pageMode === "color" ? "h1" : "h2"
  );

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
  const nearby = getNearbyColors(targetColor, colorsWithHsl, 12);

  renderList({ title: "Couleurs proches", colors: nearby });
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
