import { dilateMask, maskToRaster, toGrayscale, type RasterImage } from './raster';

export interface LineArtOptions {
  /** 0..1, higher = more lines. */
  detail: number;
  /** 1..4 px. */
  weight: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function gaussianBlur(src: Float32Array, width: number, height: number, sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 2));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = w;
    sum += w;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        acc += src[row + clamp(x + k, 0, width - 1)] * kernel[k + radius];
      }
      tmp[row + x] = acc;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        acc += tmp[clamp(y + k, 0, height - 1) * width + x] * kernel[k + radius];
      }
      out[y * width + x] = acc;
    }
  }
  return out;
}

function sobel(src: Float32Array, width: number, height: number): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    const ym = (y > 0 ? y - 1 : 0) * width;
    const yc = y * width;
    const yp = (y < height - 1 ? y + 1 : y) * width;
    for (let x = 0; x < width; x++) {
      const xm = x > 0 ? x - 1 : 0;
      const xp = x < width - 1 ? x + 1 : x;
      const gx =
        src[ym + xp] + 2 * src[yc + xp] + src[yp + xp] - src[ym + xm] - 2 * src[yc + xm] - src[yp + xm];
      const gy =
        src[yp + xm] + 2 * src[yp + x] + src[yp + xp] - src[ym + xm] - 2 * src[ym + x] - src[ym + xp];
      out[yc + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return out;
}

/** Value at the given quantile (0..1) of the magnitudes, via a 1024-bin histogram. */
function quantile(values: Float32Array, max: number, q: number): number {
  if (max <= 0) return 0;
  const bins = 1024;
  const hist = new Uint32Array(bins);
  for (let i = 0; i < values.length; i++) {
    hist[Math.min(bins - 1, Math.floor((values[i] / max) * bins))]++;
  }
  const target = q * values.length;
  let acc = 0;
  for (let b = 0; b < bins; b++) {
    acc += hist[b];
    if (acc >= target) return (b / bins) * max;
  }
  return max;
}

/**
 * Black lines on white: gaussian blur -> sobel -> percentile threshold -> dilate.
 * `detail` picks what share of the strongest edges survive, so it behaves the
 * same on low- and high-contrast images; a small absolute floor keeps flat
 * areas clean.
 */
export function lineArt(img: RasterImage, opts: LineArtOptions): RasterImage {
  const { width, height } = img;
  const detail = clamp(opts.detail, 0, 1);
  const weight = Math.round(clamp(opts.weight, 1, 4));

  const sigma = 1.6 - detail;
  const magnitude = sobel(gaussianBlur(toGrayscale(img), width, height, sigma), width, height);

  let max = 0;
  for (let i = 0; i < magnitude.length; i++) if (magnitude[i] > max) max = magnitude[i];

  const keepShare = 0.02 + detail * 0.2;
  const percentileThreshold = quantile(magnitude, max, 1 - keepShare);
  const floor = 0.3 * (1 - detail) + 0.05;
  const threshold = Math.max(percentileThreshold, floor);

  const mask = new Uint8Array(magnitude.length);
  for (let i = 0; i < magnitude.length; i++) mask[i] = magnitude[i] > threshold ? 1 : 0;

  return maskToRaster(dilateMask(mask, width, height, weight - 1), width, height);
}
