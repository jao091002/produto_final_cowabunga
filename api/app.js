const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '12kb' }));

const apiLimiter = rateLimit({
    windowMs: 0 * 60 * 1000,
    max: 10000,
    message: { erro: 'Muitas requisições deste IP, tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(['/users', '/corredores', '/voltas', '/pistas'], apiLimiter);

const publicRoot = path.join(__dirname, '..');
app.use('/Front', express.static(path.join(publicRoot, 'Front')));
app.use(express.static(path.join(publicRoot, 'Front')));
app.use('/fotos', express.static(path.join(publicRoot, 'fotos')));
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(publicRoot, 'index.html'));
});

const userRoutes = require('./routes/user');
const corredoresRoutes = require('./routes/corredores');
const voltasRoutes = require('./routes/voltas');
const pistasRoutes = require('./routes/pistas');

app.use('/users', userRoutes);
app.use('/corredores', corredoresRoutes);
app.use('/voltas', voltasRoutes);
app.use('/pistas', pistasRoutes);

app.use((req, res) => {
    if (req.path.startsWith('/users') || req.path.startsWith('/corredores') || req.path.startsWith('/voltas') || req.path.startsWith('/pistas')) {
        return res.status(404).json({ erro: 'Endpoint não encontrado.' });
    }
    res.status(404).json({ erro: 'Recurso não encontrado.' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ erro: err.message || 'Erro interno do servidor.' });
});

module.exports = app;
