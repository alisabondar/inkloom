export interface RasterImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function createRaster(width: number, height: number): RasterImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Rec.709 luminance in 0..1 for every pixel. */
export function toGrayscale(img: RasterImage): Float32Array {
  const { data } = img;
  const n = img.width * img.height;
  const out = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    out[i] = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
  }
  return out;
}

/** Grows a 0/1 mask by a square of the given radius (separable max filter). */
export function dilateMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return mask;
  const tmp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      for (let k = x0; k <= x1; k++) {
        if (mask[row + k]) {
          tmp[row + x] = 1;
          break;
        }
      }
    }
  }
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      for (let k = y0; k <= y1; k++) {
        if (tmp[k * width + x]) {
          out[y * width + x] = 1;
          break;
        }
      }
    }
  }
  return out;
}

/** Renders a 0/1 mask as black (1) on white (0). */
export function maskToRaster(mask: Uint8Array, width: number, height: number): RasterImage {
  const out = createRaster(width, height);
  const { data } = out;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const v = mask[i] ? 0 : 255;
    data[p] = v;
    data[p + 1] = v;
    data[p + 2] = v;
    data[p + 3] = 255;
  }
  return out;
}
