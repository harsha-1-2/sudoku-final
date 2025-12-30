const Room = require("../models/Room");
const User = require("../models/User");
const { generateSudoku } = require("../services/sudokuGenerator");

// Global variables
let waitingPlayer = null; 
const socketRoomMap = new Map(); 

module.exports = (io) => {
  io.on("connection", (socket) => {

    // =================================================================
    // 🏆 CORE STATS LOGIC (This updates the Leaderboard)
    // =================================================================
    async function updateUserStats(winnerSocketId, room) {
      try {
        // 1. Get the Database User IDs using the Map we saved earlier
        const winnerUserId = room.userMap.get(winnerSocketId);
        
        // Find the loser's socket ID
        const loserSocketId = room.players.find(id => id !== winnerSocketId);
        const loserUserId = room.userMap.get(loserSocketId);

        console.log(`Updating Stats | Winner: ${winnerUserId} | Loser: ${loserUserId}`);

        // 2. Update Winner Leaderboard Stats
        if (winnerUserId) {
          await User.findByIdAndUpdate(winnerUserId, {
            $inc: { "stats.matchesPlayed": 1, "stats.wins": 1 },
            $push: { "stats.history": { result: "WIN", date: new Date() } }
          });
        }

        // 3. Update Loser Leaderboard Stats
        if (loserUserId) {
            await User.findByIdAndUpdate(loserUserId, {
            $inc: { "stats.matchesPlayed": 1 },
            $push: { "stats.history": { result: "LOSS", date: new Date() } }
          });
        }
      } catch (err) {
        console.error("Leaderboard Update Failed:", err);
      }
    }

    // =================================================================
    // ⚔️ PUBLIC MATCHMAKING (Now saves User IDs for Leaderboard)
    // =================================================================
    socket.on("find_match", async (data) => {
      // 1. Capture the User ID from the frontend
      const userId = (data && data.userId) ? data.userId : null;
      
      // Save it to the socket session so we don't lose it while they wait
      socket.userId = userId; 

      if (waitingPlayer) {
        // --- MATCH FOUND ---
        const player1 = waitingPlayer; // The one who was waiting
        const player2 = socket;        // The one who just joined

        if (player1.id === player2.id) return;

        // 2. Generate Room & Puzzle
        const roomId = "PUB_" + Math.random().toString(36).substring(2, 7).toUpperCase();
        const { puzzle, solution } = generateSudoku();

        try {
          // 3. Create Room AND Link Users to Database
          await Room.create({
            roomId,
            board: puzzle,
            solution: solution,
            players: [player1.id, player2.id],
            winner: null,
            // 👇 THIS IS THE KEY: Saving the Database IDs here so we can update Leaderboard later
            userMap: {
                [player1.id]: player1.userId,
                [player2.id]: player2.userId
            }
          });

          // Track for disconnects
          socketRoomMap.set(player1.id, roomId);
          socketRoomMap.set(player2.id, roomId);

          // Start Game
          io.to(player1.id).emit("match_found", { roomId });
          io.to(player2.id).emit("match_found", { roomId });

          waitingPlayer = null; 

        } catch (err) {
          console.error(err);
        }

      } else {
        // --- WAIT IN QUEUE ---
        waitingPlayer = socket;
        socket.emit("waiting_for_match");
      }
    });

    // =================================================================
    // 🔒 PRIVATE ROOM LOGIC
    // =================================================================
    socket.on("create_room", async () => {
      try {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const { puzzle, solution } = generateSudoku();

        await Room.create({
          roomId,
          board: puzzle,
          solution: solution,
          players: [socket.id]
        });

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);
        socket.emit("room_created", { roomId, board: puzzle });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("join_room", async (data) => {
      try {
        const roomId = (data && data.roomId) ? data.roomId : data;
        const userId = (data && data.userId) ? data.userId : null;

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });
        if (!room) return socket.emit("room_error", "Room not found");

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        if (!room.players.includes(socket.id)) {
          room.players.push(socket.id);
        }

        // 👇 Map the joining user for Private Games too
        if (userId) {
          room.userMap.set(socket.id, userId);
        }
        
        await room.save();

        socket.emit("joined_room", room.board);
        io.to(roomId).emit("player_joined", { count: room.players.length });
        
        if (room.players.length === 2) {
          io.to(roomId).emit("start_game");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // =================================================================
    // ✅ WIN LOGIC (Triggers Leaderboard Update)
    // =================================================================
    socket.on("submit_board", async ({ roomId, board }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room || room.winner) return;

        const isCorrect = JSON.stringify(board) === JSON.stringify(room.solution);

        if (isCorrect) {
          room.winner = socket.id;
          await room.save();
          
          io.to(roomId).emit("game_over", { winnerId: socket.id });

          // 🚀 UPDATE LEADERBOARD
          await updateUserStats(socket.id, room);

        } else {
          socket.emit("wrong_solution");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // =================================================================
    // 🚪 DISCONNECT & FORFEIT (Triggers Leaderboard Update)
    // =================================================================
    socket.on("disconnect", async () => {
      // Clean up queue
      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }

      // Handle Game Forfeit
      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        try {
          const room = await Room.findOne({ roomId });

          if (room && !room.winner && room.players.length === 2) {
            const otherPlayerId = room.players.find(id => id !== socket.id);
            
            if (otherPlayerId) {
              room.winner = otherPlayerId;
              await room.save();

              io.to(roomId).emit("game_over", { winnerId: otherPlayerId });

              // 🚀 UPDATE LEADERBOARD (Opponent wins by default)
              await updateUserStats(otherPlayerId, room);
            }
          }
          socketRoomMap.delete(socket.id);
        } catch (err) { console.error(err); }
      }
    });

  });
};