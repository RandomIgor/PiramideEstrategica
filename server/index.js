const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {}; // { roomId: { mode, players: [{id, name, ready, pyramid, currentChoice, score}], currentLevel, tiePot, logs: [], isPrivate } }

const getAvailableRooms = () => {
  return Object.keys(rooms)
    .filter(id => rooms[id].players.length === 1 && !rooms[id].isPrivate)
    .map(id => ({
      roomId: id,
      host: rooms[id].players[0].name,
      mode: rooms[id].mode.name,
      isSpecial: rooms[id].mode.isSpecialRules
    }));
};

const broadcastRooms = () => {
  io.emit('available_rooms', getAvailableRooms());
};

const TOKENS = {
  SOL: { value: 5, name: 'Sol' },
  FARAON: { value: 4, name: 'Faraón' },
  DEVOTO: { value: 3, name: 'Devoto' },
  SIERVO: { value: 2, name: 'Siervo' },
  ESCARABAJO: { value: 1, name: 'Escarabajo' },
  GATO: { value: 6, name: 'Gato Místico' }
};

const resolveBattle = (playerToken, botToken, level, mode) => {
  if (playerToken === botToken) return 'TIE';

  let weakestToken = null;
  let minVal = Infinity;
  if (mode && mode.inventory) {
    for (const type in mode.inventory) {
      if (mode.inventory[type] > 0 && TOKENS[type].value < minVal) {
        minVal = TOKENS[type].value;
        weakestToken = type;
      }
    }
  } else {
    weakestToken = 'ESCARABAJO';
  }

  if (weakestToken) {
    if (playerToken === weakestToken && botToken === 'SOL') return 'WIN';
    if (botToken === weakestToken && playerToken === 'SOL') return 'LOSS';
  }

  const gatoLosesToValue = 6 - level + 1;
  if (playerToken === 'GATO') {
    if (level === 1) return 'LOSS';
    if (TOKENS[botToken].value === gatoLosesToValue) return 'LOSS';
    return 'WIN';
  }
  if (botToken === 'GATO') {
    if (level === 1) return 'WIN';
    if (TOKENS[playerToken].value === gatoLosesToValue) return 'WIN';
    return 'LOSS';
  }
  return TOKENS[playerToken].value > TOKENS[botToken].value ? 'WIN' : 'LOSS';
};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('create_room', ({ mode, username, isPrivate }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
      mode: mode,
      isPrivate: isPrivate || false,
      players: [{ id: socket.id, name: username || 'Jugador 1', score: 0, ready: false, pyramid: null, currentChoice: null, usedCols: [] }],
      currentLevel: 1,
      tiePot: 0,
      logs: []
    };
    socket.join(roomId);
    socket.emit('room_created', roomId);
    io.to(roomId).emit('room_state', rooms[roomId]);
    broadcastRooms();
  });

  socket.on('request_rooms', () => {
    socket.emit('available_rooms', getAvailableRooms());
  });

  socket.on('join_room', ({ roomId, username }) => {
    const room = rooms[roomId];
    if (room && room.players.length === 1) {
      room.players.push({ id: socket.id, name: username || 'Jugador 2', score: 0, ready: false, pyramid: null, currentChoice: null, usedCols: [] });
      socket.join(roomId);
      io.to(roomId).emit('room_state', room);
      io.to(roomId).emit('start_construction');
      broadcastRooms();
    } else {
      socket.emit('error_msg', 'Sala no encontrada o llena');
    }
  });

  socket.on('submit_pyramid', ({ roomId, pyramid }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      player.pyramid = pyramid;
    }
    io.to(roomId).emit('room_state', room);
    
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      io.to(roomId).emit('battle_starts');
    }
  });

  socket.on('submit_battle_choice', ({ roomId, choiceCol }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.currentChoice = choiceCol;
    }

    if (room.players.every(p => p.currentChoice !== null)) {
      processBattleRound(roomId, io);
    } else {
      io.to(roomId).emit('room_state', room);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    for (let roomId in rooms) {
      const room = rooms[roomId];
      if (room.players.find(p => p.id === socket.id)) {
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('player_disconnected');
          delete rooms[roomId];
        }
        broadcastRooms();
      }
    }
  });
});

function processBattleRound(roomId, io) {
  const room = rooms[roomId];
  const p1 = room.players[0];
  const p2 = room.players[1];
  const level = room.currentLevel;
  const row = level - 1;

  const p1Token = p1.pyramid[`${row}-${p1.currentChoice}`];
  const p2Token = p2.pyramid[`${row}-${p2.currentChoice}`];

  const res1 = resolveBattle(p1Token, p2Token, level, room.mode);
  const isSpecialTie = room.mode.rules?.tiePot;
  const isLastBattle = p1.usedCols.length === level - 1;
  let basePoints = room.mode.rules?.skirmishx2 && isLastBattle ? 2 : 1;
  
  if (room.mode.rules?.extendedRules) {
    if (p1Token === 'ESPEJISMO' && res1 === 'WIN') basePoints += 1;
    if (p2Token === 'ESPEJISMO' && res1 === 'LOSS') basePoints += 1;
  }

  let points = basePoints + (isSpecialTie && res1 !== 'TIE' ? room.tiePot : 0);
  
  if (res1 === 'WIN') {
    p1.score += points;
    room.tiePot = 0;
    room.logs.push(`Nivel ${level}: ${p1.name} (${TOKENS[p1Token].name}) vence a ${p2.name} (${TOKENS[p2Token].name})`);
  } else if (res1 === 'LOSS') {
    p2.score += points;
    room.tiePot = 0;
    room.logs.push(`Nivel ${level}: ${p2.name} (${TOKENS[p2Token].name}) vence a ${p1.name} (${TOKENS[p1Token].name})`);
  } else {
    if (isSpecialTie) room.tiePot += basePoints;
    room.logs.push(`Nivel ${level}: Empate entre ${TOKENS[p1Token].name}s. ${isSpecialTie ? `Bote: ${room.tiePot}` : ''}`);
  }

  // Marcar fichas como usadas
  p1.usedCols.push(p1.currentChoice);
  p2.usedCols.push(p2.currentChoice);

  p1.currentChoice = null;
  p2.currentChoice = null;

  // Si ya han peleado todas las fichas de este nivel, avanzar de nivel
  if (p1.usedCols.length === level) {
    p1.usedCols = [];
    p2.usedCols = [];
    room.currentLevel += 1;
  }

  io.to(roomId).emit('round_result', {
    room,
    lastBattle: {
      p1Id: p1.id,
      p1Token,
      p2Token,
      result: res1, // 'WIN' means p1 won
      points,
      tiePot: room.tiePot
    }
  });
}

// Sirve los archivos estáticos generados por Vite
app.use(express.static(path.join(__dirname, '../dist')));

// Redirige cualquier otra ruta a index.html (React Router)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
