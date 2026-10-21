import { createRaster, toGrayscale, type RasterImage } from './raster';

/** Posterized greyscale with `steps` evenly spaced values (2..9). */
export function valueStudy(img: RasterImage, steps: number): RasterImage {
  const n = Math.round(Math.min(9, Math.max(2, steps)));
  const gray = toGrayscale(img);
  const out = createRaster(img.width, img.height);
  const { data } = out;
  const levels = new Uint8Array(n);
  for (let i = 0; i < n; i++) levels[i] = Math.round((i / (n - 1)) * 255);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const v = levels[Math.min(n - 1, Math.floor(gray[i] * n))];
    data[p] = v;
    data[p + 1] = v;
    data[p + 2] = v;
    data[p + 3] = 255;
  }
  return out;
}
