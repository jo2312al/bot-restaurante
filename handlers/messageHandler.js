const userState = require("../state/userState");

const loggerService = require("../services/loggerService");

const scheduleService = require("../services/scheduleService");

const roomMessages = require("../messages/roomMessages");

const { generateMenu } = require("../flows/roomServiceFlow");

const roomServiceHandler = require("./roomServiceHandler");

const { sendMessage } = require("../services/whatsappService");

const { calculateTotal } = require("../services/cartService");

module.exports = async (sock, message) => {

    const from = message.key.remoteJid;

    // IGNORAR MENSAJES DEL BOT
    if (message.key.fromMe) {
        return;
    }

    const isGroup = from.endsWith("@g.us");

    // IGNORAR GRUPOS
    if (isGroup) {

        loggerService.log(`Grupo ignorado: ${from}`);

        return;

    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "";

    const lower = text.toLowerCase().trim();

    loggerService.log(`Mensaje recibido de ${from}: ${lower}`);

    // CREAR ESTADO SI NO EXISTE
    if (!userState[from]) {

        userState[from] = {
            step: null,
            cart: [],
            data: {}
        };

    }

    const user = userState[from];

    // CANCELAR / RESET

    if (
        lower === "cancelar" ||
        lower === "0"
    ) {

        userState[from] = {
            step: null,
            cart: [],
            data: {}
        };

        return sendMessage(
            sock,
            from,
            "❌ Pedido cancelado"
        );

    }

    // SI ESTÁ EN FLUJO
    // MANEJAR FLUJO PRIMERO

    if (user.step) {

        return roomServiceHandler(
            sock,
            from,
            lower
        );

    }

    // MENÚ PRINCIPAL

    if (
        lower === "hola" ||
        lower === "inicio" ||
        lower === "menu"
    ) {

        if (!scheduleService.isRoomServiceOpen()) {

            return sendMessage(
                sock,
                from,
                roomMessages.closedMessage
            );

        }

        return sendMessage(
            sock,
            from,
            roomMessages.mainMenu
        );

    }

    // VER MENÚ

    if (lower === "1") {

        user.step = "SELECT_PRODUCT";

        return sendMessage(
            sock,
            from,
            generateMenu()
        );

    }

    // VER CARRITO

    if (lower === "2") {

        const cart = user.cart;

        if (!cart.length) {

            return sendMessage(
                sock,
                from,
                "🛒 Carrito vacío"
            );

        }

        let textCart = "🛒 TU PEDIDO\n\n";

        cart.forEach(item => {

            textCart += `${item.quantity}x ${item.name} - $${item.price * item.quantity}\n`;

            if (item.note) {

                textCart += `📝 ${item.note}\n`;

            }

            textCart += "\n";

        });

        textCart += `💰 TOTAL: $${calculateTotal(cart)}`;

        return sendMessage(
            sock,
            from,
            textCart
        );

    }

    // CONFIRMAR PEDIDO

    if (lower === "3") {

        if (!user.cart.length) {

            return sendMessage(
                sock,
                from,
                "🛒 No tienes productos"
            );

        }

        user.step = "WAITING_CONFIRM";

        return sendMessage(
            sock,
            from,
            roomMessages.confirmOrder
        );

    }

    // CANCELAR PEDIDO

    if (lower === "4") {

        userState[from] = {
            step: null,
            cart: [],
            data: {}
        };

        return sendMessage(
            sock,
            from,
            "❌ Pedido cancelado"
        );

    }

    // OPCIÓN INVÁLIDA

    return sendMessage(
        sock,
        from,
        "❌ Opción inválida"
    );

};