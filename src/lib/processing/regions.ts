import { dilateMask, maskToRaster, type RasterImage } from './raster';

/** Black boundaries between differing labels, on white. */
export function regionOutlines(labels: Uint8Array, width: number, height: number, weight = 1): RasterImage {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if ((x < width - 1 && labels[i] !== labels[i + 1]) || (y < height - 1 && labels[i] !== labels[i + width])) {
        mask[i] = 1;
      }
    }
  }
  const radius = Math.round(Math.min(4, Math.max(1, weight))) - 1;
  return maskToRaster(dilateMask(mask, width, height, radius), width, height);
}

/** Number of 4-connected same-label regions with at least `minSize` pixels. */
export function countRegions(labels: Uint8Array, width: number, height: number, minSize = 1): number {
  const n = width * height;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  let count = 0;
  const visit = (j: number, label: number, top: number): number => {
    if (seen[j] || labels[j] !== label) return top;
    seen[j] = 1;
    stack[top] = j;
    return top + 1;
  };
  for (let start = 0; start < n; start++) {
    if (seen[start]) continue;
    const label = labels[start];
    let top = 0;
    let size = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top > 0) {
      const i = stack[--top];
      size++;
      const x = i % width;
      if (x > 0) top = visit(i - 1, label, top);
      if (x < width - 1) top = visit(i + 1, label, top);
      if (i >= width) top = visit(i - width, label, top);
      if (i + width < n) top = visit(i + width, label, top);
    }
    if (size >= minSize) count++;
  }
  return count;
}
