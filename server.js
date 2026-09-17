const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Stockage des salons
const rooms = {};

io.on('connection', (socket) => {
    console.log(`[Connecté] Client : ${socket.id}`);

    // Créer ou rejoindre une room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        if (!roomCode || !playerName) {
            return socket.emit('errorMsg', 'Code de salon ou nom de joueur invalide.');
        }

        const cleanCode = roomCode.trim().toUpperCase();
        const cleanName = playerName.trim();

        if (!rooms[cleanCode]) {
            rooms[cleanCode] = {
                players: {}
            };
        }

        // Ajouter le joueur dans la room
        rooms[cleanCode].players[socket.id] = {
            id: socket.id,
            name: cleanName,
            x: (Math.random() - 0.5) * 10,
            y: 1,
            z: (Math.random() - 0.5) * 10,
            color: Math.floor(Math.random() * 16777215)
        };

        socket.join(cleanCode);
        socket.roomCode = cleanCode;

        console.log(`[Join] ${cleanName} (${socket.id}) a rejoint la room : ${cleanCode}`);

        // Confirmer au joueur qu'il a rejoint
        socket.emit('joinedSuccess', {
            roomCode: cleanCode,
            playerId: socket.id,
            players: rooms[cleanCode].players
        });

        // Prévenir les autres joueurs de la room
        socket.to(cleanCode).emit('playerJoined', rooms[cleanCode].players[socket.id]);
    });

    // Mise à jour de position
    socket.on('playerMove', (moveData) => {
        const roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode] && rooms[roomCode].players[socket.id]) {
            const p = rooms[roomCode].players[socket.id];
            p.x = moveData.x;
            p.y = moveData.y;
            p.z = moveData.z;

            // Transmettre la nouvelle position aux autres joueurs
            socket.to(roomCode).emit('playerMoved', {
                id: socket.id,
                x: p.x,
                y: p.y,
                z: p.z
            });
        }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`[Déconnecté] Client : ${socket.id}`);
        const roomCode = socket.roomCode;
        if (roomCode && rooms[roomCode]) {
            delete rooms[roomCode].players[socket.id];

            // Informer les autres
            io.to(roomCode).emit('playerLeft', socket.id);

            // Nettoyer la room si elle est vide
            if (Object.keys(rooms[roomCode].players).length === 0) {
                delete rooms[roomCode];
                console.log(`[Room Supprimée] Room vide : ${roomCode}`);
            }
        }
    });
});

// Port dynamique pour Render/Heroku/etc. avec fallback sur 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
