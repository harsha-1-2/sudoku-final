const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL || ""   // <-- add AFTER frontend deploy
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

connectDB();
app.use(express.json());

// ================= ROUTES =================
app.use("/api/leaderboard", require("./routes/leaderboardroutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/sudoku", require("./routes/sudokuRoutes"));

// ================= SOCKET HANDLER =================
require("./sockets/gameSocket")(io);

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
