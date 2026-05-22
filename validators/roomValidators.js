const { MAX_QUANTITY } = require("../config/config");

function validateQuantity(quantity) {

    const qty = Number(quantity);

    if (isNaN(qty)) return false;

    return qty >= 1 && qty <= MAX_QUANTITY;

}

function validateRoom(room) {

    return /^[0-9]+$/.test(room);

}

function validateName(name) {

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    const words = name.trim().split(" ");

    return regex.test(name) && words.length >= 2;

}

module.exports = {
    validateQuantity,
    validateRoom,
    validateName
};