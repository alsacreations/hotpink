export const filterSets = {
  historical: [
    "aqua",
    "black",
    "blue",
    "fuchsia",
    "gray",
    "green",
    "lime",
    "maroon",
    "navy",
    "olive",
    "purple",
    "red",
    "silver",
    "teal",
    "white",
    "yellow",
  ],
  pastel: [
    "lavender",
    "lavenderblush",
    "mistyrose",
    "lightblue",
    "lightcyan",
    "lightpink",
    "lightyellow",
    "peachpuff",
    "papayawhip",
    "honeydew",
    "aliceblue",
    "azure",
    "beige",
    "cornsilk",
    "ivory",
    "lemonchiffon",
    "mintcream",
    "oldlace",
    "seashell",
    "snow",
    "wheat",
    "whitesmoke",
    "lightgoldenrodyellow",
    "powderblue",
    "thistle",
    "pink",
  ],
  vintage: [
    "tan",
    "wheat",
    "burlywood",
    "rosybrown",
    "peru",
    "goldenrod",
    "darkgoldenrod",
    "darkkhaki",
    "olive",
    "olivedrab",
    "sienna",
    "saddlebrown",
    "chocolate",
    "sandybrown",
    "khaki",
    "palegoldenrod",
    "indianred",
    "darksalmon",
    "salmon",
  ],
  grays: [
    "black",
    "dimgray",
    "dimgrey",
    "gray",
    "grey",
    "darkgray",
    "darkgrey",
    "silver",
    "lightgray",
    "lightgrey",
    "gainsboro",
    "whitesmoke",
    "white",
    "darkslategray",
    "darkslategrey",
    "slategray",
    "slategrey",
    "lightslategray",
    "lightslategrey",
  ],
  edible: [
    "aqua",
    "bisque",
    "blanchedalmond",
    "chartreuse",
    "chocolate",
    "cornsilk",
    "cream",
    "darkolivegreen",
    "darkorange",
    "darksalmon",
    "honeydew",
    "lemonchiffon",
    "lightsalmon",
    "lime",
    "limegreen",
    "mintcream",
    "olive",
    "olivedrab",
    "orange",
    "orangered",
    "papayawhip",
    "peachpuff",
    "plum",
    "salmon",
    "tomato",
    "wheat",
  ],
  plants: [
    "cornflowerblue",
    "floralwhite",
    "forestgreen",
    "fuchsia",
    "goldenrod",
    "darkgoldenrod",
    "lavender",
    "lavenderblush",
    "lawngreen",
    "lightgoldenrodyellow",
    "lightseagreen",
    "limegreen",
    "mediumseagreen",
    "mediumspringgreen",
    "orchid",
    "darkorchid",
    "mediumorchid",
    "palegoldenrod",
    "palegreen",
    "rosybrown",
    "seagreen",
    "springgreen",
    "thistle",
    "violet",
    "darkviolet",
    "blueviolet",
    "wheat",
  ],
  minerals: [
    "amethyst", // not in standard css colors? let's check. No.
    "aquamarine",
    "darkturquoise",
    "gold",
    "mediumaquamarine",
    "mediumturquoise",
    "paleturquoise",
    "silver",
    "turquoise",
  ],
};

export const filterFunctions = {
  "all-lightness": (colors) => {
    return colors.filter((c) => !c.system);
  },
  historical: (colors) => {
    return colors.filter((c) => filterSets.historical.includes(c.name));
  },
  pastel: (colors) => {
    return colors.filter((c) => filterSets.pastel.includes(c.name));
  },
  vintage: (colors) => {
    return colors.filter((c) => filterSets.vintage.includes(c.name));
  },
  grays: (colors) => {
    return colors.filter((c) => filterSets.grays.includes(c.name));
  },
  edible: (colors) => {
    return colors.filter((c) => filterSets.edible.includes(c.name));
  },
  plants: (colors) => {
    return colors.filter((c) => filterSets.plants.includes(c.name));
  },
  minerals: (colors) => {
    return colors.filter((c) => filterSets.minerals.includes(c.name));
  },
  system: (colors) => {
    return colors.filter((c) => c.system === true);
  },
};

/* ----------------------------------
 * Textes et URLs des filtres
 * ---------------------------------- */
export const FILTER_TITLES = {
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

export const FILTER_DESCRIPTIONS = {
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

export const PAGE_TITLES = {
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

/** URL de chaque filtre (pages statiques). Les couleurs système n'ont pas de page. */
export const FILTER_SLUGS = {
  "all-lightness": "toutes-les-couleurs",
  historical: "couleurs-historiques",
  pastel: "couleurs-pastel",
  vintage: "couleurs-vintage",
  grays: "niveaux-de-gris",
  edible: "couleurs-comestibles",
  plants: "plantes-et-fleurs",
  minerals: "mineraux-et-pierres",
};
