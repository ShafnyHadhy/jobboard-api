const prisma = require('../config/db')

const VALID_JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'ONSITE', 'REMOTE', 'HYBRID'];

// POST /api/jobs
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

module.exports = { create }