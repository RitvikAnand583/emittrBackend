# 4 in a Row (Connect Four)

A simple real-time multiplayer Connect Four game with a basic frontend and a Node.js backend.


## Project Structure
```
frontend/   # React app (see temp-cra for working version)
backend/    # Node.js backend (Express + Socket.io)
```

## Getting Started

### 1. Backend
```
cd backend
npm install
npm start
```
- The backend runs on http://localhost:4000

### 2. Frontend
```
cd temp-cra
npm install
npm start
```
- The frontend runs on http://localhost:3000

## API Endpoints
- `GET /leaderboard` — Get leaderboard data
- `POST /start` — Start a new game (returns gameId)
- `POST /move` — Make a move (requires gameId, col, player)

## WebSocket Events
- `join` — Join a game room
- `move` — Send a move to the room

---
