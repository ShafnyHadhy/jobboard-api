const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Access denied, No token provided'
        });
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            error: 'Forbidden, Invalid token'
        });
    }
}

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(req.user);
        if (roles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                error: 'Forbidden, Insufficient permissions'
            });
        }
    }
}

module.exports = { authenticate, authorize };