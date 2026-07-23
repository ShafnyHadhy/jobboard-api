const express = require('express')
const router = express.Router()
const { authenticate, authorize } = require('../middleware/auth')
const {
    apply,
    getMyApplications,
    getJobApplications,
    updateStatus,
} = require('../controllers/applications.controller')
const { applicationLimiter } = require('../middleware/rateLimitter')

// JOBSEEKER routes
router.post('/:jobId', authenticate, authorize('JOBSEEKER'), applicationLimiter, apply)
router.get('/my', authenticate, authorize('JOBSEEKER'), getMyApplications)

// EMPLOYER routes
router.get('/jobs/:jobId', authenticate, authorize('EMPLOYER'), getJobApplications)
router.patch('/:id/status', authenticate, authorize('EMPLOYER'), updateStatus)

module.exports = router