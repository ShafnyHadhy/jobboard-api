const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { create, update, getById } = require('../controllers/companies.controller');
const router = express.Router();

// Public route
router.get('/:id', getById)

// Protected routes — EMPLOYER only
router.post('/', authenticate, authorize('EMPLOYER'), create)
router.patch('/:id', authenticate, authorize('EMPLOYER'), update)

module.exports = router;