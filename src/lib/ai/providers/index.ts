import { cloudflareProvider } from './cloudflare';
import { pixazoProvider } from './pixazo';
import type { GeneratedImage, ImageProvider, ImageRequest, ProviderId } from './types';

export type { GeneratedImage, ImageProvider, ImageRequest, ProviderId } from './types';

const ALL_PROVIDERS: ImageProvider[] = [pixazoProvider, cloudflareProvider];

// Configured providers, primary first. IMAGE_PROVIDER picks the primary; the rest are fallbacks.
export function getProviderOrder(providers: ImageProvider[] = ALL_PROVIDERS, primary = process.env.IMAGE_PROVIDER): ImageProvider[] {
  const configured = providers.filter((provider) => provider.isConfigured());
  return [...configured].sort((a, b) => Number(b.id === primary) - Number(a.id === primary));
}

export async function generateImage(
  request: ImageRequest,
  providers: ImageProvider[] = getProviderOrder(),
): Promise<{ provider: ProviderId; image: GeneratedImage }> {
  if (!providers.length) {
    throw new Error('No image provider is configured. Set PIXAZO_API_KEY or CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
  }

  const failures: string[] = [];
  for (const provider of providers) {
    try {
      return { provider: provider.id, image: await provider.generate(request) };
    } catch (error) {
      failures.push(`${provider.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`All image providers failed — ${failures.join(' | ')}`);
}
