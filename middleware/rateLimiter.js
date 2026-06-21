import rateLimit from 'express-rate-limit';
import Logger from '../utils/logger.js';

/**
 * Base rate limiter configuration
 * Used as a template for other limiters
 */
const baseLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes by default
  limit: 100, // Default max requests (will be overridden by individual limiters)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  // Skip rate limiting in development mode for easier testing
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
  handler: (req, res, next, options) => {
    Logger.warn(`Rate limit exceeded for ${req.ip}, Path: ${req.path}`);
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Use userId if authenticated, otherwise use IP
    if (req.session?.userId) {
      return `user:${req.session.userId}`;
    }
    return `ip:${req.ip}`;
  }
};

// Strict limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
  // Rate limiting ENABLED in all environments for testing
  keyGenerator: (req) => {
    const username = req.body?.username || 'anonymous';
    return `auth:${req.ip}:${username}`;
  },
  handler: (req, res, next, options) => {
    Logger.warn(`Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

/**
 * API rate limiter for general API endpoints
 * Prevents API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Please slow down your requests.'
  },
  // Rate limiting ENABLED in all environments
  keyGenerator: (req) => {
    // Use userId if authenticated, otherwise use IP
    if (req.session?.userId) {
      return `api:user:${req.session.userId}`;
    }
    return `api:ip:${req.ip}`;
  },
});

/**
 * Strict limiter for password reset endpoints
 * Prevents email bombing
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again after an hour.'
  },
  // Rate limiting ENABLED in all environments
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `password-reset:${req.ip}:${email}`;
  },
});

/**
 * Registration limiter
 * Prevents account creation spam
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again later.'
  },
  // Rate limiting ENABLED in all environments
  keyGenerator: (req) => {
    return `registration:${req.ip}`;
  }
});

/**
 * CRUD operations limiter
 * For creating, updating, deleting resources
 */
export const crudLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Operation rate limit exceeded. Please slow down.'
  },
  // Rate limiting ENABLED in all environments
  keyGenerator: (req) => {
    if (req.session?.userId) {
      return `crud:user:${req.session.userId}`;
    }
    return `crud:ip:${req.ip}`;
  }
});

/**
 * Export function to create custom limiters
 * Useful for route-specific limits
 */
export const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: message || 'Rate limit exceeded.'
    },
    // Rate limiting ENABLED in all environments
    keyGenerator: (req) => {
      if (req.session?.userId) {
        return `custom:user:${req.session.userId}`;
      }
      return `custom:ip:${req.ip}`;
    }
  });
};