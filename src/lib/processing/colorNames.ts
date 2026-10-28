type Rgb = [number, number, number];

const PAINT_COLORS: [string, Rgb][] = [
  ['Titanium white', [245, 245, 240]],
  ['Ivory', [236, 228, 205]],
  ['Naples yellow', [250, 218, 140]],
  ['Lemon yellow', [245, 230, 60]],
  ['Cadmium yellow', [255, 196, 0]],
  ['Yellow ochre', [204, 152, 56]],
  ['Raw sienna', [190, 120, 60]],
  ['Cadmium orange', [240, 120, 30]],
  ['Burnt sienna', [138, 54, 15]],
  ['Burnt umber', [92, 58, 33]],
  ['Raw umber', [115, 92, 64]],
  ['Van Dyke brown', [64, 45, 33]],
  ['Cadmium red', [210, 30, 35]],
  ['Vermilion', [227, 66, 52]],
  ['Alizarin crimson', [160, 20, 50]],
  ['Rose madder', [230, 140, 160]],
  ['Quinacridone magenta', [150, 35, 100]],
  ['Dioxazine purple', [75, 40, 110]],
  ['Lavender', [180, 165, 210]],
  ['Ultramarine', [40, 50, 160]],
  ['Cobalt blue', [0, 80, 180]],
  ['Cerulean blue', [40, 130, 200]],
  ['Prussian blue', [20, 45, 75]],
  ['Sky blue', [150, 195, 230]],
  ['Phthalo turquoise', [0, 130, 140]],
  ['Viridian', [40, 130, 100]],
  ['Phthalo green', [20, 80, 60]],
  ['Sap green', [80, 110, 40]],
  ['Olive green', [120, 125, 60]],
  ['Sage', [160, 175, 140]],
  ['Terre verte', [110, 130, 100]],
  ['Flesh tint', [235, 190, 160]],
  ["Payne's grey", [60, 66, 78]],
  ['Neutral grey', [128, 128, 128]],
  ['Silver grey', [192, 192, 192]],
  ['Ivory black', [25, 25, 25]],
];

function toLab([r, g, b]: Rgb): Rgb {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const PAINT_LAB = PAINT_COLORS.map(([, rgb]) => toLab(rgb));

/** Nearest painterly colour name (CIE76 distance in Lab). */
export function nameColor(rgb: Rgb): string {
  const [l, a, b] = toLab(rgb);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PAINT_LAB.length; i++) {
    const [l2, a2, b2] = PAINT_LAB[i];
    const d = (l - l2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return PAINT_COLORS[best][0];
}
