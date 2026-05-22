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

function clearCart(user) {

    user.cart = [];

}

module.exports = {
    addToCart,
    calculateItemTotal,
    calculateTotal,
    clearCart
};