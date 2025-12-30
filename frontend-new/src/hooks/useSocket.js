import { io } from "socket.io-client";

// 👇 USE THE ENV VARIABLE
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

export default socket;