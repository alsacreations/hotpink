import { namedColors } from "./modules/colors.js";
import {
  hexToRgb,
  rgbToHsl,
  getAccessibleTextColor,
  hexToOklch,
} from "./modules/utils.js";
import { filterFunctions } from "./modules/filters.js";
import { ColorQuiz } from "./modules/quiz.js";
import { palettes } from "./modules/palettes.js";
import { getColorFunFact } from "./modules/funfacts.js";

// DOM Elements
const searchInput = document.getElementById("color-search");
const suggestionsList = document.getElementById("search-suggestions");
const resultsSection = document.getElementById("results-section");
const selectedColorDisplay = document.getElementById("selected-color-display");
const nearbyColorsContainer = document.getElementById("nearby-colors");
const favoritesSection = document.getElementById("favorites-section");
const favoritesList = document.getElementById("favorites-list");
const palettesList = document.getElementById("palettes-list");

const hueSlider = document.getElementById("hue-slider");
const specialFilterSelect = document.getElementById("special-filter");
const filterDescription = document.getElementById("filter-description");

// State
let colorsWithHsl = [];
let favorites =
  JSON.parse(localStorage.getItem("color-finder-favorites")) || [];

// Initialize
function init() {
  // Pre-calculate HSL for sorting
  colorsWithHsl = namedColors.map((c) => {
    // System colors don't have hex values, skip HSL calculation
    if (c.system) {
      return { ...c, hsl: { h: 0, s: 0, l: 50 } };
    }
    const rgb = hexToRgb(c.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { ...c, hsl };
  });

  setupEventListeners();
  renderFavorites();
  renderPalettes();

  // Check URL hash for initial color
  const hash = window.location.hash.slice(1); // Remove the '#'
  if (hash) {
    const color = colorsWithHsl.find(
      (c) => c.name.toLowerCase() === hash.toLowerCase()
    );
    if (color) {
      selectColor(color);
    }
  } else {
    // Display "hotpink" by default if no hash
    const hotpink = colorsWithHsl.find(
      (c) => c.name.toLowerCase() === "hotpink"
    );
    if (hotpink) {
      selectColor(hotpink);
    }
  }

  // Initialize quiz
  const quiz = new ColorQuiz(colorsWithHsl);
  document
    .getElementById("quiz-btn")
    .addEventListener("click", () => quiz.open());
}

function setupEventListeners() {
  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("keydown", handleKeyDown);

  hueSlider.addEventListener("input", handleHueSlider);
  specialFilterSelect.addEventListener("change", handleSpecialFilter);

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      suggestionsList.hidden = true;
    }
  });

  // Handle browser back/forward navigation
  window.addEventListener("popstate", () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const color = colorsWithHsl.find(
        (c) => c.name.toLowerCase() === hash.toLowerCase()
      );
      if (color) {
        document.title = `Hotpink - Couleur ${color.name}`;
        renderSelectedColor(color);
        renderNearbyColors(color);
        resultsSection.hidden = false;
        hueSlider.value = Math.round(color.hsl.h);
      }
    }
  });
}

function handleSearchInput(e) {
  // Reset other filters
  specialFilterSelect.value = "";

  const query = e.target.value.toLowerCase().trim();
  if (query.length < 1) {
    suggestionsList.hidden = true;
    return;
  }

  const matches = colorsWithHsl.filter((c) => c.name.includes(query));
  renderSuggestions(matches);
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
    if (currentFocus > -1) {
      if (items) items[currentFocus].click();
    }
  } else if (e.key === "Escape") {
    suggestionsList.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    currentFocus = -1;
  }
}

function addActive(items) {
  if (!items) return;
  removeActive(items);
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;

  items[currentFocus].classList.add("suggestion-active");
  items[currentFocus].setAttribute("aria-selected", "true");
  searchInput.setAttribute("aria-activedescendant", items[currentFocus].id);

  // Scroll to view
  items[currentFocus].scrollIntoView({ block: "nearest" });
}

function removeActive(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove("suggestion-active");
    items[i].setAttribute("aria-selected", "false");
  }
  searchInput.removeAttribute("aria-activedescendant");
}

