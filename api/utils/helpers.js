const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function normalizeText(value = '') {
    return String(value || '').trim();
}

function normalizeEmail(value = '') {
    return String(value || '').trim().toLowerCase();
}

function isValidEmail(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function hashPassword(password = '') {
    return bcrypt.hash(String(password), 12);
}

async function comparePassword(password = '', hash = '') {
    return bcrypt.compare(String(password), String(hash));
}

function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET não definido no ambiente');
    }
    return jwt.sign(payload, secret, { expiresIn: '8h' });
}

function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET não definido no ambiente');
    }
    return jwt.verify(token, secret);
}

function sanitizeUser(user) {
    return {
        id: user.id_users || user.id,
        nome: String(user.nome || ''),
        email: String(user.email || ''),
    };
}

module.exports = {
    normalizeText,
    normalizeEmail,
    isValidEmail,
    hashPassword,
    comparePassword,
    signToken,
    verifyToken,
    sanitizeUser,
};
