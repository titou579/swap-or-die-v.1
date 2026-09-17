const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir tous les fichiers statiques (css, js, assets, html)
app.use(express.static(path.join(__dirname)));

// Route principale pour l'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour le jeu
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'game.html'));
});

// Route pour l'administration
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Gestion des connexions WebSockets (Socket.io)
io.on('connection', (socket) => {
  console.log("Un joueur s'est connecté :", socket.id);

  socket.on('disconnect', () => {
    console.log("Joueur déconnecté :", socket.id);
  });
});

// Lancement du serveur sur le port 3000 (ou celui attribué par l'hébergeur)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
