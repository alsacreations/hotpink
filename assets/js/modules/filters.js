export const filterSets = {
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
  animals: [
    "coral",
    "darkkhaki", // khaki is a color, but often associated with uniforms, maybe not animal.
    "khaki",
    "lightcoral",
    "lightsalmon",
    "salmon",
    "darksalmon",
    "seashell", // animal-ish
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
  shortest: (colors) => {
    // Find the minimum length
    const minLen = Math.min(...colors.map((c) => c.name.length));
    // Accept ±1 character tolerance
    return colors.filter((c) => c.name.length <= minLen + 1);
  },
  longest: (colors) => {
    const maxLen = Math.max(...colors.map((c) => c.name.length));
    // Start with tolerance of 1 and increase until we have at least 2 results
    let tolerance = 1;
    let results = colors.filter((c) => c.name.length >= maxLen - tolerance);

    while (results.length < 2 && tolerance < maxLen) {
      tolerance++;
      results = colors.filter((c) => c.name.length >= maxLen - tolerance);
    }

    return results;
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
