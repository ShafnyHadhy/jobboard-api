const prisma = require('../config/db')

// POST /api/companies
const create = async (req, res) => {
    const { name, description, website, logoUrl } = req.body;

    // Validate required fields
    if (!name) {
        return res.status(400).json({ error: 'Company name is required.' });
    }

    // Check if this employer already owns a company
    const existingCompany = await prisma.company.findUnique({
        where: { ownerId: req.user.id },
    });

    if (existingCompany) {
        return res.status(409).json({ error: 'You already own a company.' });
    }

    // Create the company
    const company = await prisma.company.create({
        data: {
            name,
            description: description || null,
            website: website || null,
            logoUrl: logoUrl || null,
            ownerId: req.user.id,
        },
        include: {
            owner: {
                select: { id: true, email: true, name: true, role: true },
            },
        },
    })

    res.status(201).json({
        message: 'Company created successfully.',
        company,
    })
}

// GET /api/companies/:id — public
const getById = async (req, res) => {

    const company = await prisma.company.findUnique({

        where: { id: req.params.id },
        include: {
            owner: {
                select: { id: true, name: true, email: true },
            },
            jobs: {
                where: { status: 'OPEN' },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    location: true,
                    type: true,
                    salary: true,
                    createdAt: true,
                },
            },
        },
    })

    if (!company) {
        return res.status(404).json({ error: 'Company not found.' })
    }

    res.json({ company })
}

// PATCH /api/companies/:id — EMPLOYER only (owner)
const update = async (req, res) => {

    const { name, description, website, logoUrl } = req.body

    const company = await prisma.company.findUnique({
        where: { id: req.params.id },
    })

    if (!company) {
        return res.status(404).json({ error: 'Company not found.' })
    }
    // Verify ownership
    if (company.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own company.' })
    }

    // Build partial update
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (website !== undefined) updateData.website = website || null
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null

    const updatedCompany = await prisma.company.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
            owner: {
                select: { id: true, name: true, email: true },
            },
        },
    })

    res.json({
        message: 'Company updated successfully.',
        company: updatedCompany,
    })
}

module.exports = { create, getById, update }