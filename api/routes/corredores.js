const express = require('express');
const db = require('../db');
const { normalizeText } = require('../utils/helpers');

const router = express.Router();

async function findCorredorByName(nome, ignoredId = null) {
    const params = [nome.toLowerCase()];
    let sql = 'SELECT id FROM corredores WHERE LOWER(nome) = ?';
    if (ignoredId) {
        sql += ' AND id <> ?';
        params.push(ignoredId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0];
}

router.get('/', async (req, res) => {
    try {
        const [corredores] = await db.query(`
            SELECT c.id, c.nome, c.turma, c.equipe,
                   COUNT(v.id) AS total_voltas,
                   MIN(v.tempo) AS melhor_tempo,
                   AVG(v.tempo) AS tempo_medio,
                   SUM(v.tempo) AS tempo_total
            FROM corredores c
            LEFT JOIN voltas v ON c.id = v.corredor_id
            GROUP BY c.id, c.nome, c.turma, c.equipe
            ORDER BY c.nome ASC
        `);
        res.json(corredores);
    } catch (error) {
        console.error('Erro ao buscar corredores:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar corredores.' });
    }
});

router.post('/', async (req, res) => {
    const nome = normalizeText(req.body.nome);
    const turma = normalizeText(req.body.turma);
    const equipe = normalizeText(req.body.equipe);

    if (!nome || !equipe) {
        return res.status(400).json({ erro: 'Nome e equipe sao obrigatorios.' });
    }

    try {
        const existing = await findCorredorByName(nome);
        if (existing) {
            return res.status(409).json({ erro: 'Nome de corredor ja cadastrado.' });
        }

        const [result] = await db.query(
            'INSERT INTO corredores (nome, turma, equipe) VALUES (?, ?, ?)',
            [nome, turma || null, equipe]
        );

        res.status(201).json({ id: result.insertId, nome, turma: turma || null, equipe });
    } catch (error) {
        console.error('Erro ao criar corredor:', error.message);
        res.status(500).json({ erro: 'Erro ao criar corredor.' });
    }
});

router.get('/ranking', async (req, res) => {
    try {
        const [ranking] = await db.query(`
            SELECT c.id, c.nome, c.turma, c.equipe,
                   COUNT(v.id) AS total_voltas,
                   MIN(v.tempo) AS melhor_volta,
                   SUM(v.tempo) AS tempo_total
            FROM corredores c
            INNER JOIN voltas v ON c.id = v.corredor_id
            GROUP BY c.id, c.nome, c.turma, c.equipe
            ORDER BY tempo_total ASC, total_voltas DESC, melhor_volta ASC, c.nome ASC
        `);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar ranking.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [corredor] = await db.query(`
            SELECT c.id, c.nome, c.turma, c.equipe,
                   COUNT(v.id) AS total_voltas,
                   MIN(v.tempo) AS melhor_tempo,
                   AVG(v.tempo) AS tempo_medio,
                   SUM(v.tempo) AS tempo_total
            FROM corredores c
            LEFT JOIN voltas v ON c.id = v.corredor_id
            WHERE c.id = ?
            GROUP BY c.id, c.nome, c.turma, c.equipe
        `, [id]);

        if (corredor.length === 0) {
            return res.status(404).json({ erro: 'Corredor nao encontrado.' });
        }

        const [voltas] = await db.query(`
            SELECT v.id, v.corredor_id AS id_corredor, v.pista_id AS id_pista, v.numero_volta, v.tempo, v.created_at AS data,
                   p.nome AS pista_nome
            FROM voltas v
            LEFT JOIN pistas p ON v.pista_id = p.id
            WHERE v.corredor_id = ?
            ORDER BY p.nome ASC, v.numero_volta ASC
        `, [id]);

        res.json({ ...corredor[0], voltas });
    } catch (error) {
        console.error('Erro ao buscar corredor:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar corredor.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const nome = normalizeText(req.body.nome);
    const turma = normalizeText(req.body.turma);
    const equipe = normalizeText(req.body.equipe);

    if (!nome || !equipe) {
        return res.status(400).json({ erro: 'Nome e equipe sao obrigatorios.' });
    }

    try {
        const existing = await findCorredorByName(nome, id);
        if (existing) {
            return res.status(409).json({ erro: 'Nome de corredor ja cadastrado.' });
        }

        const params = [nome, turma || null, equipe, id];
        const query = 'UPDATE corredores SET nome = ?, turma = ?, equipe = ? WHERE id = ?';

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Corredor nao encontrado.' });
        }

        res.json({ mensagem: 'Corredor atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar corredor:', error.message);
        res.status(500).json({ erro: 'Erro ao atualizar corredor.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM corredores WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Corredor nao encontrado.' });
        }
        res.json({ mensagem: 'Corredor deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar corredor:', error.message);
        res.status(500).json({ erro: 'Erro ao deletar corredor.' });
    }
});

module.exports = router;
