import { nameColor } from './colorNames';
import { createRaster, type RasterImage } from './raster';

export interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  /** 0..1 */
  share: number;
  name: string;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toHex = (rgb: [number, number, number]) =>
  '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

/**
 * Deterministic k-means (seeded k-means++ init) over a strided pixel sample.
 * Fully transparent pixels are ignored. Sorted by share, largest first.
 */
export function extractPalette(
  img: RasterImage,
  count: number,
  opts: { sampleStep?: number; seed?: number } = {},
): PaletteColor[] {
  const { width, height, data } = img;
  const k = Math.max(1, Math.round(count));
  const step = Math.max(1, Math.round(opts.sampleStep ?? Math.sqrt((width * height) / 40000)));
  const random = mulberry32(opts.seed ?? 1);

  const samples: number[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const p = (y * width + x) * 4;
      if (data[p + 3] < 16) continue;
      samples.push(data[p], data[p + 1], data[p + 2]);
    }
  }
  const pts = Float32Array.from(samples);
  const n = pts.length / 3;
  if (n === 0) return [];

  // k-means++ initialisation.
  const centers = new Float32Array(k * 3);
  const dist = new Float32Array(n).fill(Infinity);
  let first = Math.floor(random() * n);
  let used = 0;
  for (let c = 0; c < k; c++) {
    centers.set(pts.subarray(first * 3, first * 3 + 3), c * 3);
    used++;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const dr = pts[i * 3] - centers[c * 3];
      const dg = pts[i * 3 + 1] - centers[c * 3 + 1];
      const db = pts[i * 3 + 2] - centers[c * 3 + 2];
      const d = dr * dr + dg * dg + db * db;
      if (d < dist[i]) dist[i] = d;
      total += dist[i];
    }
    if (total === 0) break; // fewer distinct colours than k
    let r = random() * total;
    first = n - 1;
    for (let i = 0; i < n; i++) {
      r -= dist[i];
      if (r <= 0 && dist[i] > 0) {
        first = i;
        break;
      }
    }
  }

  const labels = new Uint16Array(n);
  const sums = new Float64Array(used * 3);
  const sizes = new Uint32Array(used);
  for (let iter = 0; iter < 16; iter++) {
    sums.fill(0);
    sizes.fill(0);
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const r = pts[i * 3];
      const g = pts[i * 3 + 1];
      const b = pts[i * 3 + 2];
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < used; c++) {
        const dr = r - centers[c * 3];
        const dg = g - centers[c * 3 + 1];
        const db = b - centers[c * 3 + 2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (labels[i] !== best) changed++;
      labels[i] = best;
      sums[best * 3] += r;
      sums[best * 3 + 1] += g;
      sums[best * 3 + 2] += b;
      sizes[best]++;
    }
    for (let c = 0; c < used; c++) {
      if (sizes[c] === 0) continue;
      centers[c * 3] = sums[c * 3] / sizes[c];
      centers[c * 3 + 1] = sums[c * 3 + 1] / sizes[c];
      centers[c * 3 + 2] = sums[c * 3 + 2] / sizes[c];
    }
    if (iter > 0 && changed === 0) break;
  }

  const result: PaletteColor[] = [];
  for (let c = 0; c < used; c++) {
    if (sizes[c] === 0) continue;
    const rgb: [number, number, number] = [
      Math.round(centers[c * 3]),
      Math.round(centers[c * 3 + 1]),
      Math.round(centers[c * 3 + 2]),
    ];
    result.push({ hex: toHex(rgb), rgb, share: sizes[c] / n, name: nameColor(rgb) });
  }
  return result.sort((a, b) => b.share - a.share || a.hex.localeCompare(b.hex));
}

/** Maps every pixel to its nearest palette colour. `labels` holds palette indices. */
export function quantizeToPalette(
  img: RasterImage,
  palette: PaletteColor[],
): { image: RasterImage; labels: Uint8Array } {
  const { width, height, data } = img;
  const out = createRaster(width, height);
  const labels = new Uint8Array(width * height);
  const k = palette.length;
  if (k === 0) return { image: out, labels };
  const pr = new Float32Array(k);
  const pg = new Float32Array(k);
  const pb = new Float32Array(k);
  palette.forEach((c, i) => {
    [pr[i], pg[i], pb[i]] = c.rgb;
  });
  const od = out.data;
  for (let i = 0, p = 0; i < labels.length; i++, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const d = (r - pr[c]) ** 2 + (g - pg[c]) ** 2 + (b - pb[c]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    labels[i] = best;
    od[p] = pr[best];
    od[p + 1] = pg[best];
    od[p + 2] = pb[best];
    od[p + 3] = 255;
  }
  return { image: out, labels };
}
