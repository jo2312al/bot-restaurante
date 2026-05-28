const menu = require("../data/menu");

function getCategories() {

    return [...new Set(menu.map(item => item.category))];

}

function getProductsByCategory(category) {

    return menu.filter(item => item.category === category);

}

function generateCategoryMenu() {

    const categories = getCategories();

    let text = "MENU ROOM SERVICE\n\n";
    text += "Elige una categoria:\n\n";

    categories.forEach((category, index) => {
        text += `${index + 1}. ${category}\n`;
    });

    text += "\nTambien puedes escribir: carrito, confirmar o 0 para cancelar.";

    return text;

}

function generateProductsMenu(category) {

    const products = getProductsByCategory(category);

    let text = `${category}\n\n`;

    products.forEach((item, index) => {
        text += `${index + 1}. ${item.name} - $${item.price}\n`;
    });

    text += "\nResponde con el numero del producto.";
    text += "\nEscribe categorias para volver, carrito, confirmar o 0 para cancelar.";

    return text;

}

module.exports = {
    generateCategoryMenu,
    generateProductsMenu,
    getCategories,
    getProductsByCategory
};
