const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const chatSocket = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: { origin: "*" } // Ajustar en producción
});

io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado:", socket.id);
    chatSocket(io, socket); // Registra todos los eventos
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => console.log(`Servidor corriendo en el enlace http://localhost:${PORT}`));