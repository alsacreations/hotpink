import { namedColors } from "./modules/colors.js";
import {
  hexToRgb,
  rgbToHsl,
  getAccessibleTextColor,
  hexToOklch,
} from "./modules/utils.js";
import { filterFunctions } from "./modules/filters.js";

// DOM Elements
const searchInput = document.getElementById("color-search");
const suggestionsList = document.getElementById("search-suggestions");
const resultsSection = document.getElementById("results-section");
const selectedColorDisplay = document.getElementById("selected-color-display");
const nearbyColorsContainer = document.getElementById("nearby-colors");
const favoritesSection = document.getElementById("favorites-section");
const favoritesList = document.getElementById("favorites-list");

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

  // Check URL params for initial search
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get("search");
  if (searchParam) {
    const color = colorsWithHsl.find(
      (c) => c.name.toLowerCase() === searchParam.toLowerCase()
    );
    if (color) {
      selectColor(color);
    }
  } else {
    // Display "hotpink" by default if no search parameter
    const hotpink = colorsWithHsl.find(
      (c) => c.name.toLowerCase() === "hotpink"
    );
    if (hotpink) {
      selectColor(hotpink);
    }
  }
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
    historical:
      "Les 16 couleurs originales du HTML, héritées du système VGA. Ces couleurs ont été définies dès les débuts du web et sont supportées par tous les navigateurs depuis toujours.",
    pastel:
      "Couleurs douces et claires, parfaites pour créer des interfaces délicates et apaisantes. Idéales pour les designs minimalistes et élégants.",
    vintage:
      "Palette de couleurs chaudes et terreuses évoquant les années 50 à 70. Parfaites pour donner un aspect rétro et nostalgique à vos créations.",
    grays:
      "Toutes les nuances de gris disponibles en CSS, du noir au blanc. Essentielles pour créer des designs monochromes sophistiqués et des hiérarchies visuelles.",
    edible:
      "Couleurs inspirées par la nourriture et les boissons. De quoi donner faim en codant !",
    plants:
      "Couleurs évoquant la nature, les fleurs et les plantes. Apportez une touche végétale à vos interfaces.",
    minerals:
      "Couleurs inspirées par les pierres précieuses et les minéraux. Pour des designs qui brillent !",
    system:
      "Couleurs système qui s'adaptent automatiquement au thème de l'utilisateur (clair/sombre). Utilisez-les pour respecter les préférences d'accessibilité.",
  };

  const baseTitle = titles[filterType] || "Résultats du filtre";
  title.textContent = `${baseTitle} (${colors.length} couleur${
    colors.length > 1 ? "s" : ""
  })`;

  // Show description if available
  if (descriptions[filterType]) {
    filterDescription.textContent = descriptions[filterType];
    filterDescription.style.display = "block";
  } else {
    filterDescription.style.display = "none";
  }

  nearbyColorsContainer.innerHTML = "";
  if (colors.length === 0) {
    nearbyColorsContainer.innerHTML =
      '<p class="text-subtle">Aucune couleur trouvée pour ce filtre.</p>';
  } else {
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
  // Update URL
  const url = new URL(window.location);
  url.searchParams.set("search", color.name);
  window.history.pushState({}, "", url);

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
  const isSystem = color.system === true;
  const textColor = isSystem ? "white" : getAccessibleTextColor(color.hex);
  const oklch = isSystem ? "N/A" : hexToOklch(color.hex);
  const isFav = favorites.includes(color.name);
  const complementary = !isSystem ? getComplementaryColor(color) : null;

  // For system colors, show type instead of conversions
  const colorValues = isSystem
    ? `
            <div class="color-value-row">
                <span class="text-subtle">Type</span>
                <span class="font-mono">Couleur système</span>
            </div>
            <div class="color-value-row">
                <span class="text-subtle">Valeur CSS</span>
                <span class="font-mono">${color.hex}</span>
            </div>
        `
    : `
            <div class="color-value-row">
                <span class="text-subtle">HEX</span>
                <span class="font-mono">${color.hex}</span>
            </div>
            <div class="color-value-row">
                <span class="text-subtle">OKLCH</span>
                <span class="font-mono">${oklch}</span>
            </div>
            <div class="color-value-row">
                 <span class="text-subtle">RGB</span>
                 <span class="font-mono">${hexToRgb(color.hex).r}, ${
        hexToRgb(color.hex).g
      }, ${hexToRgb(color.hex).b}</span>
            </div>
        `;

  selectedColorDisplay.innerHTML = `
        <div class="color-preview-large" style="background-color: ${
          color.hex
        }; color: ${textColor}">
            <h2 class="title-l">${color.name}</h2>
        </div>
        <div class="color-info">
            ${colorValues}

            ${
              complementary
                ? `
            <div class="color-value-row" style="margin-top: var(--spacing-m); border-top: 1px solid var(--border-light); padding-top: var(--spacing-s)">
                <span class="text-subtle">Complémentaire</span>
                <div id="comp-trigger" style="display: flex; align-items: center; gap: var(--spacing-s); cursor: pointer">
                    <div style="width: 1rem; height: 1rem; background-color: ${complementary.hex}; border-radius: 50%; border: 1px solid var(--border-light)"></div>
                    <span class="font-bold underline">${complementary.name}</span>
                </div>
            </div>
            `
                : ""
            }

            <button id="toggle-fav-btn" class="btn btn-outline" style="margin-top: var(--spacing-m)">
                ${isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            </button>
        </div>
    `;

  document.getElementById("toggle-fav-btn").addEventListener("click", () => {
    toggleFavorite(color.name);
    renderSelectedColor(color); // Re-render to update button text
  });

  if (complementary) {
    document
      .getElementById("comp-trigger")
      .addEventListener("click", () => selectColor(complementary));
  }
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

// Run
init();
