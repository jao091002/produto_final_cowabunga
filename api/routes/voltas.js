const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const [voltas] = await db.query(`
            SELECT v.id,
                   v.corredor_id AS id_corredor,
                   v.pista_id AS id_pista,
                   v.numero_volta,
                   v.tempo,
                   v.created_at AS data,
                   c.nome AS corredor_nome,
                   c.turma,
                   c.equipe,
                   p.nome AS pista_nome,
                   p.localizacao AS pista_localizacao
            FROM voltas v
            LEFT JOIN corredores c ON v.corredor_id = c.id
            LEFT JOIN pistas p ON v.pista_id = p.id
            ORDER BY v.created_at DESC
        `);
        res.json(voltas);
    } catch (error) {
        console.error('Erro ao buscar voltas:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar voltas.' });
    }
});

router.post('/', async (req, res) => {
    const id_corredor = Number(req.body.id_corredor);
    const id_pista = Number(req.body.id_pista);
    const numero_volta = Number(req.body.numero_volta);
    const tempo = Number(req.body.tempo);

    if (!id_corredor || !id_pista || !Number.isInteger(numero_volta) || numero_volta <= 0 || !Number.isFinite(tempo) || tempo <= 0) {
        return res.status(400).json({ erro: 'id_corredor, id_pista, numero_volta e tempo sao obrigatorios e devem ser validos.' });
    }

    try {
        const [corredorExists] = await db.query('SELECT id FROM corredores WHERE id = ?', [id_corredor]);
        if (corredorExists.length === 0) {
            return res.status(404).json({ erro: 'Corredor nao encontrado.' });
        }

        const [pistaExists] = await db.query('SELECT id FROM pistas WHERE id = ?', [id_pista]);
        if (pistaExists.length === 0) {
            return res.status(404).json({ erro: 'Pista nao encontrada.' });
        }

        const [result] = await db.query(
            'INSERT INTO voltas (corredor_id, pista_id, numero_volta, tempo) VALUES (?, ?, ?, ?)',
            [id_corredor, id_pista, numero_volta, tempo]
        );

        const [created] = await db.query(`
            SELECT v.id, v.corredor_id AS id_corredor, v.pista_id AS id_pista, v.numero_volta, v.tempo, v.created_at AS data,
                   c.nome AS corredor_nome, c.turma, c.equipe,
                   p.nome AS pista_nome, p.localizacao AS pista_localizacao
            FROM voltas v
            LEFT JOIN corredores c ON v.corredor_id = c.id
            LEFT JOIN pistas p ON v.pista_id = p.id
            WHERE v.id = ?
        `, [result.insertId]);

        res.status(201).json(created[0] || {
            id: result.insertId,
            id_corredor,
            id_pista,
            numero_volta,
            tempo,
            data: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao criar volta:', error.message);
        res.status(500).json({ erro: 'Erro ao criar volta.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [volta] = await db.query(
            'SELECT id, corredor_id AS id_corredor, pista_id AS id_pista, numero_volta, tempo, created_at AS data FROM voltas WHERE id = ?',
            [id]
        );
        if (volta.length === 0) {
            return res.status(404).json({ erro: 'Volta nao encontrada.' });
        }
        res.json(volta[0]);
    } catch (error) {
        console.error('Erro ao buscar volta:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar volta.' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM voltas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Volta nao encontrada.' });
        }
        res.json({ mensagem: 'Volta deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar volta:', error.message);
        res.status(500).json({ erro: 'Erro ao deletar volta.' });
    }
});

// Média por piloto (corredor)
router.get('/media/pilotos', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.id AS id_corredor,
                c.nome AS corredor_nome,
                c.equipe,
                SUM(v.tempo) AS tempo_total,
                COUNT(*) AS voltas
            FROM voltas v
            JOIN corredores c ON v.corredor_id = c.id
            GROUP BY c.id, c.nome, c.equipe
            ORDER BY (SUM(v.tempo) / COUNT(*)) ASC
        `);

        // Normaliza tipos numéricos e calcula média explicitamente como soma/contagem
        const result = rows.map(r => ({
            id_corredor: r.id_corredor,
            corredor_nome: r.corredor_nome,
            equipe: r.equipe,
            tempo_total: r.tempo_total !== null ? Number(r.tempo_total) : null,
            voltas: Number(r.voltas || 0),
            tempo_medio: r.tempo_total !== null && r.voltas ? Number(r.tempo_total) / Number(r.voltas) : null,
        }));

        res.json(result);
    } catch (error) {
        console.error('Erro ao calcular media por piloto:', error.message);
        res.status(500).json({ erro: 'Erro ao calcular media por piloto.' });
    }
});

// Média por equipe
router.get('/media/equipes', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COALESCE(c.equipe, '') AS equipe,
                SUM(v.tempo) AS tempo_total,
                COUNT(*) AS voltas
            FROM voltas v
            JOIN corredores c ON v.corredor_id = c.id
            GROUP BY c.equipe
            ORDER BY (SUM(v.tempo) / COUNT(*)) ASC
        `);

        const result = rows.map(r => ({
            equipe: r.equipe,
            tempo_total: r.tempo_total !== null ? Number(r.tempo_total) : null,
            voltas: Number(r.voltas || 0),
            tempo_medio: r.tempo_total !== null && r.voltas ? Number(r.tempo_total) / Number(r.voltas) : null,
        }));

        res.json(result);
    } catch (error) {
        console.error('Erro ao calcular media por equipe:', error.message);
        res.status(500).json({ erro: 'Erro ao calcular media por equipe.' });
    }
});

module.exports = router;
