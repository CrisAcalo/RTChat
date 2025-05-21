const {
    createRoom,
    joinRoom,
    activeRooms,
    connectedUsers,
    leaveRoom
} = require("../services/roomService");

module.exports = (io, socket) => {
    // Crear sala
    socket.on("create_room", ({ maxUsers }, callback) => {
        try {
            const pin = createRoom(maxUsers);
            callback({ success: true, pin });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // Enviar mensaje
    socket.on("send_message", ({ message, pin }, callback) => {
        try {
            if (!pin || !connectedUsers.has(socket.id)) {
                throw new Error("No estás en una sala válida");
            }

            const room = activeRooms.get(pin);
            if (!room) {
                throw new Error("Sala no encontrada");
            }

            // Buscar el nombre del usuario en la sala
            const user = room.users.find(u => u.id === socket.id);
            const senderName = user ? user.name : "Anónimo";

            const newMessage = {
                sender: socket.id,
                senderName, // Guardar el nombre del usuario en el mensaje
                text: message,
                timestamp: Date.now()
            };

            room.addMessage(newMessage);

            // Notificar a toda la sala incluyendo al remitente
            io.to(pin).emit("new_message", newMessage);

            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    // En el evento join_room
    socket.on('join_room', ({ pin, username }, callback) => {
        try {
            const user = {
                id: socket.id,
                name: username
            };

            const room = joinRoom(pin, user);
            socket.join(pin);

            // Notificar a los demás usuarios
            socket.to(pin).emit('user_joined', user);

            // Enviar estado completo al nuevo usuario
            callback({
                success: true,
                room: {
                    pin: room.pin,
                    maxUsers: room.maxUsers,
                    users: room.users,
                    messages: room.messages
                }
            });

            // Emitir room_update a todos los usuarios de la sala
            io.to(pin).emit('room_update', {
                pin: room.pin,
                maxUsers: room.maxUsers,
                users: room.users,
                messages: room.messages
            });

        } catch (error) {
            callback({
                success: false,
                error: error.message
            });
        }
    });

    // Nuevo evento para user_joined
    socket.on('user_joined', (user) => {
        setCurrentRoom(prev => {
            if (!prev) return null;

            // Evitar duplicados
            if (prev.users.some(u => u.id === user.id)) {
                return prev;
            }

            return {
                ...prev,
                users: [...prev.users, user],
                messages: [
                    ...prev.messages,
                    {
                        sender: "system",
                        text: `${user.name} se ha unido a la sala`,
                        timestamp: Date.now(),
                        isSystem: true
                    }
                ]
            };
        });
    });

    socket.on('leave_room', (callback) => {
        try {
            const pin = connectedUsers.get(socket.id);
            if (!pin) return callback({ success: false, error: "No estás en una sala" });

            const room = activeRooms.get(pin);
            if (!room) return callback({ success: false, error: "Sala no encontrada" });

            // Eliminar usuario
            room.users = room.users.filter(user => user.id !== socket.id);
            connectedUsers.delete(socket.id);
            socket.leave(pin);

            // Notificar a los demás
            io.to(pin).emit('user_left', {
                userId: socket.id,
                room: {
                    ...room,
                    users: room.users
                }
            });

            // Emitir room_update a todos los usuarios de la sala
            io.to(pin).emit('room_update', {
                pin: room.pin,
                maxUsers: room.maxUsers,
                users: room.users,
                messages: room.messages
            });

            callback({ success: true });
        } catch (error) {
            callback({ success: false, error: error.message });
        }
    });

    socket.on('disconnect', () => {
        const pin = connectedUsers.get(socket.id);
        if (!pin) return;

        const room = activeRooms.get(pin);
        if (!room) return;

        room.users = room.users.filter(user => user.id !== socket.id);
        connectedUsers.delete(socket.id);

        io.to(pin).emit('user_left', {
            userId: socket.id,
            room: {
                ...room,
                users: room.users
            }
        });

        // Emitir room_update a todos los usuarios de la sala
        io.to(pin).emit('room_update', {
            pin: room.pin,
            maxUsers: room.maxUsers,
            users: room.users,
            messages: room.messages
        });
    });
};