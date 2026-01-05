
import React, { useState, useEffect } from 'react';
import { startGame, getLeaderboard, makeMove, connectSocket } from './api';

function App() {
  const [username, setUsername] = useState("");
  const [board, setBoard] = useState(
    Array(6)
      .fill(null)
      .map(() => Array(7).fill(null))
  );
  const [gameId, setGameId] = useState(null);

  const [currentPlayer, setCurrentPlayer] = useState("R"); // R = player, Y = bot
  const [message, setMessage] = useState("");
  const [isBotGame, setIsBotGame] = useState(true); // Always vs bot for now

  // Check for win
  function checkWin(bd, player) {
    // Horizontal, vertical, diagonal checks
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          c + 3 < 7 &&
          bd[r][c] === player &&
          bd[r][c + 1] === player &&
          bd[r][c + 2] === player &&
          bd[r][c + 3] === player
        )
          return true;
        if (
          r + 3 < 6 &&
          bd[r][c] === player &&
          bd[r + 1][c] === player &&
          bd[r + 2][c] === player &&
          bd[r + 3][c] === player
        )
          return true;
        if (
          r + 3 < 6 &&
          c + 3 < 7 &&
          bd[r][c] === player &&
          bd[r + 1][c + 1] === player &&
          bd[r + 2][c + 2] === player &&
          bd[r + 3][c + 3] === player
        )
          return true;
        if (
          r - 3 >= 0 &&
          c + 3 < 7 &&
          bd[r][c] === player &&
          bd[r - 1][c + 1] === player &&
          bd[r - 2][c + 2] === player &&
          bd[r - 3][c + 3] === player
        )
          return true;
      }
    }
    return false;
  }

  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    getLeaderboard().then(setLeaderboard);
    // Connect to WebSocket
    const socket = connectSocket();
    socket.on('move', ({ col, player }) => {
      // Just refetch board from backend (not real-time accurate)
      if (gameId) {
        makeMove(gameId, col, player).then(res => {
          setBoard(res.board);
        });
      }
    });
    return () => { socket.disconnect(); };
  }, [gameId]);

  function dropDisc(colIdx) {
    if (!gameId) return;
    makeMove(gameId, colIdx, currentPlayer).then(res => {
      setBoard(res.board);
      setMessage(res.winner ? (res.winner === currentPlayer ? 'You win!' : 'You lose!') : '');
      setCurrentPlayer(res.turn);
    });
    // Emit move to WebSocket
    const socket = connectSocket();
    socket.emit('move', { gameId, col: colIdx, player: currentPlayer });
  }

  function botMove(currentBoard) {
    // Find all columns that are not full
    const validCols = [];
    for (let col = 0; col < 7; col++) {
      if (currentBoard[0][col] === null) validCols.push(col);
    }
    if (validCols.length === 0) {
      setMessage("Draw!");
      return;
    }
    const colIdx = validCols[Math.floor(Math.random() * validCols.length)];
    for (let row = 5; row >= 0; row--) {
      if (!currentBoard[row][colIdx]) {
        const newBoard = currentBoard.map((r) => [...r]);
        newBoard[row][colIdx] = "Y";
        setBoard(newBoard);
        if (checkWin(newBoard, "Y")) {
          setMessage("Bot wins!");
          updateLeaderboard(username, false);
        } else if (newBoard.every((r) => r.every((cell) => cell))) {
          setMessage("Draw!");
        } else {
          setCurrentPlayer("R");
        }
        return;
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#23272f', color: '#fff' }}>
      <h1 style={{ marginBottom: 20 }}>4 in a Row</h1>
      <input
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          marginBottom: 20,
          padding: 8,
          fontSize: 16,
          borderRadius: 4,
          border: '1px solid #444',
          background: '#23272f',
          color: '#fff',
          outline: 'none',
        }}
      />
      <div style={{ marginTop: 10, marginBottom: 10, background: '#343942', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px #1118' }}>
        {board.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: "flex", justifyContent: 'center' }}>
            {row.map((cell, colIdx) => (
              <div
                key={colIdx}
                onClick={() => dropDisc(colIdx)}
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid #444",
                  textAlign: "center",
                  lineHeight: "40px",
                  background: cell === "R" ? "#e53935" : cell === "Y" ? "#ffd600" : "#23272f",
                  color: cell ? '#23272f' : '#fff',
                  cursor: "pointer",
                  margin: 1,
                  borderRadius: 6,
                  fontWeight: 'bold',
                  fontSize: 24
                }}
              >
                {cell ? "●" : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, color: "#ff5252", fontWeight: 'bold' }}>{message}</div>
      <div style={{ marginTop: 10, marginBottom: 20 }}>
        Current Player: {message ? "-" : currentPlayer === "R" ? <span style={{color:'#ffd600'}}>Red</span> : <span style={{color:'#e53935'}}>Yellow</span>}
      </div>
      <div style={{ marginTop: 10, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{color:'#fff'}}>Leaderboard</h2>
        <table border="1" cellPadding="4" style={{ margin: '0 auto', width: '100%', color:'#fff', borderColor:'#fff' }}>
          <thead>
            <tr style={{color:'#fff'}}><th>Player</th><th>Wins</th></tr>
          </thead>
          <tbody>
            {leaderboard
              .sort((a, b) => b.wins - a.wins)
              .map((entry) => (
                <tr key={entry.name} style={{color:'#fff'}}>
                  <td>{entry.name}</td>
                  <td>{entry.wins}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  // Start a new game on mount or when username changes
  useEffect(() => {
    if (username) {
      startGame().then(res => {
        setGameId(res.gameId);
        setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
        setMessage('');
        setCurrentPlayer('R');
      });
    }
  }, [username]);

}

export default App;
