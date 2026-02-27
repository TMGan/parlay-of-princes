import { NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      const entry = rateLimitStore[key];
      if (entry && entry.resetTime < now) {
        delete rateLimitStore[key];
      }
    });
  }, 5 * 60 * 1000);
}

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number } {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true, remaining: limit - 1 };
  }

  rateLimitStore[key].count++;

  if (rateLimitStore[key].count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - rateLimitStore[key].count };
}

export function createRateLimitResponse(message: string = 'Too many requests') {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes in seconds
      },
    }
  );
}
