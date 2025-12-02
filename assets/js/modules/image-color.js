/**
 * Image Color Extractor
 * Extracts dominant color from an image using color quantization
 */

/**
 * Get dominant color from an image element
 * Uses color quantization and mode (most frequent color)
 * @param {HTMLImageElement} imageElement
 * @returns {{r: number, g: number, b: number, hex: string}}
 */
export function getDominantColor(imageElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Resize to optimize performance (smaller = faster)
  const maxSize = 150;
  const ratio = Math.min(
    maxSize / imageElement.width,
    maxSize / imageElement.height
  );
  canvas.width = imageElement.width * ratio;
  canvas.height = imageElement.height * ratio;

  // Draw image on canvas
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Color quantization: reduce colors to buckets
  const colorCounts = {};
  const quantizationFactor = 10; // Group similar colors (higher = more grouping)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];

    // Skip transparent pixels
    if (alpha < 125) continue;

    // Quantize color (round to nearest bucket)
    const qr = Math.round(r / quantizationFactor) * quantizationFactor;
    const qg = Math.round(g / quantizationFactor) * quantizationFactor;
    const qb = Math.round(b / quantizationFactor) * quantizationFactor;

    // Create color key
    const colorKey = `${qr},${qg},${qb}`;

    // Count occurrences
    if (colorCounts[colorKey]) {
      colorCounts[colorKey].count++;
      // Accumulate actual values for averaging within bucket
      colorCounts[colorKey].r += r;
      colorCounts[colorKey].g += g;
      colorCounts[colorKey].b += b;
    } else {
      colorCounts[colorKey] = { count: 1, r, g, b };
    }
  }

  // Sort colors by frequency
  const sortedColors = Object.entries(colorCounts)
    .map(([key, data]) => {
      const avgR = data.r / data.count;
      const avgG = data.g / data.count;
      const avgB = data.b / data.count;

      // Calculate saturation (to prefer colorful colors over grays)
      const max = Math.max(avgR, avgG, avgB);
      const min = Math.min(avgR, avgG, avgB);
      const saturation = max === 0 ? 0 : (max - min) / max;

      // Calculate lightness (average of RGB)
      const lightness = (avgR + avgG + avgB) / 3;

      return {
        r: Math.round(avgR),
        g: Math.round(avgG),
        b: Math.round(avgB),
        count: data.count,
        saturation,
        lightness,
      };
    })
    .sort((a, b) => b.count - a.count); // Sort by frequency first

  // Debug: log top 10 colors before filtering
  console.log("Top 10 colors by frequency (before filtering):");
  sortedColors.slice(0, 10).forEach((c, i) => {
    console.log(
      `${i + 1}. RGB(${c.r},${c.g},${c.b}) - Count: ${
        c.count
      }, Saturation: ${c.saturation.toFixed(
        3
      )}, Lightness: ${c.lightness.toFixed(1)}`
    );
  });

  // Filter by saturation AND lightness
  // Exclude: very dark (< 30), very light (> 240), or low saturation (< 0.1)
  const saturatedColors = sortedColors.filter(
    (color) =>
      color.saturation > 0.1 && color.lightness > 30 && color.lightness < 240
  );

  console.log(
    `Found ${saturatedColors.length} saturated and visible colors (saturation > 0.1, lightness 30-240)`
  );

  // If we have saturated colors, take the most frequent one
  if (saturatedColors.length > 0) {
    // Take top 10 most frequent saturated colors and find the most saturated one
    const topColors = saturatedColors.slice(0, 10);
    const dominantColor = topColors.reduce((best, current) => {
      // Prefer more saturated colors
      if (current.saturation > best.saturation) {
        return current;
      }
      // If saturation is similar, prefer more frequent
      if (
        Math.abs(current.saturation - best.saturation) < 0.1 &&
        current.count > best.count
      ) {
        return current;
      }
      return best;
    }, topColors[0]);

    console.log(
      `Selected dominant color: RGB(${dominantColor.r},${dominantColor.g},${
        dominantColor.b
      }) - Saturation: ${dominantColor.saturation.toFixed(3)}`
    );

    // Convert to hex
    const hex = rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
    return { ...dominantColor, hex };
  }

  // Fallback if no saturated color found (use average)
  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue; // Skip transparent
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
    hex: rgbToHex(
      Math.round(r / count),
      Math.round(g / count),
      Math.round(b / count)
    ),
  };
}

/**
 * Convert RGB to hex
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}
