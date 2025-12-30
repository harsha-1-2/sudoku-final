const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

connectDB();
app.use(express.json());

// Routes
app.use("/api/leaderboard", require("./routes/leaderboardroutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/sudoku", require("./routes/sudokuRoutes"));

require("./sockets/gameSocket")(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
