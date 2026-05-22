const userState = require("../state/userState");
const menu = require("../data/menu");

const {
    validateQuantity,
    validateRoom,
    validateName
} = require("../validators/roomValidators");

const {
    addToCart,
    calculateTotal,
    clearCart,
    formatCart
} = require("../services/cartService");

const { sendMessage } = require("../services/whatsappService");
const { GROUP_ID } = require("../config/config");
const messages = require("../messages/roomMessages");
const { generateMenu } = require("../flows/roomServiceFlow");

function clearTempProduct(user) {

    delete user.tempProduct;
    delete user.tempQuantity;

}

function addTempProductToCart(user, note = "") {

    addToCart(user.cart, {
        ...user.tempProduct,
        quantity: user.tempQuantity,
        note
    });

    clearTempProduct(user);
    user.step = "SELECT_PRODUCT";

}

function nextActionMessage(user) {

    return [
        "✅ Producto agregado al carrito.",
        "",
        formatCart(user.cart),
        "",
        "Para agregar otro producto, escribe su número.",
        "Para ver el menú completo, escribe menu."
    ].join("\n");

}

async function roomServiceHandler(sock, from, text) {

    const user = userState[from];
    const rawText = String(text || "").trim();
    const lower = rawText.toLowerCase();

    if (user.step === "SELECT_PRODUCT") {

        if (["menu", "menú", "ver menu", "ver menú"].includes(lower)) {
            return sendMessage(sock, from, generateMenu());
        }

        if (["carrito", "ver carrito"].includes(lower)) {
            return sendMessage(sock, from, formatCart(user.cart));
        }

        if (["confirmar", "finalizar", "pedido"].includes(lower)) {

            if (!user.cart.length) {
                return sendMessage(sock, from, "🛒 Aún no tienes productos. Responde con el número de un producto.");
            }

            user.step = "WAITING_CONFIRM";
            return sendMessage(sock, from, `${formatCart(user.cart)}\n\n${messages.confirmOrder}`);

        }

        const product = menu.find(item => item.id === lower);

        if (!product) {
            return sendMessage(
                sock,
                from,
                "❌ Producto inválido.\n\nResponde con un número del menú, carrito, confirmar, menu o 0 para cancelar."
            );
        }

        user.tempProduct = product;
        user.step = "WAITING_QUANTITY";

        return sendMessage(
            sock,
            from,
            [
                `Elegiste: ${product.name}`,
                `Precio: $${product.price}`,
                product.description ? `Detalle: ${product.description}` : "",
                "",
                messages.askQuantity.trim()
            ].filter(Boolean).join("\n")
        );

    }

    if (user.step === "WAITING_QUANTITY") {

        if (!validateQuantity(lower)) {
            return sendMessage(sock, from, messages.invalidQuantity);
        }

        user.tempQuantity = Number(lower);
        user.step = "WAITING_NOTE_OPTION";

        return sendMessage(sock, from, messages.askNote);

    }

    if (user.step === "WAITING_NOTE_OPTION") {

        if (["1", "si", "sí", "con nota"].includes(lower)) {
            user.step = "WAITING_NOTE_TEXT";
            return sendMessage(sock, from, messages.askNoteText);
        }

        if (["2", "no", "sin nota"].includes(lower)) {
            addTempProductToCart(user);
            return sendMessage(sock, from, nextActionMessage(user));
        }

        return sendMessage(sock, from, "Responde 1 para agregar nota o 2 para continuar sin nota.");

    }

    if (user.step === "WAITING_NOTE_TEXT") {

        addTempProductToCart(user, rawText);
        return sendMessage(sock, from, nextActionMessage(user));

    }

    if (user.step === "WAITING_CONFIRM") {

        if (["carrito", "ver carrito"].includes(lower)) {
            return sendMessage(sock, from, `${formatCart(user.cart)}\n\n${messages.confirmOrder}`);
        }

        if (["1", "si", "sí", "confirmar"].includes(lower)) {
            user.step = "WAITING_ROOM";
            return sendMessage(sock, from, "🏨 Escribe tu número de habitación.");
        }

        if (["2", "no", "cancelar"].includes(lower)) {
            clearCart(user);
            clearTempProduct(user);
            user.step = null;
            user.data = {};
            return sendMessage(sock, from, "❌ Pedido cancelado. Escribe menu para iniciar uno nuevo.");
        }

        return sendMessage(sock, from, messages.confirmOrder);

    }

    if (user.step === "WAITING_ROOM") {

        if (!validateRoom(rawText)) {
            return sendMessage(sock, from, "❌ Número de habitación inválido. Usa solo números.");
        }

        user.data.room = rawText;
        user.step = "WAITING_NAME";

        return sendMessage(sock, from, "👤 Escribe tu nombre completo.");

    }

    if (user.step === "WAITING_NAME") {

        if (!validateName(rawText)) {
            return sendMessage(sock, from, "❌ Nombre inválido. Escribe nombre y apellido.");
        }

        user.data.name = rawText;

        const total = calculateTotal(user.cart);

        let orderText = [
            "🍽️ NUEVO PEDIDO",
            "",
            `🏨 Habitación: ${user.data.room}`,
            `👤 Cliente: ${user.data.name}`,
            "",
            "🛒 PEDIDO",
            ""
        ].join("\n");

        user.cart.forEach(item => {

            orderText += `${item.quantity}x ${item.name} - $${item.price * item.quantity}\n`;

            if (item.note) {
                orderText += `Nota: ${item.note}\n`;
            }

        });

        orderText += `\n💰 TOTAL: $${total}\n\n⏳ Tiempo estimado: 30-40 minutos`;

        await sendMessage(sock, GROUP_ID, orderText);

        await sendMessage(
            sock,
            from,
            `✅ PEDIDO CONFIRMADO\n\n💰 TOTAL: $${total}\n\n⏳ Tiempo estimado: 30-40 minutos`
        );

        userState[from] = {
            step: null,
            cart: [],
            data: {}
        };

    }

}

module.exports = roomServiceHandler;
