const Room = require("../models/Room");
const { generatePin } = require("../lib/utils");
const { MESSAGES } = require("../config/constants");

// Mapa de salas activas: { pin: Room }
const activeRooms = new Map();

// Mapa de usuarios conectados: { socketId: pin }
const connectedUsers = new Map();

//mapa de ips conectadas: { ip: pin }
const roomIpMap = new Map();

module.exports = {
    activeRooms, // Exportamos los maps directamente para acceso en chatSocket
    connectedUsers,

    createRoom(maxUsers) {
        const pin = generatePin();
        const room = new Room(pin, maxUsers);
        activeRooms.set(pin, room);
        roomIpMap.set(pin, new Set()); // Inicializamos un Set para IPs
        return pin;
    },

    joinRoom(pin, user, clientIp) {
        const room = activeRooms.get(pin);
        if (!room) throw new Error(MESSAGES.ERROR.ROOM_NOT_FOUND);

        if (!user.name?.trim()) throw new Error("Nombre de usuario inválido");

        // NUEVO: Validación de IP
        const ipsInRoom = roomIpMap.get(pin);
        if (ipsInRoom && ipsInRoom.has(clientIp)) {
            throw new Error(MESSAGES.ERROR.IP_ALREADY_IN_ROOM);
        }

        const userData = {
            id: user.id,
            name: user.name.trim(),
            ip: clientIp, // NUEVO: Guardar IP con el usuario
            joinedAt: Date.now()
        };

        room.addUser(userData); // addUser ahora espera el objeto completo
        connectedUsers.set(user.id, pin);
        ipsInRoom.add(clientIp); // NUEVO: Añadir IP al Set de la sala

        return { ...room }; // Devuelve una copia del estado de la sala
    },

    // Nuevo método para manejar desconexiones
    leaveRoom(socketId) {
        const pin = connectedUsers.get(socketId);
        if (!pin) return null;

        const room = activeRooms.get(pin);
        if (!room) return null;

        const userLeaving = room.getUser(socketId); // Obtener el usuario para su IP

        room.removeUser(socketId);
        connectedUsers.delete(socketId);

        // NUEVO: Limpiar IP del roomIpMap
        if (userLeaving && userLeaving.ip) {
            const ipsInRoom = roomIpMap.get(pin);
            if (ipsInRoom) {
                ipsInRoom.delete(userLeaving.ip);
            }
        }
        
        // Opcional: Limpiar la sala si está vacía
        if (room.users.length === 0) {
            activeRooms.delete(pin);
            roomIpMap.delete(pin); // Limpiar también el Set de IPs
            console.log(`Sala ${pin} eliminada por estar vacía.`);
        }


        return {
            success: true,
            room: { // Asegúrate de devolver el estado actualizado de la sala
                pin: room.pin,
                maxUsers: room.maxUsers,
                users: room.users,
                messages: room.messages
            },
            userId: socketId // Para que el cliente que se fue no procese su propia salida como "otro usuario"
        };
    }
};