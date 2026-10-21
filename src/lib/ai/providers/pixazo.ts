import type { ImageProvider } from './types';
import { decodeBase64Image, downloadImage } from './decode';

const DEFAULT_REQUEST_URL = 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';
const POLL_ATTEMPTS = 45;
const POLL_INTERVAL_MS = 2000;

interface PixazoImage { data?: string; base64?: string; url?: string }
interface PixazoResponse {
  status?: string;
  request_id?: string;
  message?: string;
  images?: PixazoImage[];
  output?: string;
  image?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pixazoProvider: ImageProvider = {
  id: 'pixazo',

  isConfigured: () => Boolean(process.env.PIXAZO_API_KEY),

  async generate({ prompt, seed }) {
    const requestUrl = process.env.PIXAZO_FLUX_SCHNELL_REQUEST_URL || DEFAULT_REQUEST_URL;
    const resultUrl = process.env.PIXAZO_FLUX_SCHNELL_RESULT_URL || requestUrl.replace('/getData', '/getData-result');
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY!,
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, num_steps: 4, seed: seed ?? Math.floor(Math.random() * 100000), width: 1024, height: 1024 }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`Pixazo request failed: ${response.status} ${details.slice(0, 200)}`);
    }

    let data = (await response.json()) as PixazoResponse;

    if (data.status === 'IN_QUEUE' && data.request_id) {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        await wait(POLL_INTERVAL_MS);
        const poll = await fetch(resultUrl, { method: 'POST', headers, body: JSON.stringify({ request_id: data.request_id }) });
        data = (await poll.json()) as PixazoResponse;
        if (data.status === 'COMPLETED' && data.images?.length) break;
        if (data.status === 'FAILED') throw new Error(data.message || 'Pixazo generation failed');
      }
    }

    const image = data.images?.[0];
    const inline = image?.data ?? image?.base64;
    if (inline) return decodeBase64Image(inline);
    if (image?.url) return downloadImage(image.url);

    const output = data.output ?? data.image;
    if (typeof output === 'string') return output.startsWith('http') ? downloadImage(output) : decodeBase64Image(output);

    throw new Error('Pixazo returned no image');
  },
};
