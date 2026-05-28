const { MAX_QUANTITY } = require("../config/config");

function validateQuantity(quantity) {

    const qty = Number(quantity);

    if (!Number.isInteger(qty)) return false;

    return qty >= 1 && qty <= MAX_QUANTITY;

}

function validateRoom(room) {

    return /^[0-9]+$/.test(String(room).trim());

}

function validateName(name) {

    const trimmedName = String(name).trim();
    const words = trimmedName.split(/\s+/);

    return trimmedName.length >= 4 && words.length >= 2;

}

module.exports = {
    validateQuantity,
    validateRoom,
    validateName
};
