const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { create, update, getById } = require('../controllers/companies.controller');


// Public route
router.get('/:id', getById)

// Protected routes — EMPLOYER only
router.post('/', authenticate, authorize('EMPLOYER'), create)
router.patch('/:id', authenticate, authorize('EMPLOYER'), update)

module.exports = router;