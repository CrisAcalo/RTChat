// @file /socket/src/config/constants.js

module.exports = {
    // Configuración de salas
    ROOM: {
        PIN_LENGTH: 6,      // Longitud del PIN (6 dígitos)
        MAX_USERS_DEFAULT: 5 // Límite default de usuarios/sala
    },

    // Mensajes de error/success (centralizados para fácil mantenimiento)
    MESSAGES: {
        ERROR: {
            ROOM_FULL: "La sala está llena",
            ROOM_NOT_FOUND: "Sala no encontrada",
            USER_ALREADY_IN_ROOM: "Ya estás en una sala. Deja la actual antes de unirte a otra."
        },
        SUCCESS: {
            ROOM_CREATED: "Sala creada exitosamente"
        }
    },

    // Eventos de Socket.io (para evitar typos)
    SOCKET_EVENTS: {
        CREATE_ROOM: "create_room",
        JOIN_ROOM: "join_room",
        SEND_MESSAGE: "send_message",
        ROOM_UPDATE: "room_update",
        NEW_MESSAGE: "new_message",
        USER_LEFT: "user_left"
    }
};