const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const qrcode = require("qrcode-terminal");

const messageHandler =
    require("./handlers/messageHandler");

const loggerService =
    require("./services/loggerService");

// ==========================================
// START BOT
// ==========================================

async function startBot() {

    try {

        console.log("🚀 Iniciando bot...");

        // ==================================
        // VERSION
        // ==================================

        const {
            version
        } = await fetchLatestBaileysVersion();

        console.log(
            "📦 Baileys version:",
            version
        );

        // ==================================
        // AUTH
        // ==================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            "./auth"
        );

        // ==================================
        // SOCKET
        // ==================================

        const sock = makeWASocket({

            version,

            auth: state,

            logger: pino({
                level: "silent"
            }),

            browser: [

                "Ubuntu",

                "Chrome",

                "22.04"

            ],

            syncFullHistory: false,

            markOnlineOnConnect: false,

            generateHighQualityLinkPreview: false

        });

        // ==================================
        // CREDS
        // ==================================

        sock.ev.on(
            "creds.update",
            saveCreds
        );

        // ==================================
        // CONNECTION
        // ==================================

        sock.ev.on(

            "connection.update",

            async (update) => {

                const {

                    connection,
                    lastDisconnect,
                    qr

                } = update;

                // ==========================
                // QR
                // ==========================

                if (qr) {

                    console.log(
                        "\n📲 ESCANEA ESTE QR:\n"
                    );

                    qrcode.generate(
                        qr,
                        {
                            small: true
                        }
                    );

                }

                // ==========================
                // CONNECTED
                // ==========================

                if (
                    connection === "open"
                ) {

                    console.log(
                        "✅ BOT CONECTADO"
                    );

                    loggerService.log(
                        "BOT CONECTADO"
                    );

                }

                // ==========================
                // CLOSE
                // ==========================

                if (
                    connection === "close"
                ) {

                    const statusCode =

                        lastDisconnect?.error
                        ?.output
                        ?.statusCode;

                    console.log(
                        "❌ Conexión cerrada"
                    );

                    console.log(
                        lastDisconnect?.error
                    );

                    // ======================
                    // LOGGED OUT
                    // ======================

                    if (
                        statusCode ===
                        DisconnectReason.loggedOut
                    ) {

                        console.log(
                            "🚫 Sesión cerrada"
                        );

                        return;
                    }

                    // ======================
                    // CONNECTION FAILURE
                    // ======================

                    if (
                        statusCode === 405
                    ) {

                        console.log(
                            "⚠️ WhatsApp rechazó temporalmente la conexión"
                        );

                        console.log(
                            "⏳ Espera 1 minuto y vuelve a intentar"
                        );

                        return;
                    }

                    // ======================
                    // NO LOOP
                    // ======================

                    console.log(
                        "🛑 Reinicia manualmente"
                    );

                }

            }

        );

        // ==================================
        // MESSAGES
        // ==================================

        sock.ev.on(

            "messages.upsert",

            async ({ messages }) => {

                try {

                    const message =
                        messages[0];

                    if (
                        !message.message
                    ) {

                        return;
                    }

                    if (
                        message.key.remoteJid ===
                        "status@broadcast"
                    ) {

                        return;
                    }

                    console.log(
                        "📩 Nuevo mensaje"
                    );

                    await messageHandler(
                        sock,
                        message
                    );

                }

                catch (error) {

                    console.log(
                        "❌ Error procesando mensaje"
                    );

                    console.log(error);

                }

            }

        );

    }

    catch (error) {

        console.log(
            "❌ Error iniciando bot"
        );

        console.log(error);

    }

}

// ==========================================
// INIT
// ==========================================

startBot();