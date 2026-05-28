const menu = require("../data/menu");

function getCategories() {

    return [...new Set(menu.map(item => item.category))];

}

function getProductsByCategory(category) {

    return menu.filter(item => item.category === category);

}

function categoryIcon(category) {

    const icons = {
        "Desayunos": "🍳",
        "Antojitos": "🌮",
        "Especialidades tabasquenas": "🌶️",
        "Comida o cena": "🍽️",
        "Medias ordenes": "🥖",
        "Bebidas": "🥤"
    };

    return icons[category] || "📌";

}

function generateCategoryMenu() {

    const categories = getCategories();

    let text = "📋 *MENU ROOM SERVICE*\n\n";
    text += "✨ Elige una categoria:\n\n";

    categories.forEach((category, index) => {
        text += `${index + 1}️⃣ ${categoryIcon(category)} ${category}\n`;
    });

    text += "\n🛒 Escribe *carrito* para ver tu pedido.";
    text += "\n✅ Escribe *confirmar* para terminar.";
    text += "\n❌ Escribe *0* para cancelar.";

    return text;

}

function generateProductsMenu(category) {

    const products = getProductsByCategory(category);

    let text = `${categoryIcon(category)} *${category}*\n\n`;

    products.forEach((item, index) => {
        text += `${index + 1}. 🍽️ ${item.name} - $${item.price}\n`;
    });

    text += "\n🔢 Responde con el numero del producto.";
    text += "\n📋 Escribe *categorias* para volver.";
    text += "\n🛒 Escribe *carrito*, ✅ *confirmar* o ❌ *0*.";

    return text;

}

module.exports = {
    generateCategoryMenu,
    generateProductsMenu,
    getCategories,
    getProductsByCategory
};
