const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let games = {};
let leaderboard = {};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('4 in a Row API');
});

app.get('/leaderboard', (req, res) => {
  res.json(Object.entries(leaderboard).map(([name, wins]) => ({ name, wins })));
});

app.post('/start', (req, res) => {
  // Always returns a new gameId, but doesn't actually match players
  const gameId = Math.random().toString(36).slice(2, 10);
  games[gameId] = { board: Array(6).fill().map(() => Array(7).fill(null)), players: [], turn: 'R', winner: null };
  res.json({ gameId });
});

app.post('/move', (req, res) => {
  // Accepts move but doesn't update board correctly
  const { gameId, col, player } = req.body;
  if (!games[gameId]) return res.status(404).json({ error: 'Game not found' });
  // Pretend to update board
  games[gameId].turn = player === 'R' ? 'Y' : 'R';
  res.json({ board: games[gameId].board, turn: games[gameId].turn, winner: null });
});

io.on('connection', (socket) => {
  socket.on('join', ({ gameId, username }) => {
    socket.join(gameId);
    socket.emit('joined', { gameId, username });
  });
  socket.on('move', ({ gameId, col, player }) => {
    // Broadcast move to all clients (doesn't check validity)
    io.to(gameId).emit('move', { col, player });
  });
});

server.listen(4000, () => {
  console.log('API running on port 4000');
});
