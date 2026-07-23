const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimitter');
const router = express.Router();

// rate limited: 10 requests per 15 min per IP
router.post('/register', authLimiter, register);

// rate limited: 10 requests per 15 min per IP
router.post('/login', authLimiter, login);

module.exports = router;