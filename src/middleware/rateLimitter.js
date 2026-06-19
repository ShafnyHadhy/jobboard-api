const redis = require('../config/redis')
const RATE_LIMIT_PREFIX = 'ratelimit:'

/**
 * Creates a rate limiter middleware.
 * @param {Object} options
 * @param {number} options.max - Maximum requests allowed in the window
 * @param {number} options.windowSeconds - Time window in seconds
 * @param {string} [options.keyPrefix] - Optional prefix for the Redis key
 * @param {Function} [options.keyGenerator] - Custom function to generate the rate limit key from req
 */

const createRateLimiter = ({
    max = 10,
    windowSeconds = 900,
    keyPrefix = '',
    keyGenerator = null,
}) => {
    return async (req, res, next) => {
        try {
            const identifier = keyGenerator
                ? keyGenerator(req)
                : req.user?.id || req.ip

            const key = `${RATE_LIMIT_PREFIX}${keyPrefix}${identifier}`

            const current = await redis.incr(key)

            if (current === 1) {
                await redis.expire(key, windowSeconds)
            }

            const ttl = await redis.ttl(key)

            res.set({
                'X-RateLimit-Limit': max,
                'X-RateLimit-Remaining': Math.max(0, max - current),
                'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + ttl,
            })

            if (current > max) {
                return res.status(429).json({
                    error: 'Too many requests. Please try again later.',
                    retryAfter: `${ttl} seconds`
                })
            }

            next()

        } catch (error) {
            console.error('Rate limiter error:', error)
            next()
        }
    }
}

const authLimiter = createRateLimiter({
    max: 10,
    windowSeconds: 900,
    keyPrefix: 'auth:',
})

const applicationLimitter = createRateLimiter({
    max: 5,
    windowSeconds: 900,
    keyPrefix: 'apply:',
    keyGenerator: (req) => req.user.id,
})

module.exports = { createRateLimiter, authLimiter, applicationLimitter }