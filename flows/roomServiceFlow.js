const menu = require("../data/menu");

function generateMenu() {

    const grouped = {};

    menu.forEach(item => {

        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }

        grouped[item.category].push(item);

    });

    let text = "🍽️ MENÚ\n\n";

    Object.keys(grouped).forEach(category => {

        text += `📌 ${category}\n\n`;

        grouped[category].forEach(item => {

            text += `${item.id}️⃣ ${item.name} - $${item.price}\n`;

        });

        text += "\n";

    });

    return text;

}

module.exports = {
    generateMenu
};