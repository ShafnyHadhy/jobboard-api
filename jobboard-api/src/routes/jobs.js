const express = require('express')
const router = express.Router()
const { authenticate, authorize } = require('../middleware/auth')
const { cacheMiddleware } = require('../middleware/cache')
const { create, getAll, getById, update, remove, getMyJobs } = require('../controllers/jobs.controller')

router.get('/', cacheMiddleware, getAll);

router.get('/my', authenticate, authorize('EMPLOYER'), getMyJobs)

router.get('/:id', getById);

// POST /api/jobs — create a job posting (EMPLOYER only)
router.post('/', authenticate, authorize('EMPLOYER'), create);

router.patch('/:id', authenticate, authorize('EMPLOYER'), update);
router.delete('/:id', authenticate, authorize('EMPLOYER'), remove);

module.exports = router