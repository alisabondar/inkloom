export type ProviderId = 'pixazo' | 'cloudflare';

export interface GeneratedImage {
  bytes: Uint8Array;
  contentType: string;
}

export interface ImageRequest {
  prompt: string;
  seed?: number;
}

export interface ImageProvider {
  id: ProviderId;
  isConfigured(): boolean;
  generate(request: ImageRequest): Promise<GeneratedImage>;
}
