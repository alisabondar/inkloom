import type { GeneratedImage } from './types';

const MIN_IMAGE_BYTES = 1000;

export function decodeBase64Image(value: string): GeneratedImage {
  const match = value.match(/^data:(image\/[\w+.-]+);base64,(.*)$/);
  const contentType = match?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(Buffer.from(match?.[2] ?? value, 'base64'));
  if (bytes.byteLength < MIN_IMAGE_BYTES) throw new Error(`Image data too small (${bytes.byteLength} bytes)`);
  return { bytes, contentType };
}

export async function downloadImage(url: string): Promise<GeneratedImage> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < MIN_IMAGE_BYTES) throw new Error(`Image URL returned ${bytes.byteLength} bytes`);
  return { bytes, contentType: response.headers.get('content-type') || 'image/png' };
}
