import type { ImageProvider } from './types';
import { decodeBase64Image } from './decode';

const DEFAULT_MODEL = '@cf/black-forest-labs/flux-1-schnell';

interface CloudflareResponse {
  success?: boolean;
  result?: { image?: string };
  errors?: { message?: string }[];
}

// Cloudflare Workers AI (free daily allowance). Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
export const cloudflareProvider: ImageProvider = {
  id: 'cloudflare',

  isConfigured: () => Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),

  async generate({ prompt, seed }) {
    const model = process.env.CLOUDFLARE_IMAGE_MODEL || DEFAULT_MODEL;
    const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, steps: 8, ...(seed !== undefined ? { seed } : {}) }),
    });

    const data = (await response.json().catch(() => ({}))) as CloudflareResponse;

    if (!response.ok || !data.result?.image) {
      const message = data.errors?.map((e) => e.message).join('; ') || `status ${response.status}`;
      throw new Error(`Cloudflare Workers AI failed: ${message}`);
    }

    return decodeBase64Image(data.result.image);
  },
};
