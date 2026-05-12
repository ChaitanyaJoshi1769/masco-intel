import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};

  private readonly requestsPerMinute = parseInt(process.env.RATE_LIMIT_REQUESTS || '60');
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || 'unknown';
    const now = Date.now();

    // Initialize or check existing entry
    if (!this.store[key]) {
      this.store[key] = { count: 0, resetTime: now + this.windowMs };
    }

    const entry = this.store[key];

    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }

    entry.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(this.requestsPerMinute));
    res.set('X-RateLimit-Remaining', String(Math.max(0, this.requestsPerMinute - entry.count)));
    res.set('X-RateLimit-Reset', String(entry.resetTime));

    // Check if limit exceeded
    if (entry.count > this.requestsPerMinute) {
      return res.status(429).json({
        statusCode: 429,
        message: 'Too Many Requests',
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    return next();
  }
}
