import { io, type Socket } from "socket.io-client";
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "../types/chat";

// Configuración de la conexión WebSocket
const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL; // URL del servidor WebSocket

/**
 * Socket.io client instance con tipado fuerte.
 * - Auto-conexión desactivada para control manual.
 * - Reconexión inteligente con timeout.
 */
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    SOCKET_URL,
    {
        autoConnect: false, // Conexión manual al unirse a una sala
        reconnectionAttempts: 3, // Máximo de reintentos
        reconnectionDelay: 1000, // 1 segundo entre intentos
        timeout: 5000, // Timeout de conexión
    }
);

/**
 * Función para inicializar la conexión con autenticación opcional.
 * @param auth - Datos de autenticación (ej: token JWT)
 */
const connectSocket = (auth?: { token: string }) => {
    if (auth) socket.auth = auth;
    socket.connect();
};

/**
 * Desconecta el socket y limpia listeners.
 * Útil al cambiar de sala o cerrar sesión.
 */
const disconnectSocket = () => {
    socket.removeAllListeners();
    socket.disconnect();
};

// Debug: Log eventos de conexión (opcional)
socket
    .on("connect", () => console.debug("Socket conectado:", socket.id))
    .on("disconnect", (reason) => console.debug("Socket desconectado:", reason))
    .on("error", (error) => console.error("Socket error:", error));

export { socket, connectSocket, disconnectSocket };