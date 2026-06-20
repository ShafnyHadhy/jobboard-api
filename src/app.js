const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const companyRoutes = require('./routes/companies')
const jobRoutes = require('./routes/jobs')
const applicationRoutes = require('./routes/applications')
const logger = require('./middleware/logger')

const app = express()

// ─── Global Middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(logger)

// ─── Health Check 
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── API Routes 
app.use('/api/auth', authRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)

// ─── 404 Handler 
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` })
})

// ─── Global Error Handler 
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error.'

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ─── Start Server 
const PORT = process.env.PORT || 3000
app.listen(PORT,
  () => console.log(`Server running on port ${PORT}`)
);