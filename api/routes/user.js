const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const {
    normalizeText,
    normalizeEmail,
    isValidEmail,
    hashPassword,
    comparePassword,
    signToken,
    sanitizeUser,
} = require('../utils/helpers');

const router = express.Router();

function normalizeUserPayload(body) {
    return {
        nome: normalizeText(body.nome),
        email: normalizeEmail(body.email),
        senha: normalizeText(body.senha),
    };
}

async function findUserByEmail(email, ignoredId = null) {
    const params = [email];
    let sql = 'SELECT id, nome, email, senha FROM users WHERE LOWER(email) = ?';
    if (ignoredId) {
        sql += ' AND id <> ?';
        params.push(ignoredId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0];
}

router.get('/', requireAuth, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, nome, email FROM users ORDER BY nome');
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuarios:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar usuarios.' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
});

router.post('/', async (req, res) => {
    const { nome, email, senha } = normalizeUserPayload(req.body);

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Nome, email e senha sao obrigatorios.' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ erro: 'Email invalido.' });
    }

    if (senha.length < 8) {
        return res.status(400).json({ erro: 'Senha deve ter ao menos 8 caracteres.' });
    }

    try {
        const duplicated = await findUserByEmail(email);
        if (duplicated) {
            return res.status(409).json({ erro: 'E-mail ja cadastrado.' });
        }

        const hashedSenha = await hashPassword(senha);
        const [result] = await db.query(
            'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, hashedSenha]
        );

        res.status(201).json({ id: result.insertId, nome, email });
    } catch (error) {
        console.error('Erro ao criar usuario:', error.message);
        res.status(500).json({ erro: 'Erro ao criar usuario.' });
    }
});

router.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const senha = normalizeText(req.body.senha);

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha sao obrigatorios.' });
    }

    try {
        const [rows] = await db.query('SELECT id, nome, email, senha FROM users WHERE LOWER(email) = ? LIMIT 1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais invalidas.' });
        }

        const user = rows[0];
        const match = await comparePassword(senha, user.senha);
        if (!match) {
            return res.status(401).json({ erro: 'Credenciais invalidas.' });
        }

        const token = signToken({ id: user.id, nome: user.nome, email: user.email });
        res.json({
            mensagem: 'Login bem-sucedido',
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        res.status(500).json({ erro: 'Erro ao fazer login.' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    if (Number(id) !== Number(req.user.id)) {
        return res.status(403).json({ erro: 'Acesso negado.' });
    }

    const { nome, email, senha } = normalizeUserPayload(req.body);
    if (!nome || !email) {
        return res.status(400).json({ erro: 'Nome e email sao obrigatorios.' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ erro: 'Email invalido.' });
    }

    try {
        const duplicated = await findUserByEmail(email, id);
        if (duplicated) {
            return res.status(409).json({ erro: 'E-mail ja cadastrado.' });
        }

        const params = [nome, email];
        let query = 'UPDATE users SET nome = ?, email = ?';

        if (senha) {
            if (senha.length < 8) {
                return res.status(400).json({ erro: 'Senha deve ter ao menos 8 caracteres.' });
            }
            const hashedSenha = await hashPassword(senha);
            query += ', senha = ?';
            params.push(hashedSenha);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Usuario nao encontrado.' });
        }

        res.json({ mensagem: 'Usuario atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar usuario:', error.message);
        res.status(500).json({ erro: 'Erro ao atualizar usuario.' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    if (Number(id) !== Number(req.user.id)) {
        return res.status(403).json({ erro: 'Acesso negado.' });
    }

    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Usuario nao encontrado.' });
        }

        res.json({ mensagem: 'Usuario excluido com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir usuario:', error.message);
        res.status(500).json({ erro: 'Erro ao excluir usuario.' });
    }
});

module.exports = router;
