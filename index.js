const {

    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason

} = require("@whiskeysockets/baileys");

const pino =
    require("pino");

const qrcode =
    require("qrcode-terminal");

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
        // AUTH
        // ==================================

        const {

            state,
            saveCreds

        } = await useMultiFileAuthState("./auth");

        // ==================================
        // SOCKET
        // ==================================

        const sock = makeWASocket({

            auth: state,

            printQRInTerminal: true,

            logger: pino({

                level: "silent"

            }),

            browser: [

                "Ubuntu",
                "Chrome",
                "20.0.04"

            ]

        });

        // ==================================
        // SAVE CREDS
        // ==================================

        sock.ev.on(

            "creds.update",

            saveCreds

        );

        // ==================================
        // CONNECTION UPDATE
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

                    console.log("\n📲 ESCANEA ESTE QR:\n");

                    qrcode.generate(

                        qr,

                        {
                            small: true
                        }

                    );

                }

                // ==========================
                // OPEN
                // ==========================

                if (
                    connection === "open"
                ) {

                    console.log("✅ BOT CONECTADO");

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

                    console.log("❌ Conexión cerrada");

                    console.log(

                        lastDisconnect?.error

                    );

                    const shouldReconnect =

                        lastDisconnect?.error?.output?.statusCode

                        !==

                        DisconnectReason.loggedOut;

                    // ======================
                    // RECONNECT
                    // ======================

                    if (
                        shouldReconnect
                    ) {

                        console.log(

                            "🔄 Reconectando en 5 segundos..."

                        );

                        setTimeout(() => {

                            startBot();

                        }, 5000);

                    }

                    // ======================
                    // LOGGED OUT
                    // ======================

                    else {

                        console.log(

                            "🚫 Sesión cerrada. Escanea QR nuevamente."

                        );

                    }

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

                    // ======================
                    // VALIDAR
                    // ======================

                    if (
                        !message.message
                    ) {

                        return;

                    }

                    console.log("📩 Nuevo mensaje");

                    // ======================
                    // HANDLER
                    // ======================

                    await messageHandler(

                        sock,
                        message

                    );

                }

                // ==========================
                // ERROR MENSAJE
                // ==========================

                catch (error) {

                    console.log(

                        "❌ Error procesando mensaje"

                    );

                    console.log(error);

                }

            }

        );

    }

    // ======================================
    // ERROR START BOT
    // ======================================

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