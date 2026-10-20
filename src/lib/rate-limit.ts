interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

// In-memory sliding-window limiter. Counts are per server instance.
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return function check(key: string): RateLimitResult {
    const currentTime = now();
    const recent = (hits.get(key) || []).filter((time) => currentTime - time < windowMs);

    if (recent.length >= limit) {
      hits.set(key, recent);
      const retryAfterMs = windowMs - (currentTime - recent[0]);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    recent.push(currentTime);
    hits.set(key, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_GENERATIONS_PER_HOUR = 10;

export function getGenerateLimitPerHour() {
  const configured = parseInt(process.env.GENERATE_RATE_LIMIT_PER_HOUR || '', 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_GENERATIONS_PER_HOUR;
}

export const checkGenerateRateLimit = createRateLimiter({
  limit: getGenerateLimitPerHour(),
  windowMs: HOUR_MS,
});
