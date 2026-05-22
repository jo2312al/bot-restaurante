const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const messageHandler = require("./handlers/messageHandler");
const loggerService = require("./services/loggerService");

async function startBot() {

    console.log("🚀 Iniciando bot...");

    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const sock = makeWASocket({

        auth: state,

        logger: pino({
            level: "silent"
        }),

        browser: ["Ubuntu", "Chrome", "20.0.04"]

    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

        const {
            connection,
            lastDisconnect,
            qr
        } = update;

        // MOSTRAR QR
        if (qr) {

            console.log("📲 ESCANEA ESTE QR:\n");

            qrcode.generate(qr, {
                small: true
            });

        }

        // CONECTADO
        if (connection === "open") {

            console.log("✅ BOT CONECTADO");

            loggerService.log("BOT CONECTADO");

        }

        // DESCONECTADO
        if (connection === "close") {

            console.log("❌ Conexión cerrada");

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log("🔄 Reconectando...");

                startBot();

            }

        }

    });

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const message = messages[0];

        if (!message.message) return;

        console.log("📩 Nuevo mensaje");

        await messageHandler(sock, message);

    });

}

startBot();