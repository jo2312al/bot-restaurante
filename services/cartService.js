function addToCart(cart, product) {

    cart.push(product);

}

function calculateItemTotal(item) {

    return item.price * item.quantity;

}

function calculateTotal(cart) {

    return cart.reduce((acc, item) => {
        return acc + calculateItemTotal(item);
    }, 0);

}

function formatCart(cart) {

    if (!cart.length) {
        return "Tu carrito esta vacio.\n\nEscribe menu para ver categorias.";
    }

    let text = "TU PEDIDO\n\n";

    cart.forEach((item, index) => {

        text += `${index + 1}. ${item.quantity}x ${item.name} - $${calculateItemTotal(item)}\n`;

        if (item.note) {
            text += `   Nota: ${item.note}\n`;
        }

    });

    text += `\nTOTAL: $${calculateTotal(cart)}\n\n`;
    text += "Escribe confirmar para finalizar, menu para agregar mas o 0 para cancelar.";

    return text;

}

function clearCart(user) {

    user.cart = [];

}

module.exports = {
    addToCart,
    calculateItemTotal,
    calculateTotal,
    formatCart,
    clearCart
};
