const prisma = require('../config/db')

const VALID_STATUSES = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']

// POST /api/applications/:jobId — JOBSEEKER only
const apply = async (req, res) => {

    const { jobId } = req.params
    const { coverLetter } = req.body

    // Check job exists and is open
    const job = await prisma.job.findUnique({
        where: { id: jobId },
    })

    if (!job) {
        return res.status(404).json({ error: 'Job not found.' })
    }

    if (job.status !== 'OPEN') {
        return res.status(400).json({ error: 'This job is no longer accepting applications.' })
    }

    // Create application — unique constraint handles duplicate check
    try {
        const application = await prisma.application.create({
            data: {
                jobId,
                userId: req.user.id,
                coverLetter: coverLetter || null,
            },
            include: {
                job: {
                    select: { id: true, title: true, company: { select: { name: true } } },
                },
            },
        })
        res.status(201).json({
            message: 'Application submitted successfully.',
            application,
        })
    } catch (err) {
        // P2002 = unique constraint violation (already applied)
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'You have already applied to this job.' })
        }
        throw err // Re-throw unexpected errors → global error handler
    }
}

// GET /api/applications/my — JOBSEEKER only
const getMyApplications = async (req, res) => {

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
    const skip = (page - 1) * limit
    const where = { userId: req.user.id }

    // Optional filter by status
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
        where.status = req.query.status
    }

    const [applications, total] = await Promise.all([
        prisma.application.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        type: true,
                        status: true,
                        company: { select: { id: true, name: true, logoUrl: true } },
                    },
                },
            },
        }),
        prisma.application.count({ where }),
    ])

    res.json({
        applications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    })
}

// GET /api/jobs/:jobId/applications — EMPLOYER only (owner of the job's company)
const getJobApplications = async (req, res) => {

    const { jobId } = req.params
    // Find job and verify employer owns the company
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true },
    })

    if (!job) {
        return res.status(404).json({ error: 'Job not found.' })
    }

    if (job.company.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only view applicants for your own jobs.' })
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
    const skip = (page - 1) * limit
    const where = { jobId }

    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
        where.status = req.query.status
    }

    const [applications, total] = await Promise.all([
        prisma.application.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma.application.count({ where }),
    ])

    res.json({
        job: { id: job.id, title: job.title },
        applications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    })
}

// PATCH /api/applications/:id/status — EMPLOYER only
const updateStatus = async (req, res) => {

    const { status } = req.body

    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            error: `Status is required. Must be one of: ${VALID_STATUSES.join(', ')}`,
        })
    }
    // Find application with job → company chain for ownership check
    const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            job: {
                include: { company: true },
            },
        },
    })

    if (!application) {
        return res.status(404).json({ error: 'Application not found.' })
    }
    // Verify employer owns the company that posted this job
    if (application.job.company.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only update applications for your own jobs.' })
    }

    const updatedApplication = await prisma.application.update({
        where: { id: req.params.id },
        data: { status },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            job: {
                select: { id: true, title: true },
            },
        },
    })
    res.json({
        message: `Application status updated to ${status}.`,
        application: updatedApplication,
    })
}

module.exports = { apply, getMyApplications, getJobApplications, updateStatus }