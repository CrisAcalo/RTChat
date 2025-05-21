const {
    createRoom,
    joinRoom,
    activeRooms,
    connectedUsers,
    leaveRoom: serviceLeaveRoom // Renombrar para evitar colisión de nombres
} = require("../services/roomService");
const { MESSAGES } = require("../config/constants");


function getClientIp(socket) {
    // Prioriza X-Forwarded-For si estás detrás de un proxy
    const xForwardedFor = socket.handshake.headers['x-forwarded-for'];
    if (xForwardedFor) {
        // Puede ser una lista de IPs, toma la primera
        return Array.isArray(xForwardedFor) ? xForwardedFor[0].split(',')[0].trim() : xForwardedFor.split(',')[0].trim();
    }
    return socket.handshake.address; // IP directa o la del último proxy
}

module.exports = (io, socket) => {
    const clientIp = getClientIp(socket);
    console.log(`Cliente conectado: ${socket.id} desde IP: ${clientIp}`);

    // Crear sala (no cambia mucho aquí, la IP se maneja al unirse)
    socket.on("create_room", (maxUsers, callback) => { // Cambiado: create_room ahora recibe un objeto
        try {
            const pin = createRoom(maxUsers); // maxUsers viene del objeto
            callback({ success: true, pin });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Enviar mensaje (sin cambios significativos por la IP, pero usando el nombre de `room.users`)
    socket.on("send_message", ({ message, pin }, callback) => {
        try {
            const currentPin = connectedUsers.get(socket.id);
            if (!pin || pin !== currentPin) { // Asegurar que el usuario está en la sala que dice estar
                throw new Error("No estás en una sala válida o el PIN no coincide");
            }

            const room = activeRooms.get(pin);
            if (!room) {
                throw new Error(MESSAGES.ERROR.ROOM_NOT_FOUND);
            }

            const user = room.getUser(socket.id); // Usar el método del modelo Room
            const senderName = user ? user.name : "Anónimo";

            const newMessage = {
                sender: socket.id,
                senderName,
                text: message,
                timestamp: Date.now()
            };

            room.addMessage(newMessage);
            io.to(pin).emit("new_message", newMessage);
            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Unirse a sala
    socket.on('join_room', ({ pin, username }, callback) => {
        try {
            // Verificar si el socket ya está en otra sala
            if (connectedUsers.has(socket.id)) {
                // Podrías permitir cambiar de sala, pero por ahora es restrictivo
                return callback({ success: false, error: MESSAGES.ERROR.USER_ALREADY_IN_ROOM });
            }

            const user = { id: socket.id, name: username };
            const roomData = joinRoom(pin, user, clientIp); // Pasar clientIp
            socket.join(pin);

            // Notificar a los demás usuarios en la sala
            // Enviar el objeto usuario completo para que los clientes tengan el nombre
            const userForBroadcast = roomData.users.find(u => u.id === socket.id);
            if (userForBroadcast) {
                socket.to(pin).emit('user_joined', { name: userForBroadcast.name, id: userForBroadcast.id });
            }


            // Enviar estado completo al nuevo usuario
            callback({ success: true, room: roomData });

            // Emitir room_update a todos los usuarios de la sala
            io.to(pin).emit('room_update', roomData);

        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Salir de la sala
    socket.on('leave_room', (callback) => {
        try {
            const result = serviceLeaveRoom(socket.id);
            if (!result || !result.success) {
                return callback({ success: false, error: "Error al salir de la sala o no estabas en una." });
            }
            
            const pin = connectedUsers.get(socket.id); // Obtener pin antes de borrarlo

            // Notificar a los demás
            io.to(result.room.pin).emit('user_left', { userId: socket.id }); // No enviar toda la sala, solo el ID
            
            // Emitir room_update a todos los usuarios de la sala
            io.to(result.room.pin).emit('room_update', result.room);

            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id} desde IP: ${clientIp}`);
        const result = serviceLeaveRoom(socket.id); // Reutilizar la lógica de leaveRoom
        if (result && result.success && result.room && result.room.pin) {
            // Notificar a los demás
            io.to(result.room.pin).emit('user_left', { userId: socket.id });
             // Emitir room_update a todos los usuarios de la sala
            io.to(result.room.pin).emit('room_update', result.room);
        }
    });
};