function handleHueSlider(e) {
  // Reset other filters
  specialFilterSelect.value = "";
  searchInput.value = "";
  suggestionsList.hidden = true;

  const hue = parseInt(e.target.value, 10);

  // Filter colors within +/- 15 degrees of the selected hue
  // Handle wrap-around (0/360)
  const matches = colorsWithHsl.filter((c) => {
    // Skip grays for hue filtering
    if (c.hsl.s < 5) return false;

    let diff = Math.abs(c.hsl.h - hue);
    if (diff > 180) diff = 360 - diff;
    return diff < 20; // 20 degrees tolerance
  });

  // Sort by lightness to make it look nice
  matches.sort((a, b) => b.hsl.l - a.hsl.l);

  renderHueResults(matches, hue);
}

function handleSpecialFilter(e) {
  const filterType = e.target.value;

  if (!filterType) {
    resultsSection.hidden = true;
    return;
  }

  // Reset other inputs
  searchInput.value = "";
  suggestionsList.hidden = true;

  const filterFn = filterFunctions[filterType];
  if (filterFn) {
    const matches = filterFn(colorsWithHsl);
    renderSpecialResults(matches, filterType);
  }
}

function renderSpecialResults(colors, filterType) {
  // Hide selected color display
  selectedColorDisplay.innerHTML = "";
  selectedColorDisplay.style.display = "none";

  // Update title based on filter type
  const container = nearbyColorsContainer.parentElement;
  const title = container.querySelector("h2");

  const titles = {
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

  const descriptions = {
    "all-lightness":
      "L'ensemble des 140+ couleurs CSS nommées (hors couleurs système), triées de la plus claire à la plus sombre. Idéal pour trouver la nuance exacte de luminosité que vous recherchez.",
    historical:
      "Les 16 couleurs originelles du HTML, héritées du système VGA. Ces couleurs ont été définies dès les débuts du web et sont supportées par tous les navigateurs depuis toujours.",
    pastel:
      "Couleurs douces et claires, parfaites pour créer des interfaces délicates et apaisantes. Idéales pour les designs minimalistes et élégants.",
    vintage:
      "Palette de couleurs chaudes et terreuses évoquant les années 50 à 70. Parfaites pour donner un aspect rétro et nostalgique à vos créations.",
    grays:
      "Toutes les nuances de gris disponibles en CSS, du noir au blanc. Essentielles pour créer des designs monochromes sophistiqués et des hiérarchies visuelles.",
    edible:
      "Couleurs inspirées par la nourriture et les boissons. De quoi donner faim en codant&#8239;!",
    plants:
      "Couleurs évoquant la nature, les fleurs et les plantes. Apportez une touche végétale à vos interfaces.",
    minerals:
      "Couleurs inspirées par les pierres précieuses et les minéraux. Pour des designs qui brillent&#8239;!",
    system:
      "Couleurs système qui s'adaptent automatiquement au thème de l'utilisateur (clair/sombre). Utilisez-les pour respecter les préférences d'accessibilité.",
  };

  const baseTitle = titles[filterType] || "Résultats du filtre";
  title.textContent = `${baseTitle} (${colors.length} couleur${
    colors.length > 1 ? "s" : ""
  })`;

  // Update page title
  const pageTitles = {
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
  document.title = `Hotpink - ${pageTitles[filterType] || "Filtre"}`;

  // Show description if available
  if (descriptions[filterType]) {
    filterDescription.innerHTML = descriptions[filterType];
    filterDescription.style.display = "block";
  } else {
    filterDescription.style.display = "none";
  }

  nearbyColorsContainer.innerHTML = "";
  if (colors.length === 0) {
    nearbyColorsContainer.innerHTML =
      '<p class="text-subtle">Aucune couleur trouvée pour ce filtre.</p>';
  } else {
    // Sort by lightness (descending) for better aesthetics
    colors.sort((a, b) => b.hsl.l - a.hsl.l);

    colors.forEach((c) => {
      nearbyColorsContainer.appendChild(createColorCard(c));
    });
  }

  resultsSection.hidden = false;
}

function renderHueResults(colors, hue) {
  // Hide selected color display if we are browsing by hue
  selectedColorDisplay.innerHTML = "";
  selectedColorDisplay.style.display = "none"; // Or just empty it

  // Reuse nearby-colors container for results
  // Update title
  const container = nearbyColorsContainer.parentElement;
  const title = container.querySelector("h2");
  title.textContent = `Couleurs proches de la teinte ${hue}° (${
    colors.length
  } couleur${colors.length > 1 ? "s" : ""})`;

  // Hide description
  filterDescription.style.display = "none";

  nearbyColorsContainer.innerHTML = "";
  if (colors.length === 0) {
    nearbyColorsContainer.innerHTML =
      '<p class="text-subtle">Aucune couleur trouvée pour cette teinte.</p>';
  } else {
    colors.forEach((c) => {
      nearbyColorsContainer.appendChild(createColorCard(c));
    });
  }

  resultsSection.hidden = false;
}

function renderSuggestions(matches) {
  suggestionsList.innerHTML = "";
  currentFocus = -1;

  if (matches.length === 0) {
    suggestionsList.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    return;
  }

  matches.slice(0, 10).forEach((color, index) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.id = `suggestion-${index}`;
    li.role = "option";
    li.innerHTML = `
            <div class="suggestion-color-preview" style="background-color: ${color.hex}"></div>
            <span>${color.name}</span>
        `;
    li.addEventListener("click", () => {
      selectColor(color);
      searchInput.value = color.name;
      suggestionsList.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
    });
    suggestionsList.appendChild(li);
  });

  suggestionsList.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function selectColor(color) {
  // Update URL hash
  window.history.pushState({}, "", `#${color.name}`);

  // Update page title
  document.title = `Hotpink - couleur ${color.name}`;

  // Update slider position
  hueSlider.value = Math.round(color.hsl.h);

  // Reset display if it was hidden by hue slider
  selectedColorDisplay.style.display = "";
  const container = nearbyColorsContainer.parentElement;
  container.querySelector("h2").textContent = "Couleurs proches";

  // Hide description
  filterDescription.style.display = "none";

  renderSelectedColor(color);
  renderNearbyColors(color);
  resultsSection.hidden = false;
}

function renderSelectedColor(color) {
  const isFav = favorites.includes(color.name);
  const rgb = hexToRgb(color.hex);

  // Contrast calculations first to determine text color
  const contrastWhite = getContrastRatio(color.hex, "#ffffff");
  const contrastBlack = getContrastRatio(color.hex, "#000000");

  // Choose the text color with the highest contrast
  const textColor = contrastBlack > contrastWhite ? "#000000" : "#ffffff";

  const oklch = hexToOklch(color.hex);

  const getGrade = (ratio) => {
    if (ratio >= 7) return "AAA";
    if (ratio >= 4.5) return "AA";
    return "Fail";
  };

  const gradeWhite = getGrade(contrastWhite);
  const gradeBlack = getGrade(contrastBlack);

  const colorValues = `
            <div class="color-value-row copy-trigger" data-value="${color.hex}" role="button" tabindex="0" title="Copier la valeur HEX">
                <span class="text-subtle" lang="en">HEX</span>
                <div style="display: flex; align-items: center; gap: var(--spacing-xs)">
                    <span class="font-mono value-text">${color.hex}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" class="copy-icon" aria-hidden="true"><path fill="currentColor" d="M8 7h11v14H8z" opacity=".3"/><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z"/></svg>
                    <span class="copy-feedback text-s" style="display:none">Copié !</span>
                </div>
            </div>
            <div class="color-value-row copy-trigger" data-value="${oklch}" role="button" tabindex="0" title="Copier la valeur OKLCH">
                <span class="text-subtle" lang="en">OKLCH</span>
                <div style="display: flex; align-items: center; gap: var(--spacing-xs)">
                    <span class="font-mono value-text">${oklch}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" class="copy-icon" aria-hidden="true"><path fill="currentColor" d="M8 7h11v14H8z" opacity=".3"/><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z"/></svg>
                    <span class="copy-feedback text-s" style="display:none">Copié !</span>
                </div>
            </div>
        `;

  const a11ySection = `
        <div class="a11y-section" data-layout="stack" data-gap="xs">
            <div class="color-value-row">
                <span class="text-subtle">Contraste sur Blanc</span>
                <div class="contrast-wrapper">
                    <span class="font-mono font-bold">${contrastWhite.toFixed(
                      2
                    )}</span>
                    <span class="badge ${
                      gradeWhite === "Fail" ? "badge-fail" : "badge-pass"
                    }" lang="en">${gradeWhite}</span>
                </div>
            </div>
            <div class="color-value-row">
                <span class="text-subtle">Contraste sur Noir</span>
                <div class="contrast-wrapper">
                    <span class="font-mono font-bold">${contrastBlack.toFixed(
                      2
                    )}</span>
                    <span class="badge ${
                      gradeBlack === "Fail" ? "badge-fail" : "badge-pass"
                    }" lang="en">${gradeBlack}</span>
                </div>
            </div>
        </div>
  `;

  selectedColorDisplay.innerHTML = `
        <div class="color-preview-large" style="background-color: ${
          color.hex
        }; color: ${textColor}">
            <h2 class="title-l color-preview-title">${color.name}</h2>
        </div>
        <div class="color-info">
            <p class="color-funfact">${getColorFunFact(color.name)}</p>
            ${colorValues}
            ${a11ySection}

            <button id="toggle-fav-btn" class="btn btn-outline" data-gap="xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 9.67a1 1 0 0 0-.86-.67l-5.69-.83L12.9 3a1 1 0 0 0-1.8 0L8.55 8.16L2.86 9a1 1 0 0 0-.81.68a1 1 0 0 0 .25 1l4.13 4l-1 5.68a1 1 0 0 0 1.47 1.08l5.1-2.67l5.1 2.67a.93.93 0 0 0 .46.12a1 1 0 0 0 .59-.19a1 1 0 0 0 .4-1l-1-5.68l4.13-4A1 1 0 0 0 22 9.67m-6.15 4a1 1 0 0 0-.29.88l.72 4.2l-3.76-2a1.06 1.06 0 0 0-.94 0l-3.76 2l.72-4.2a1 1 0 0 0-.29-.88l-3-3l4.21-.61a1 1 0 0 0 .76-.55L12 5.7l1.88 3.82a1 1 0 0 0 .76.55l4.21.61Z"/></svg>
                ${isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            </button>
        </div>
    `;

  document.getElementById("toggle-fav-btn").addEventListener("click", () => {
    toggleFavorite(color.name);
    renderSelectedColor(color); // Re-render to update button text
  });

  // Add copy event listeners
  document.querySelectorAll(".copy-trigger").forEach((el) => {
    el.addEventListener("click", async () => {
      const value = el.dataset.value;
      try {
        await navigator.clipboard.writeText(value);
        const feedback = el.querySelector(".copy-feedback");
        feedback.style.display = "inline";
        setTimeout(() => {
          feedback.style.display = "none";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy!", err);
      }
    });
    // Add keyboard support for copy
    el.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });
}

function getComplementaryColor(targetColor) {
  // If grayscale, no complementary
  if (targetColor.hsl.s < 5) return null;

  const targetHue = (targetColor.hsl.h + 180) % 360;

  let best = null;
  let minDistance = Infinity;

  colorsWithHsl.forEach((c) => {
    // Calculate distance to the ideal complementary point
    // We prioritize Hue accuracy, then Saturation/Lightness similarity

    let hDiff = Math.abs(c.hsl.h - targetHue);
    if (hDiff > 180) hDiff = 360 - hDiff;

    const sDiff = Math.abs(c.hsl.s - targetColor.hsl.s);
    const lDiff = Math.abs(c.hsl.l - targetColor.hsl.l);

    // Weighted distance
    // Hue is most important for "Complementary" definition
    const distance = hDiff * 2 + sDiff * 0.5 + lDiff * 0.5;

    if (distance < minDistance) {
      minDistance = distance;
      best = c;
    }
  });

  return best;
}

function renderNearbyColors(targetColor) {
  // Sort by distance in HSL space
  // Simple distance: weighted euclidean on H, S, L
  // We want colors that "look" close.
  // Let's try sorting by Hue distance first.

  const sorted = [...colorsWithHsl].sort((a, b) => {
    const distA = getColorDistance(targetColor, a);
    const distB = getColorDistance(targetColor, b);
    return distA - distB;
  });

  // Take top 12 excluding self
  const nearby = sorted.filter((c) => c.name !== targetColor.name).slice(0, 12);

  // Sort by lightness for better display
  nearby.sort((a, b) => b.hsl.l - a.hsl.l);

  nearbyColorsContainer.innerHTML = "";
  nearby.forEach((c) => {
    const card = createColorCard(c);
    nearbyColorsContainer.appendChild(card);
  });
}

function getColorDistance(c1, c2) {
  // Hue is circular (0-360)
  let hDiff = Math.abs(c1.hsl.h - c2.hsl.h);
  if (hDiff > 180) hDiff = 360 - hDiff;

  // Weight hue more heavily
  return Math.sqrt(
    Math.pow(hDiff * 2, 2) +
      Math.pow(c1.hsl.s - c2.hsl.s, 2) +
      Math.pow(c1.hsl.l - c2.hsl.l, 2)
  );
}

function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function createColorCard(color) {
  const div = document.createElement("div");
  div.className = "color-card";
  div.setAttribute("tabindex", "0");
  div.setAttribute("role", "button");
  div.setAttribute("aria-label", `Sélectionner la couleur ${color.name}`);
  div.innerHTML = `
        <div class="card-preview" style="background-color: ${color.hex}"></div>
        <div class="card-info">
            <span class="text-s font-bold">${color.name}</span>
        </div>
    `;

  // Fonction pour sélectionner la couleur et réinitialiser la recherche
  const handleSelect = () => {
    searchInput.value = "";
    suggestionsList.hidden = true;
    selectColor(color);
  };

  // Gestion du clic
  div.addEventListener("click", handleSelect);

  // Gestion du clavier (Enter et Space)
  div.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  });

  return div;
}

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
  if (favorites.length === 0) {
    favoritesList.innerHTML =
      '<p class="empty-state">Aucun favori pour le moment.</p>';
    return;
  }

  favorites.forEach((name) => {
    const color = colorsWithHsl.find((c) => c.name === name);
    if (color) {
      favoritesList.appendChild(createColorCard(color));
    }
  });
}

function renderPalettes() {
  palettesList.innerHTML = "";
  palettes.forEach((palette) => {
    const card = createPaletteCard(palette);
    palettesList.appendChild(card);
  });
}

function createPaletteCard(palette) {
  const div = document.createElement("div");
  div.className = "palette-card";
  div.setAttribute("tabindex", "0");
  div.setAttribute("role", "button");
  div.setAttribute("aria-label", `Charger la palette ${palette.name}`);

  const stripes = palette.colors
    .map((colorName) => {
      const color = colorsWithHsl.find((c) => c.name === colorName);
      const hex = color ? color.hex : colorName;
      return `<div class="palette-stripe" style="background-color: ${hex}" title="${colorName}"></div>`;
    })
    .join("");

  div.innerHTML = `
        <div class="palette-preview">
            ${stripes}
        </div>
        <div class="palette-info">
            <span class="text-s font-bold">${palette.name}</span>
            <span class="text-s text-subtle" style="font-size: 0.8em">${palette.colors.length} couleurs</span>
        </div>
    `;

  div.addEventListener("click", () => loadPalette(palette));
  div.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      loadPalette(palette);
    }
  });

  return div;
}

function loadPalette(palette) {
  // Clear selected color display
  selectedColorDisplay.innerHTML = "";
  selectedColorDisplay.style.display = "none";

  // Update title
  const container = nearbyColorsContainer.parentElement;
  const title = container.querySelector("h2");
  title.textContent = `Palette : ${palette.name}`;

  // Update page title
  document.title = `Hotpink - Palette ${palette.name}`;

  // Description
  filterDescription.textContent = `Couleurs : ${palette.colors.join(", ")}`;
  filterDescription.style.display = "block";

  nearbyColorsContainer.innerHTML = "";

  palette.colors.forEach((colorName) => {
    const color = colorsWithHsl.find((c) => c.name === colorName);
    if (color) {
      nearbyColorsContainer.appendChild(createColorCard(color));
    }
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// Run
init();
