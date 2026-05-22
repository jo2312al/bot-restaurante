const menu = require("../data/menu");

function generateMenu() {

    const grouped = {};

    menu.forEach(item => {

        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }

        grouped[item.category].push(item);

    });

    let text = "🍽️ MENÚ ROOM SERVICE\n\n";

    Object.keys(grouped).forEach(category => {

        text += `📌 ${category}\n`;

        grouped[category].forEach(item => {

            text += `${item.id}. ${item.name} - $${item.price}\n`;

        });

        text += "\n";

    });

    text += "Responde con el número del producto.\n";
    text += "También puedes escribir: carrito, confirmar, menu o 0 para cancelar.";

    return text;

}

module.exports = {
    generateMenu
};
