const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    )
}

// POST /api/auth/register
const register = async (req, res) => {
    const { email, password, name, role } = req.body

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' })
    }

    const validRoles = ['EMPLOYER', 'JOBSEEKER']
    const userRole = role || 'JOBSEEKER'

    if (!validRoles.includes(userRole)) {
        return res.status(400).json({ error: 'Role must be EMPLOYER or JOBSEEKER.' })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        return res.status(409).json({ error: 'Email already registered.' })
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: userRole,
        },
    });

    const token = generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
        message: 'User registered successfully.',
        user: userWithoutPassword,
        token,
    });
}

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = generateToken(user);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
        message: 'Login successful.',
        user: userWithoutPassword,
        token,
    })
}

module.exports = { register, login }
