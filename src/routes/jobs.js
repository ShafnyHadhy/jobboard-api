const express = require('express')
const router = express.Router()
const { authenticate, authorize } = require('../middleware/auth')
const { create } = require('../controllers/jobs.controller')

// POST /api/jobs — create a job posting (EMPLOYER only)
router.post('/', authenticate, authorize('EMPLOYER'), create)

module.exports = router