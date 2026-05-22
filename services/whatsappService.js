const { delay } = require("../utils/helpers");
const { DELAY_MS } = require("../config/config");

async function sendMessage(sock, to, text) {

    await delay(DELAY_MS);

    await sock.sendMessage(to, {
        text
    });

}

module.exports = {
    sendMessage
};