import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

// General ceiling for any authenticated/anonymous API traffic (reads, search, etc.)
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Tighter ceiling for requests that create/modify/delete content (posts, comments,
// likes, reports, messages, profile edits) to curb spam and flooding.
export const writeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:write',
});

export function getClientIdentifier(request, userId) {
  if (userId) return `user:${userId}`;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
  return `ip:${ip}`;
}

export function rateLimitedResponse({ limit, remaining, reset }) {
  return NextResponse.json(
    { error: 'Too many requests howling in at once! Please slow down.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  );
}
