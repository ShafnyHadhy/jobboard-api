const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { create, update, getById, getMyCompany } = require('../controllers/companies.controller');

router.get('/my', authenticate, authorize('EMPLOYER'), getMyCompany)

// Public route
router.get('/:id', getById)

// Protected routes — EMPLOYER only
router.post('/', authenticate, authorize('EMPLOYER'), create)
router.patch('/:id', authenticate, authorize('EMPLOYER'), update)

module.exports = router;