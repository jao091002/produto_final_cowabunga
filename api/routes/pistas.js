const express = require('express');
const db = require('../db');
const { normalizeText } = require('../utils/helpers');

const router = express.Router();

async function findPistaByName(nome, ignoredId = null) {
    const params = [nome.toLowerCase()];
    let sql = 'SELECT id FROM pistas WHERE LOWER(nome) = ?';
    if (ignoredId) {
        sql += ' AND id <> ?';
        params.push(ignoredId);
    }
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows[0];
}

function normalizePistaPayload(body) {
    const distancia = body.distancia_km === '' || body.distancia_km == null
        ? null
        : Number(body.distancia_km);

    return {
        nome: normalizeText(body.nome),
        localizacao: normalizeText(body.localizacao),
        distancia_km: Number.isFinite(distancia) && distancia > 0 ? distancia : null,
        descricao: normalizeText(body.descricao),
    };
}

router.get('/', async (req, res) => {
    try {
        const [pistas] = await db.query(`
            SELECT p.id, p.nome, p.localizacao, p.distancia_km, p.descricao,
                   COUNT(v.id) AS total_voltas,
                   COUNT(DISTINCT v.corredor_id) AS total_corredores,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM pistas p
            LEFT JOIN voltas v ON p.id = v.pista_id
            GROUP BY p.id, p.nome, p.localizacao, p.distancia_km, p.descricao
            ORDER BY p.nome ASC
        `);
        res.json(pistas);
    } catch (error) {
        console.error('Erro ao buscar pistas:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar pistas.' });
    }
});

router.post('/', async (req, res) => {
    const { nome, localizacao, distancia_km, descricao } = normalizePistaPayload(req.body);

    if (!nome) {
        return res.status(400).json({ erro: 'Nome da pista e obrigatorio.' });
    }

    try {
        const existing = await findPistaByName(nome);
        if (existing) {
            return res.status(409).json({ erro: 'Pista ja cadastrada.' });
        }

        const [result] = await db.query(
            'INSERT INTO pistas (nome, localizacao, distancia_km, descricao) VALUES (?, ?, ?, ?)',
            [nome, localizacao || null, distancia_km, descricao || null]
        );

        res.status(201).json({ id: result.insertId, nome, localizacao: localizacao || null, distancia_km, descricao: descricao || null });
    } catch (error) {
        console.error('Erro ao criar pista:', error.message);
        res.status(500).json({ erro: 'Erro ao criar pista.' });
    }
});

router.get('/ranking-geral/pilotos', async (req, res) => {
    try {
        const [ranking] = await db.query(`
            SELECT c.id, c.nome, c.turma, c.equipe,
                   COUNT(v.id) AS total_voltas,
                   COUNT(DISTINCT v.pista_id) AS total_pistas,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM voltas v
            INNER JOIN corredores c ON v.corredor_id = c.id
            GROUP BY c.id, c.nome, c.turma, c.equipe
            ORDER BY tempo_total ASC, total_voltas DESC, melhor_tempo ASC, c.nome ASC
        `);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking geral de pilotos:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar ranking geral de pilotos.' });
    }
});

router.get('/ranking-geral/equipes', async (req, res) => {
    try {
        const [ranking] = await db.query(`
            SELECT c.equipe,
                   COUNT(v.id) AS total_voltas,
                   COUNT(DISTINCT c.id) AS total_pilotos,
                   COUNT(DISTINCT v.pista_id) AS total_pistas,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM voltas v
            INNER JOIN corredores c ON v.corredor_id = c.id
            GROUP BY c.equipe
            ORDER BY tempo_total ASC, total_voltas DESC, melhor_tempo ASC, c.equipe ASC
        `);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking geral de equipes:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar ranking geral de equipes.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [pistas] = await db.query(`
            SELECT p.id, p.nome, p.localizacao, p.distancia_km, p.descricao,
                   COUNT(v.id) AS total_voltas,
                   COUNT(DISTINCT v.corredor_id) AS total_corredores,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM pistas p
            LEFT JOIN voltas v ON p.id = v.pista_id
            WHERE p.id = ?
            GROUP BY p.id, p.nome, p.localizacao, p.distancia_km, p.descricao
        `, [id]);

        if (pistas.length === 0) {
            return res.status(404).json({ erro: 'Pista nao encontrada.' });
        }

        res.json(pistas[0]);
    } catch (error) {
        console.error('Erro ao buscar pista:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar pista.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, localizacao, distancia_km, descricao } = normalizePistaPayload(req.body);

    if (!nome) {
        return res.status(400).json({ erro: 'Nome da pista e obrigatorio.' });
    }

    try {
        const existing = await findPistaByName(nome, id);
        if (existing) {
            return res.status(409).json({ erro: 'Pista ja cadastrada.' });
        }

        const [result] = await db.query(
            'UPDATE pistas SET nome = ?, localizacao = ?, distancia_km = ?, descricao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [nome, localizacao || null, distancia_km, descricao || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Pista nao encontrada.' });
        }

        res.json({ mensagem: 'Pista atualizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar pista:', error.message);
        res.status(500).json({ erro: 'Erro ao atualizar pista.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM pistas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Pista nao encontrada.' });
        }
        res.json({ mensagem: 'Pista deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar pista:', error.message);
        res.status(500).json({ erro: 'Erro ao deletar pista.' });
    }
});

router.get('/:id/ranking', async (req, res) => {
    const { id } = req.params;
    try {
        const [ranking] = await db.query(`
            SELECT c.id, c.nome, c.turma, c.equipe,
                   p.id AS pista_id, p.nome AS pista_nome,
                   COUNT(v.id) AS total_voltas,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM voltas v
            INNER JOIN corredores c ON v.corredor_id = c.id
            INNER JOIN pistas p ON v.pista_id = p.id
            WHERE p.id = ?
            GROUP BY c.id, c.nome, c.turma, c.equipe, p.id, p.nome
            ORDER BY tempo_total ASC, total_voltas DESC, melhor_tempo ASC, c.nome ASC
        `, [id]);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking da pista:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar ranking da pista.' });
    }
});

router.get('/:id/ranking-equipes', async (req, res) => {
    const { id } = req.params;
    try {
        const [ranking] = await db.query(`
            SELECT c.equipe,
                   p.id AS pista_id, p.nome AS pista_nome,
                   COUNT(v.id) AS total_voltas,
                   COUNT(DISTINCT c.id) AS total_pilotos,
                   MIN(v.tempo) AS melhor_tempo,
                   SUM(v.tempo) AS tempo_total
            FROM voltas v
            INNER JOIN corredores c ON v.corredor_id = c.id
            INNER JOIN pistas p ON v.pista_id = p.id
            WHERE p.id = ?
            GROUP BY c.equipe, p.id, p.nome
            ORDER BY tempo_total ASC, total_voltas DESC, melhor_tempo ASC, c.equipe ASC
        `, [id]);
        res.json(ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking de equipes:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar ranking de equipes.' });
    }
});

module.exports = router;
