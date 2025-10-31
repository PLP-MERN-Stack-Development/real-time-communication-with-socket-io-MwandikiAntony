const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Store online users
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join chat
  socket.on("join", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("onlineUsers", Object.values(onlineUsers));
    io.emit("notification", `${username} joined the chat`);
  });

  // Global messages
  socket.on("sendMessage", (msg) => {
    const message = { ...msg, time: new Date().toLocaleTimeString() };
    io.emit("receiveMessage", message);
  });

  // Typing indicator
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  // Private messages
  socket.on("privateMessage", ({ toSocketId, message }) => {
    const msg = { ...message, time: new Date().toLocaleTimeString() };
    socket.to(toSocketId).emit("receivePrivateMessage", msg);
  });

  // Message reactions
  socket.on("reaction", ({ messageId, reaction }) => {
    io.emit("reactionUpdated", { messageId, reaction });
  });

  // File/image sharing
  socket.on("sendFile", ({ user, fileName, fileData }) => {
    io.emit("receiveFile", { user, fileName, fileData, time: new Date().toLocaleTimeString() });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const username = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    io.emit("onlineUsers", Object.values(onlineUsers));
    if (username) io.emit("notification", `${username} left the chat`);
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
