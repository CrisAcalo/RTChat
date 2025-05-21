class Room {
    constructor(pin, maxUsers) {
        this.pin = pin; // PIN único (ej: "452781")
        this.maxUsers = maxUsers; // Límite de usuarios (ej: 5)
        this.users = []; // { socketId: { id, name } }
        this.messages = []; // [{ sender, message, timestamp }]
    }

    addUser(user) {
        if (this.users.length >= this.maxUsers) throw new Error("Sala llena");
        this.users.push(user); // Usar push para arrays
    }

    removeUser(socketId) {
        this.users = this.users.filter(user => user.id !== socketId); // Siempre devuelve array
    }

    addMessage(message) {
        if (!message.sender || !message.text) {
            throw new Error("Mensaje inválido");
        }
        this.messages.push(message);
        // Mantener un límite de mensajes si es necesario
        if (this.messages.length > 100) {
            this.messages.shift();
        }
    }
}

module.exports = Room;