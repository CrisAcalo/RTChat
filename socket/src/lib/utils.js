// @file /socket/src/lib/utils.js
const { ROOM } = require("../config/constants");

/**
 * Genera un PIN numérico único de 6 dígitos para salas.
 * @returns {string} PIN aleatorio (ej: "452781")
 */
function generatePin() {
    const min = 10 ** (ROOM.PIN_LENGTH - 1);
    const max = 10 ** ROOM.PIN_LENGTH - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
}

/**
 * Valida si un PIN es correcto (6 dígitos numéricos).
 * @param {string} pin - PIN a validar
 * @returns {boolean}
 */
function isValidPin(pin) {
    return /^\d{6}$/.test(pin);
}

module.exports = {
    generatePin,
    isValidPin
};