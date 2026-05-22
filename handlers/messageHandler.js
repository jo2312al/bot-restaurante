const userState = require("../state/userState");

const loggerService = require("../services/loggerService");
const scheduleService = require("../services/scheduleService");
const roomMessages = require("../messages/roomMessages");
const menu = require("../data/menu");

const { generateMenu } = require("../flows/roomServiceFlow");
const roomServiceHandler = require("./roomServiceHandler");
const { sendMessage } = require("../services/whatsappService");
const { formatCart } = require("../services/cartService");

function getMessageText(message) {

    return (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        ""
    ).trim();

}

function resetUser(from) {

    userState[from] = {
        step: null,
        cart: [],
        data: {}
    };

}

function ensureUser(from) {

    if (!userState[from]) {
        resetUser(from);
    }

    return userState[from];

}

function isGreeting(text) {

    return ["hola", "inicio", "buenos dias", "buenas tardes", "buenas noches"].includes(text);

}

function isMenuCommand(text) {

    return ["1", "menu", "menú", "ver menu", "ver menú"].includes(text);

}

function isCancelCommand(text) {

    return ["0", "cancelar", "salir"].includes(text);

}

module.exports = async (sock, message) => {

    const from = message.key.remoteJid;

    if (message.key.fromMe) {
        return;
    }

    const isGroup = from.endsWith("@g.us");

    if (isGroup) {
        loggerService.log(`Grupo ignorado: ${from}`);
        return;
    }

    const text = getMessageText(message);
    const lower = text.toLowerCase();

    loggerService.log(`Mensaje recibido de ${from}: ${lower}`);

    const user = ensureUser(from);

    if (isCancelCommand(lower)) {
        resetUser(from);
        return sendMessage(sock, from, "❌ Pedido cancelado. Escribe hola para iniciar de nuevo.");
    }

    if (user.step) {
        return roomServiceHandler(sock, from, text);
    }

    if (isGreeting(lower)) {

        if (!scheduleService.isRoomServiceOpen()) {
            return sendMessage(sock, from, roomMessages.closedMessage);
        }

        return sendMessage(sock, from, roomMessages.mainMenu);

    }

    if (isMenuCommand(lower)) {

        if (!scheduleService.isRoomServiceOpen()) {
            return sendMessage(sock, from, roomMessages.closedMessage);
        }

        user.step = "SELECT_PRODUCT";
        return sendMessage(sock, from, generateMenu());

    }

    if (lower === "2" || lower === "carrito" || lower === "ver carrito") {
        return sendMessage(sock, from, formatCart(user.cart));
    }

    if (lower === "3" || lower === "confirmar") {

        if (!user.cart.length) {
            return sendMessage(sock, from, "🛒 Aún no tienes productos. Escribe menu para ver opciones.");
        }

        user.step = "WAITING_CONFIRM";
        return sendMessage(sock, from, `${formatCart(user.cart)}\n\n${roomMessages.confirmOrder}`);

    }

    if (lower === "4") {
        resetUser(from);
        return sendMessage(sock, from, "❌ Pedido cancelado. Escribe hola para iniciar de nuevo.");
    }

    if (menu.some(product => product.id === lower)) {

        if (!scheduleService.isRoomServiceOpen()) {
            return sendMessage(sock, from, roomMessages.closedMessage);
        }

        user.step = "SELECT_PRODUCT";
        return roomServiceHandler(sock, from, text);

    }

    return sendMessage(
        sock,
        from,
        "No entendí tu mensaje.\n\nEscribe hola para iniciar, menu para ver productos o 0 para cancelar."
    );

};
