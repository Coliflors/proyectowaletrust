const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

// Rutas directas
app.get('/',         (_, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/panel',    (_, res) => res.sendFile(path.join(__dirname, 'panel.html')));
app.get('/wallet-b', (_, res) => res.sendFile(path.join(__dirname, 'wallet-b.html')));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
