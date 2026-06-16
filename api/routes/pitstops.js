const express = require('express');
const db = require('../db');
const { normalizeText } = require('../utils/helpers');

const router = express.Router();

function normalizePitstopPayload(body) {
    return {
        corredor_id: Number(body.corredor_id ?? body.id_corredor),
        pista_id: Number(body.pista_id ?? body.id_pista),
        problema: normalizeText(body.problema),
        causa: normalizeText(body.causa),
        resolvido: body.resolvido === true || body.resolvido === 'true' || Number(body.resolvido) === 1 ? 1 : 0,
        observacao: normalizeText(body.observacao),
    };
}

router.get('/', async (req, res) => {
    try {
        const [pitstops] = await db.query(`
            SELECT ps.id, ps.corredor_id AS id_corredor, ps.pista_id AS id_pista,
                   ps.problema, ps.causa, ps.resolvido, ps.observacao,
                   ps.created_at AS data, ps.updated_at,
                   c.nome AS corredor_nome, c.turma, c.equipe,
                   p.nome AS pista_nome, p.localizacao AS pista_localizacao
            FROM pitstops ps
            LEFT JOIN corredores c ON ps.corredor_id = c.id
            LEFT JOIN pistas p ON ps.pista_id = p.id
            ORDER BY ps.created_at DESC
        `);
        res.json(pitstops);
    } catch (error) {
        console.error('Erro ao buscar pit stops:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar pit stops.' });
    }
});

router.post('/', async (req, res) => {
    const { corredor_id, pista_id, problema, causa, resolvido, observacao } = normalizePitstopPayload(req.body);

    if (!corredor_id || !pista_id || !problema || !causa) {
        return res.status(400).json({ erro: 'Corredor, pista, problema e causa sao obrigatorios.' });
    }

    try {
        const [corredorExists] = await db.query('SELECT id FROM corredores WHERE id = ?', [corredor_id]);
        if (corredorExists.length === 0) {
            return res.status(404).json({ erro: 'Corredor nao encontrado.' });
        }

        const [pistaExists] = await db.query('SELECT id FROM pistas WHERE id = ?', [pista_id]);
        if (pistaExists.length === 0) {
            return res.status(404).json({ erro: 'Pista nao encontrada.' });
        }

        const [result] = await db.query(
            'INSERT INTO pitstops (corredor_id, pista_id, problema, causa, resolvido, observacao) VALUES (?, ?, ?, ?, ?, ?)',
            [corredor_id, pista_id, problema, causa, resolvido, observacao || null]
        );

        res.status(201).json({ id: result.insertId, corredor_id, pista_id, problema, causa, resolvido, observacao: observacao || null });
    } catch (error) {
        console.error('Erro ao criar pit stop:', error.message);
        res.status(500).json({ erro: 'Erro ao criar pit stop.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { corredor_id, pista_id, problema, causa, resolvido, observacao } = normalizePitstopPayload(req.body);

    if (!corredor_id || !pista_id || !problema || !causa) {
        return res.status(400).json({ erro: 'Corredor, pista, problema e causa sao obrigatorios.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE pitstops
             SET corredor_id = ?, pista_id = ?, problema = ?, causa = ?, resolvido = ?, observacao = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [corredor_id, pista_id, problema, causa, resolvido, observacao || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Pit stop nao encontrado.' });
        }

        res.json({ mensagem: 'Pit stop atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar pit stop:', error.message);
        res.status(500).json({ erro: 'Erro ao atualizar pit stop.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM pitstops WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Pit stop nao encontrado.' });
        }
        res.json({ mensagem: 'Pit stop removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar pit stop:', error.message);
        res.status(500).json({ erro: 'Erro ao deletar pit stop.' });
    }
});

module.exports = router;
