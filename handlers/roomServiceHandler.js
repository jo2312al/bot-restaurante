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
    clearCart
} = require("../services/cartService");

const {
    sendMessage
} = require("../services/whatsappService");

const {
    GROUP_ID
} = require("../config/config");

const messages = require("../messages/roomMessages");

const {
    generateMenu
} = require("../flows/roomServiceFlow");

async function roomServiceHandler(sock, from, text) {

    const user = userState[from];

    // SELECCIONAR PRODUCTO

    if (user.step === "SELECT_PRODUCT") {

        const product = menu.find(p => p.id === text);

        if (!product) {

            return sendMessage(
                sock,
                from,
                "❌ Producto inválido"
            );

        }

        user.tempProduct = product;

        user.step = "WAITING_QUANTITY";

        return sendMessage(
            sock,
            from,
            messages.askQuantity
        );

    }

    // CANTIDAD

    if (user.step === "WAITING_QUANTITY") {

        if (!validateQuantity(text)) {

            return sendMessage(
                sock,
                from,
                messages.invalidQuantity
            );

        }

        user.tempQuantity = Number(text);

        user.step = "WAITING_NOTE_OPTION";

        return sendMessage(
            sock,
            from,
            messages.askNote
        );

    }

    // NOTA OPCIÓN

    if (user.step === "WAITING_NOTE_OPTION") {

        // CON NOTA

        if (text === "1") {

            user.step = "WAITING_NOTE_TEXT";

            return sendMessage(
                sock,
                from,
                messages.askNoteText
            );

        }

        // SIN NOTA

        if (text === "2") {

            addToCart(user.cart, {

                ...user.tempProduct,

                quantity: user.tempQuantity,

                note: ""

            });

            user.step = null;

            return sendMessage(
                sock,
                from,
                `
✅ Producto agregado al carrito

${generateMenu()}

🛒 Escribe otro número para agregar más productos

o escribe:

2️⃣ Ver carrito
3️⃣ Confirmar pedido
`
            );

        }

    }

    // GUARDAR NOTA

    if (user.step === "WAITING_NOTE_TEXT") {

        addToCart(user.cart, {

            ...user.tempProduct,

            quantity: user.tempQuantity,

            note: text

        });

        user.step = null;

        return sendMessage(
            sock,
            from,
            `
✅ Producto agregado al carrito

${generateMenu()}

🛒 Escribe otro número para agregar más productos

o escribe:

2️⃣ Ver carrito
3️⃣ Confirmar pedido
`
        );

    }

    // CONFIRMAR PEDIDO

    if (user.step === "WAITING_CONFIRM") {

        if (text === "1") {

            user.step = "WAITING_ROOM";

            return sendMessage(
                sock,
                from,
                "🏨 Escribe tu número de habitación"
            );

        }

        if (text === "2") {

            clearCart(user);

            user.step = null;

            return sendMessage(
                sock,
                from,
                "❌ Pedido cancelado"
            );

        }

    }

    // HABITACIÓN

    if (user.step === "WAITING_ROOM") {

        if (!validateRoom(text)) {

            return sendMessage(
                sock,
                from,
                "❌ Número de habitación inválido"
            );

        }

        user.data.room = text;

        user.step = "WAITING_NAME";

        return sendMessage(
            sock,
            from,
            "👤 Escribe nombre completo"
        );

    }

    // NOMBRE

    if (user.step === "WAITING_NAME") {

        if (!validateName(text)) {

            return sendMessage(
                sock,
                from,
                "❌ Nombre inválido"
            );

        }

        user.data.name = text;

        const total = calculateTotal(user.cart);

        let orderText = `
🍽️ NUEVO PEDIDO

🏨 Habitación: ${user.data.room}

👤 ${user.data.name}

🛒 PEDIDO

`;

        user.cart.forEach(item => {

            orderText += `${item.quantity}x ${item.name}\n`;

            if (item.note) {

                orderText += `📝 ${item.note}\n`;

            }

        });

        orderText += `

💰 TOTAL: $${total}

⏳ Tiempo estimado:
30-40 minutos
`;

        // ENVIAR A COCINA

        await sendMessage(
            sock,
            GROUP_ID,
            orderText
        );

        // MENSAJE CLIENTE

        await sendMessage(
            sock,
            from,
            `
✅ PEDIDO CONFIRMADO

💰 TOTAL: $${total}

⏳ Tiempo estimado:
30-40 minutos
`
        );

        // RESETEAR

        userState[from] = {

            step: null,

            cart: [],

            data: {}

        };

    }

}

module.exports = roomServiceHandler;