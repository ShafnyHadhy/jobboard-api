const redis = require('../config/redis');

const CACHE_TTL = 300; // 5 mins
const CACHE_PREFIX = 'cache:'

const cacheMiddleware = (req, res, next) => {

    if (req.method !== 'GET') return next();

    const cacheKey = `${CACHE_PREFIX}${req.originalUrl}`

    redis
        .get(cacheKey)
        .then((cached) => {

            if (cached) {
                const data = JSON.parse(cached)
                return res.json({ ...data, _cache: 'HIT' })
            }

            const originalJson = res.json.bind(res)

            res.json = (body) => {
                if (res.statusCode === 200) {
                    redis
                        .setex(cacheKey, CACHE_TTL, JSON.stringify(body))
                        .catch((error) => console.error('Cache write error:', error))
                }

                return originalJson({ ...body, _cache: 'MISS' })
            }

            next()
        })
        .catch((error) => {
            console.error('Cache read error:', error)
            next()
        })
}

// Helper: clear all cached job listings
const invalidateJobCache = async () => {
    try {
        // SCAN for all keys matching the pattern (safer than KEYS in production)
        const stream = redis.scanStream({
            match: `${CACHE_PREFIX}/api/jobs*`,
            count: 100,
        })
        const keysToDelete = []
        stream.on('data', (keys) => {
            keysToDelete.push(...keys)
        })
        stream.on('end', async () => {
            if (keysToDelete.length > 0) {
                await redis.del(...keysToDelete)
                console.log(`Cache invalidated: ${keysToDelete.length} entries cleared`)
            }
        })
    } catch (err) {
        console.error('Cache invalidation error:', err)
    }
}

module.exports = { cacheMiddleware, invalidateJobCache }

