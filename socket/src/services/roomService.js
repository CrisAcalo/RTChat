const Room = require("../models/Room");
const { generatePin } = require("../lib/utils");

// Mapa de salas activas: { pin: Room }
const activeRooms = new Map();

// Mapa de usuarios conectados: { socketId: pin }
const connectedUsers = new Map();

module.exports = {
    activeRooms, // Exportamos los maps directamente para acceso en chatSocket
    connectedUsers,

    createRoom(maxUsers) {
        const pin = generatePin();
        const room = new Room(pin, maxUsers);
        activeRooms.set(pin, room);
        return pin;
    },

    joinRoom(pin, user) {
        const room = activeRooms.get(pin);
        if (!room) throw new Error("Sala no existe");

        if (!user.name?.trim()) throw new Error("Nombre de usuario inválido");

        const userData = {
            id: user.id,
            name: user.name.trim(),
            joinedAt: Date.now()
        };

        room.users.push(userData);
        connectedUsers.set(user.id, pin);

        return {
            ...room
            // No necesitas conversión
        };
    },

    // Nuevo método para manejar desconexiones
    leaveRoom(socketId) {
        const pin = connectedUsers.get(socketId);
        if (!pin) return null;

        const room = activeRooms.get(pin);
        if (!room) return null;

        // Validar y convertir a array si es necesario
        if (!Array.isArray(room.users)) {
            room.users = Object.values(room.users); // Si era Map/Object
        }

        // Eliminar usuario
        room.users = room.users.filter(user => user.id !== socketId);
        connectedUsers.delete(socketId);

        return {
            success: true,
            room: {
                pin: room.pin,
                maxUsers: room.maxUsers,
                users: room.users, // Ya es array
                messages: room.messages
            }
        };
    }
};