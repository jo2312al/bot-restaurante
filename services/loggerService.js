const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../logs/bot.log");

function log(message) {

    const time = new Date().toISOString();

    const finalMessage = `[${time}] ${message}\n`;

    fs.appendFileSync(logPath, finalMessage);

    console.log(finalMessage);

}

module.exports = {
    log
};