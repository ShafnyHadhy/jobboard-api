const prisma = require('../config/db')

const VALID_JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'ONSITE', 'REMOTE', 'HYBRID'];

const create = async (req, res) => {
    const { title, description, location, type, salary } = req.body;

    // Validate required fields
    if (!title || !description || !location) {
        return res.status(400).json({ error: 'Title, description, and location are required.' })
    }

    // Validate job type if provided
    const jobType = type || 'FULL_TIME'
    if (!VALID_JOB_TYPES.includes(jobType)) {
        return res.status(400).json({
            error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(', ')}`,
        })
    }

    // Find the employer's company
    const company = await prisma.company.findUnique({
        where: { ownerId: req.user.id },
    })

    if (!company) {
        return res.status(400).json({
            error: 'You must create a company before posting jobs. POST /api/companies',
        })
    }

    // Create the job
    const job = await prisma.job.create({
        data: {
            title,
            description,
            location,
            type: jobType,
            salary: salary || null,
            status: 'OPEN',
            companyId: company.id,
        },
        include: {
            company: {
                select: { id: true, name: true },
            },
        },
    })

    res.status(201).json({
        message: 'Job created successfully.',
        job,
    })
}

const getAll = async (req, res) => {

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
    const skip = (page - 1) * limit

    // Build dynamic filter from query params
    const where = {}

    if (req.query.location) {
        where.location = { contains: req.query.location, mode: 'insensitive' }
    }

    if (req.query.type && VALID_JOB_TYPES.includes(req.query.type)) {
        where.type = req.query.type
    }

    if (req.query.status && VALID_JOB_STATUSES.includes(req.query.status)) {
        where.status = req.query.status
    } else {
        where.status = 'OPEN' // Default: only show open jobs
    }

    if (req.query.search) {
        where.title = { contains: req.query.search, mode: 'insensitive' }
    }

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                company: {
                    select: { id: true, name: true, logoUrl: true },
                }
            },
        }),
        prisma.job.count({ where }),
    ])

    res.status(200).json({
        jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    })

}

const getById = async (req, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
            company: {
                select: { id: true, name: true, description: true, website: true, logoUrl: true },
            },
        },
    })
    if (!job) {
        return res.status(404).json({ error: 'Job not found.' })
    }
    res.status(200).json({ job })
}

const update = async (req, res) => {

    const { title, description, location, type, salary, status } = req.body
    // Find the job with its company
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { company: true },
    })

    if (!job) {
        return res.status(404).json({ error: 'Job not found.' })
    }

    // Verify ownership: employer must own the company that posted this job
    if (job.company.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit jobs from your own company.' })
    }

    // Validate type if provided
    if (type && !VALID_JOB_TYPES.includes(type)) {
        return res.status(400).json({
            error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(', ')}`,
        })
    }
    // Validate status if provided
    if (status && !VALID_JOB_STATUSES.includes(status)) {
        return res.status(400).json({
            error: `Invalid status. Must be one of: ${VALID_JOB_STATUSES.join(', ')}`,
        })
    }
    // Build update data — only include fields that were sent
    const updateData = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (location !== undefined) updateData.location = location
    if (type !== undefined) updateData.type = type
    if (salary !== undefined) updateData.salary = salary || null
    if (status !== undefined) updateData.status = status

    const updatedJob = await prisma.job.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
            company: {
                select: { id: true, name: true },
            },
        },
    })
    res.json({
        message: 'Job updated successfully.',
        job: updatedJob,
    })
}

const remove = async (req, res) => {

    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: { company: true },
    })

    if (!job) {
        return res.status(404).json({ error: 'Job not found.' })
    }

    if (job.company.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete jobs from your own company.' })
    }

    await prisma.job.delete({ where: { id: req.params.id } })

    res.status(200).json({ message: 'Job deleted successfully.' })
}

module.exports = { create, getAll, getById, update, remove }