const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const chatSocket = require("./sockets/chatSocket");
//dotenv
const dotenv = require("dotenv");
dotenv.config();

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
const ENTORNO = process.env.ENTORNO || "Dev";
const HOST = "0.0.0.0";

if (ENTORNO === "Dev") {
    server.listen(PORT, HOST, () => {
        const url = `Servidor corriendo en http://localhost:${PORT} (Desarrollo)`;
        console.log(url);
    });
} else if (ENTORNO === "Prod") {
    server.listen(PORT, () => {
        const url = `Servidor corriendo en el puerto ${PORT} (Producción)`;
        console.log(url);
    });
}
