// Fun facts about CSS named colors
// Based on funfacts.md

export const specificFunFacts = {
  orange:
    "<strong>Orange</strong> est la 17e couleur nommée, elle est la seule à avoir été introduite en CSS 2.1.",
  darkgray:
    "<strong>Darkgray</strong> est plus claire que <code>gray</code>\u202f!",
  darkgrey:
    "<strong>Darkgrey</strong> est plus claire que <code>grey</code>\u202f!",
  gray: "<strong>Gray</strong> est plus sombre que <code>darkgray</code>\u202f!",
  grey: "<strong>Grey</strong> est plus sombre que <code>darkgrey</code>\u202f!",
  fuchsia:
    "<strong>Fuchsia</strong> est la couleur la plus souvent mal orthographiée.",
  lightgoldenrodyellow:
    "<strong>Lightgoldenrodyellow</strong> est le nom de couleur le plus long de tous (20 caractères).",
  rebeccapurple:
    "<strong>Rebeccapurple</strong> a été nommé en hommage à la fille d'Eric Meyer, grand contributeur de CSS.",
  cyan: "<strong>Cyan</strong> et <code>aqua</code> sont absolument identiques (<code>#00ffff</code>).",
  aqua: "<strong>Aqua</strong> et <code>cyan</code> sont absolument identiques (<code>#00ffff</code>).",
  magenta:
    "<strong>Magenta</strong> et <code>fuchsia</code> sont absolument identiques (<code>#ff00ff</code>).",
  brown: "<strong>Brown</strong> est plus rouge que brun.",
  black:
    "<strong>Black</strong> et <code>white</code> sont les deux couleurs les plus simples et les plus utilisées, avec les codes hexadécimaux extrêmes\u202f: <code>#000000</code> et <code>#FFFFFF</code>.",
  white:
    "<strong>White</strong> et <code>black</code> sont les deux couleurs les plus simples et les plus utilisées, avec les codes hexadécimaux extrêmes\u202f: <code>#FFFFFF</code> et <code>#000000</code>.",
  lime: "<strong>Lime</strong> correspond au vert pur dans le modèle de couleur RVB (<code>#00FF00</code>), tandis que la couleur nommée <code>green</code> est en fait un vert plus sombre (<code>#008000</code>).",
  green:
    "<strong>Green</strong> est en fait un vert sombre (<code>#008000</code>), tandis que <code>lime</code> correspond au vert pur (<code>#00FF00</code>).",
  darkslategray:
    "<strong>Darkslategray</strong> est une couleur qui, malgré son nom, est souvent décrite comme un vert très foncé plutôt qu'un gris-bleu foncé.",
  darkslategrey:
    "<strong>Darkslategrey</strong> est une couleur qui, malgré son nom, est souvent décrite comme un vert très foncé plutôt qu'un gris-bleu foncé.",
  dimgray:
    "<strong>Dimgray</strong> est la plus sombre de toutes les variations de gris avec le préfixe de luminance (elle est plus sombre que <code>gray</code>).",
  dimgrey:
    "<strong>Dimgrey</strong> est la plus sombre de toutes les variations de gris avec le préfixe de luminance (elle est plus sombre que <code>grey</code>).",
  hotpink:
    "<strong>Hotpink</strong> est en toute objectivité le nom de couleur le plus original ou mémorable.",
  navajowhite:
    "<strong>Navajowhite</strong> a été nommée d'après la couleur de fond du drapeau de la Nation Navajo.",
};

// Historical colors from HTML 4.01 (1999)
export const historicalColors = [
  "black",
  "silver",
  "gray",
  "white",
  "maroon",
  "red",
  "purple",
  "fuchsia",
  "green",
  "lime",
  "olive",
  "yellow",
  "navy",
  "blue",
  "teal",
  "aqua",
];

/**
 * Get a fun fact about a CSS named color
 * @param {string} colorName - The name of the color
 * @returns {string} HTML string with the fun fact
 */
export function getColorFunFact(colorName) {
  const name = colorName.toLowerCase();

  // Check for specific fun facts
  if (specificFunFacts[name]) {
    return specificFunFacts[name];
  }

  // Check if it's a historical color
  if (historicalColors.includes(name)) {
    return `<strong>${
      colorName.charAt(0).toUpperCase() + colorName.slice(1)
    }</strong> compte parmi les 16 premières couleurs nommées en HTML 4.01 (1999).`;
  }

  // Default message for CSS 3 colors
  return `<strong>${
    colorName.charAt(0).toUpperCase() + colorName.slice(1)
  }</strong> fait partie de la liste des couleurs nommées étendues, ajoutée en CSS 3 (2011).`;
}
