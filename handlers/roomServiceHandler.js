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
const { log } = require("../services/loggerService");
const {
    generateCategoryMenu,
    generateProductsMenu,
    getCategories
} = require("../flows/roomServiceFlow");

function normalizeText(text) {

    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}

function clearTempProduct(user) {

    delete user.tempProduct;
    delete user.tempQuantity;

}

function addTempProductToCart(user, from, note = "") {

    addToCart(user.cart, {
        ...user.tempProduct,
        quantity: user.tempQuantity,
        note
    });

    log(`Carrito actualizado ${from}: ${user.cart.length} producto(s)`);

    clearTempProduct(user);
    user.step = "SELECT_CATEGORY";
    delete user.selectedCategory;

}

function nextActionMessage(user) {

    return [
        "✅ *Producto agregado al carrito.*",
        "",
        formatCart(user.cart),
        "",
        generateCategoryMenu()
    ].join("\n");

}

function findProductByInput(user, input) {

    const categoryProducts =
        user.selectedCategory
            ? menu.filter(item => item.category === user.selectedCategory)
            : [];

    const localProduct = categoryProducts[Number(input) - 1];

    return (
        localProduct ||
        categoryProducts.find(item => item.id === input) ||
        menu.find(item => item.id === input)
    );

}

async function roomServiceHandler(sock, from, text) {

    const user = userState[from];
    const rawText = String(text || "").trim();
    const lower = normalizeText(rawText);

    if (["menu", "categorias", "categoria", "ver menu", "ver categorias"].includes(lower)) {
        user.step = "SELECT_CATEGORY";
        delete user.selectedCategory;
        return sendMessage(sock, from, generateCategoryMenu());
    }

    if (["carrito", "ver carrito"].includes(lower)) {
        return sendMessage(sock, from, formatCart(user.cart));
    }

    if (["confirmar", "finalizar", "pedido"].includes(lower)) {

        if (!user.cart.length) {
            return sendMessage(sock, from, "🛒 Aun no tienes productos.\n\n📋 Elige una categoria para empezar.");
        }

        user.step = "WAITING_CONFIRM";
        return sendMessage(sock, from, `${formatCart(user.cart)}\n\n${messages.confirmOrder}`);

    }

    if (user.step === "SELECT_CATEGORY") {

        const categories = getCategories();
        const categoryIndex = Number(lower) - 1;
        const category = categories[categoryIndex];

        if (!category) {
            return sendMessage(
                sock,
                from,
                `⚠️ Categoria invalida.\n\n${generateCategoryMenu()}`
            );
        }

        user.selectedCategory = category;
        user.step = "SELECT_PRODUCT";

        return sendMessage(sock, from, generateProductsMenu(category));

    }

    if (user.step === "SELECT_PRODUCT") {

        const product = findProductByInput(user, lower);

        if (!product) {
            return sendMessage(
                sock,
                from,
                "⚠️ Producto invalido.\n\n🔢 Responde con un numero del menu.\n📋 Escribe *categorias* para volver.\n🛒 Escribe *carrito*, ✅ *confirmar* o ❌ *0*."
            );
        }

        user.tempProduct = product;
        user.step = "WAITING_QUANTITY";

        return sendMessage(
            sock,
            from,
            [
                `🍽️ Elegiste: *${product.name}*`,
                `💰 Precio: $${product.price}`,
                product.description ? `📌 Detalle: ${product.description}` : "",
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

        if (["1", "si", "con nota"].includes(lower)) {
            user.step = "WAITING_NOTE_TEXT";
            return sendMessage(sock, from, messages.askNoteText);
        }

        if (["2", "no", "sin nota"].includes(lower)) {
            addTempProductToCart(user, from);
            return sendMessage(sock, from, nextActionMessage(user));
        }

        return sendMessage(sock, from, "📝 Responde 1 para agregar nota o 2 para continuar sin nota.");

    }

    if (user.step === "WAITING_NOTE_TEXT") {

        addTempProductToCart(user, from, rawText);
        return sendMessage(sock, from, nextActionMessage(user));

    }

    if (user.step === "WAITING_CONFIRM") {

        if (["1", "si", "confirmar"].includes(lower)) {
            user.step = "WAITING_ROOM";
            return sendMessage(sock, from, "🏨 Escribe tu numero de habitacion.");
        }

        if (["2", "no", "cancelar"].includes(lower)) {
            clearCart(user);
            clearTempProduct(user);
            user.step = null;
            user.data = {};
            delete user.selectedCategory;
            return sendMessage(sock, from, "❌ Pedido cancelado.\n\n📋 Escribe *menu* para iniciar uno nuevo.");
        }

        return sendMessage(sock, from, messages.confirmOrder);

    }

    if (user.step === "WAITING_ROOM") {

        if (!validateRoom(rawText)) {
            return sendMessage(sock, from, "⚠️ Numero de habitacion invalido.\n\n🔢 Usa solo numeros.");
        }

        user.data.room = rawText;
        user.step = "WAITING_NAME";

        return sendMessage(sock, from, "👤 Escribe tu nombre completo.");

    }

    if (user.step === "WAITING_NAME") {

        if (!validateName(rawText)) {
            return sendMessage(sock, from, "⚠️ Nombre invalido.\n\n👤 Escribe nombre y apellido.");
        }

        user.data.name = rawText;

        const total = calculateTotal(user.cart);

        let orderText = [
            "🍽️ *NUEVO PEDIDO*",
            "",
            `🏨 Habitacion: ${user.data.room}`,
            `👤 Cliente: ${user.data.name}`,
            "",
            "🛒 *PEDIDO*",
            ""
        ].join("\n");

        user.cart.forEach(item => {

            orderText += `🍽️ ${item.quantity}x ${item.name} - $${item.price * item.quantity}\n`;

            if (item.note) {
                orderText += `📝 Nota: ${item.note}\n`;
            }

        });

        orderText += `\n💰 *TOTAL: $${total}*\n\n⏳ Tiempo estimado: 30-40 minutos`;

        let sentToGroup = true;

        try {
            await sendMessage(sock, GROUP_ID, orderText);
            log(`Pedido enviado a grupo ${GROUP_ID} desde ${from}`);
        }

        catch (err) {
            sentToGroup = false;
            log(`Error enviando pedido a grupo ${GROUP_ID}: ${err.message}`);
        }

        await sendMessage(
            sock,
            from,
            sentToGroup
                ? `✅ *PEDIDO CONFIRMADO*\n\n💰 *TOTAL: $${total}*\n\n⏳ Tiempo estimado: 30-40 minutos\n\n🍽️ Cocina ya recibio tu pedido.`
                : `⚠️ *PEDIDO REGISTRADO*\n\n💰 *TOTAL: $${total}*\n\nNo pude enviar el pedido al grupo de cocina. Por favor avisa a recepcion.`
        );

        userState[from] = {
            step: null,
            cart: [],
            data: {}
        };

    }

}

module.exports = roomServiceHandler;
