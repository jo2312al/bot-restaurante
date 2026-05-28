const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../logs/bot.log");

function log(message) {

    fs.mkdirSync(
        path.dirname(logPath),
        {
            recursive: true
        }
    );

    const time = new Date().toISOString();

    const text =
        typeof message === "string"
            ? message
            : JSON.stringify(message);

    const finalMessage = `[${time}] ${text}\n`;

    fs.appendFileSync(logPath, finalMessage);

    console.log(finalMessage);

}

module.exports = {
    log
};
