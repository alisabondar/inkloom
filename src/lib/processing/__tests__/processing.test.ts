// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  countRegions,
  createRaster,
  DIFFICULTY_PRESETS,
  extractPalette,
  lineArt,
  nameColor,
  quantizeToPalette,
  regionOutlines,
  settingsForDifficulty,
  toGrayscale,
  valueStudy,
  type RasterImage,
} from '@/lib/processing';

const W = 64;
const H = 64;

function fill(width: number, height: number, color: (x: number, y: number) => [number, number, number]): RasterImage {
  const img = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const [r, g, b] = color(x, y);
      img.data[p] = r;
      img.data[p + 1] = g;
      img.data[p + 2] = b;
      img.data[p + 3] = 255;
    }
  }
  return img;
}

const halfBlackWhite = () => fill(W, H, (x) => (x < W / 2 ? [0, 0, 0] : [255, 255, 255]));
const stripes: [number, number, number][] = [
  [200, 30, 30],
  [30, 160, 60],
  [40, 50, 200],
];
// Widths 32 / 20 / 12 of 64 -> shares 0.5, 0.3125, 0.1875.
const stripeImage = () => fill(W, H, (x) => (x < 32 ? stripes[0] : x < 52 ? stripes[1] : stripes[2]));

const darkCount = (img: RasterImage) => {
  let n = 0;
  for (let p = 0; p < img.data.length; p += 4) if (img.data[p] < 128) n++;
  return n;
};
const isDark = (img: RasterImage, x: number, y: number) => img.data[(y * img.width + x) * 4] < 128;

describe('toGrayscale', () => {
  it('uses Rec.709 weights', () => {
    const g = toGrayscale(fill(1, 1, () => [0, 255, 0]));
    expect(g[0]).toBeCloseTo(0.7152, 3);
  });
});

describe('lineArt', () => {
  it('draws dark pixels on the boundary and white elsewhere', () => {
    const out = lineArt(halfBlackWhite(), { detail: 0.5, weight: 1 });
    expect(isDark(out, 31, 32) || isDark(out, 32, 32)).toBe(true);
    for (let y = 0; y < H; y++) {
      for (const x of [0, 10, 20, 44, 54, 63]) expect(isDark(out, x, y)).toBe(false);
    }
  });

  it('produces nothing on a flat image', () => {
    expect(darkCount(lineArt(fill(W, H, () => [120, 120, 120]), { detail: 1, weight: 2 }))).toBe(0);
  });

  it('more detail gives at least as many dark pixels', () => {
    const img = fill(W, H, (x, y) => {
      const v = Math.round(128 + 60 * Math.sin(x / 3) + 40 * Math.cos(y / 5) + (x > 40 ? 20 : 0));
      return [v, v, v];
    });
    let prev = -1;
    for (const detail of [0, 0.25, 0.5, 0.75, 1]) {
      const n = darkCount(lineArt(img, { detail, weight: 1 }));
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    expect(prev).toBeGreaterThan(0);
  });

  it('weight thickens lines', () => {
    const thin = darkCount(lineArt(halfBlackWhite(), { detail: 0.5, weight: 1 }));
    const thick = darkCount(lineArt(halfBlackWhite(), { detail: 0.5, weight: 4 }));
    expect(thick).toBeGreaterThan(thin);
  });

  it('handles 1024x1024 quickly', () => {
    const img = fill(1024, 1024, (x, y) => [(x * 7) & 255, (y * 3) & 255, (x ^ y) & 255]);
    const t = performance.now();
    lineArt(img, { detail: 0.5, weight: 2 });
    expect(performance.now() - t).toBeLessThan(2000);
  });
});

describe('valueStudy', () => {
  it.each([2, 3, 5, 9])('has at most %i grey levels', (steps) => {
    const img = fill(W, H, (x) => [x * 4, x * 4, x * 4]);
    const out = valueStudy(img, steps);
    const levels = new Set<number>();
    for (let p = 0; p < out.data.length; p += 4) {
      expect(out.data[p]).toBe(out.data[p + 1]);
      levels.add(out.data[p]);
    }
    expect(levels.size).toBeLessThanOrEqual(steps);
    expect(levels.size).toBeGreaterThan(1);
  });
});

describe('extractPalette', () => {
  it('recovers the colours of a 3-colour image with shares', () => {
    const palette = extractPalette(stripeImage(), 3);
    expect(palette).toHaveLength(3);
    expect(palette.map((c) => c.rgb)).toEqual(stripes);
    expect(palette[0].share).toBeCloseTo(0.5, 2);
    expect(palette[1].share).toBeCloseTo(0.3125, 2);
    expect(palette[2].share).toBeCloseTo(0.1875, 2);
    expect(palette[0].hex).toBe('#c81e1e');
    for (const c of palette) expect(c.name.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const img = fill(W, H, (x, y) => [(x * 4) & 255, (y * 4) & 255, (x * y) & 255]);
    expect(extractPalette(img, 8)).toEqual(extractPalette(img, 8));
  });

  it('does not invent colours when count exceeds distinct colours', () => {
    expect(extractPalette(stripeImage(), 8)).toHaveLength(3);
  });
});

describe('quantizeToPalette / regions', () => {
  it('labels pixels with the matching palette index', () => {
    const img = stripeImage();
    const palette = extractPalette(img, 3);
    const { image, labels } = quantizeToPalette(img, palette);
    expect(labels[0]).toBe(0);
    expect(labels[40]).toBe(1);
    expect(labels[60]).toBe(2);
    expect(Array.from(image.data.slice(0, 4))).toEqual([...stripes[0], 255]);
  });

  it('draws outlines at label boundaries only', () => {
    const { labels } = quantizeToPalette(stripeImage(), extractPalette(stripeImage(), 3));
    const out = regionOutlines(labels, W, H);
    expect(isDark(out, 31, 10)).toBe(true);
    expect(isDark(out, 51, 10)).toBe(true);
    expect(isDark(out, 10, 10)).toBe(false);
    expect(darkCount(regionOutlines(labels, W, H, 3))).toBeGreaterThan(darkCount(out));
  });

  it('counts connected regions', () => {
    const labels = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) labels[y * W + x] = (x < 32 ? 0 : 1) ^ (y < 32 ? 0 : 1);
    expect(countRegions(labels, W, H)).toBe(4);
    labels[5 * W + 5] = 1;
    expect(countRegions(labels, W, H)).toBe(5);
    expect(countRegions(labels, W, H, 2)).toBe(4);
  });
});

describe('nameColor', () => {
  it('names basic colours', () => {
    expect(nameColor([255, 255, 255])).toBe('Titanium white');
    expect(nameColor([40, 50, 160])).toBe('Ultramarine');
    expect(nameColor([204, 152, 56])).toBe('Yellow ochre');
  });
});

describe('difficulty presets', () => {
  it('increase in complexity', () => {
    const { beginner, intermediate, advanced } = DIFFICULTY_PRESETS;
    expect(advanced.detail).toBeGreaterThan(intermediate.detail);
    expect(intermediate.detail).toBeGreaterThan(beginner.detail);
    expect(advanced.paletteSize).toBeGreaterThan(beginner.paletteSize);
    expect(advanced.valueSteps).toBeGreaterThan(beginner.valueSteps);
    expect(settingsForDifficulty('beginner')).toEqual(beginner);
  });
});
