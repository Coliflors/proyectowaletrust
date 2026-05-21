const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

// Rutas directas
app.get('/.well-known/walletconnect.txt', (_, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.type('text/plain').send('c1b85e8eff60dbd02663499756f49867');
});
app.get('/',         (_, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/panel',    (_, res) => res.sendFile(path.join(__dirname, 'panel.html')));
app.get('/wallet-b', (_, res) => res.sendFile(path.join(__dirname, 'wallet-b.html')));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
