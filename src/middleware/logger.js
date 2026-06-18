const crypto = require('crypto')

const logger = (req, res, next) => {

    const requestId = crypto.randomUUID()
    req.requestId = requestId

    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start

        const logEntry = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent') || 'unknown',
            userId: req.user?.id || null,
        }

        if (res.statusCode >= 500)
            console.error(JSON.stringify(logEntry))
        else if (res.statusCode >= 400)
            console.warn(JSON.stringify(logEntry))
        else
            console.log(JSON.stringify(logEntry))
    })

    next()
}

module.exports = logger