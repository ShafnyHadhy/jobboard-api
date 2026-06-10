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

module.exports = { create }