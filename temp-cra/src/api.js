// Simple API and WebSocket client for Connect Four
import io from 'socket.io-client';

const API_URL = 'http://localhost:4000';
let socket;

export function startGame() {
  return fetch(`${API_URL}/start`, { method: 'POST' })
    .then(res => res.json());
}

export function getLeaderboard() {
  return fetch(`${API_URL}/leaderboard`).then(res => res.json());
}

export function makeMove(gameId, col, player) {
  return fetch(`${API_URL}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, col, player })
  }).then(res => res.json());
}

export function connectSocket() {
  if (!socket) {
    socket = io(API_URL);
  }
  return socket;
}
