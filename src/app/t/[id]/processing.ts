import {
  countRegions,
  extractPalette,
  lineArt,
  quantizeToPalette,
  regionOutlines,
  valueStudy,
  type PaletteColor,
  type RasterImage,
} from '@/lib/processing';

export interface ProcessParams {
  detail: number;
  weight: number;
  valueSteps: number;
  paletteSize: number;
}

export interface ProcessResult {
  lines: RasterImage;
  values: RasterImage;
  numbers: RasterImage;
  palette: PaletteColor[];
  regions: number;
}

export interface WorkerRequest { id: number; image: RasterImage; params: ProcessParams }
export interface WorkerResponse { id: number; result?: ProcessResult; error?: string }

/** Every derived layer for one set of settings. Pure, so it runs in the worker or on the main thread. */
export function processAll(image: RasterImage, params: ProcessParams): ProcessResult {
  const palette = extractPalette(image, params.paletteSize);
  const { labels } = quantizeToPalette(image, palette);
  const minRegion = Math.max(4, Math.round((image.width * image.height) / 4000));
  return {
    lines: lineArt(image, { detail: params.detail, weight: params.weight }),
    values: valueStudy(image, params.valueSteps),
    numbers: regionOutlines(labels, image.width, image.height, 1),
    palette,
    regions: countRegions(labels, image.width, image.height, minRegion),
  };
}
