const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { create } = require('../controllers/companies.controller');
const router = express.Router();

router.post('/', authenticate, authorize('EMPLOYER'), create);

module.exports = router;