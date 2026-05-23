const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino =
  require("pino");

const qrcode =
  require("qrcode-terminal");

const log =
  require("./services/loggerService");

const messageHandler =
  require("./handlers/messageHandler");

// ==========================================
// DELAY
// ==========================================

function delay(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

}

// ==========================================
// START BOT
// ==========================================

async function startBot() {

  console.log(
    "🚀 Iniciando bot restaurante..."
  );

  // ========================================
  // AUTH
  // ========================================

  const {
    state,
    saveCreds
  } =
    await useMultiFileAuthState(
      "auth"
    );

  // ========================================
  // VERSION
  // ========================================

  const {
    version
  } =
    await fetchLatestBaileysVersion();

  console.log(
    "📦 Versión:",
    version
  );

  // ========================================
  // SOCKET
  // ========================================

  const sock =
    makeWASocket({

      version,

      logger: pino({
        level: "silent"
      }),

      auth: state,

      browser: [

        "Bot Restaurante",

        "Chrome",

        "1.0"

      ]

    });

  // ========================================
  // DELAY MENSAJES
  // ========================================

  const originalSendMessage =
    sock.sendMessage.bind(sock);

  sock.sendMessage =
    async (...args) => {

      await delay(1500);

      return originalSendMessage(
        ...args
      );

    };

  // ========================================
  // SAVE CREDS
  // ========================================

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  // ========================================
  // CONNECTION UPDATE
  // ========================================

  sock.ev.on(

    "connection.update",

    (update) => {

      const {

        connection,
        qr,
        lastDisconnect

      } = update;

      // ====================================
      // QR
      // ====================================

      if (qr) {

        console.log(
          "\n📱 ESCANEA QR\n"
        );

        qrcode.generate(
          qr,
          {
            small: true
          }
        );

      }

      // ====================================
      // OPEN
      // ====================================

      if (
        connection ===
        "open"
      ) {

        console.log(
          "✅ BOT CONECTADO"
        );

        log({

          usuario: "Sistema",

          modulo: "Core",

          accion: "✅ BOT CONECTADO"

        });

      }

      // ====================================
      // CLOSE
      // ====================================

      if (
        connection ===
        "close"
      ) {

        console.log(
          "❌ DESCONECTADO"
        );

        console.log(
          lastDisconnect?.error
        );

        log({

          usuario: "Sistema",

          modulo: "Core",

          accion: "❌ DESCONECTADO"

        });

        const reconnect =

          lastDisconnect
            ?.error
            ?.output
            ?.statusCode

          !==

          DisconnectReason
            .loggedOut;

        // ==================================
        // RECONNECT
        // ==================================

        if (reconnect) {

          console.log(
            "🔄 RECONECTANDO..."
          );

          log({

            usuario: "Sistema",

            modulo: "Core",

            accion: "🔄 RECONECTANDO..."

          });

          startBot();

        }

      }

    }

  );

  // ========================================
  // MESSAGES
  // ========================================

  sock.ev.on(

    "messages.upsert",

    async ({
      messages,
      type
    }) => {

      try {

        // ==================================
        // SOLO notify
        // ==================================

        if (
          type !== "notify"
        )
          return;

        const msg =
          messages[0];

        if (
          !msg.message
        )
          return;

        // ==================================
        // IGNORAR MENSAJES BOT
        // ==================================

        if (
          msg.key.fromMe
        )
          return;

        // ==================================
        // FROM
        // ==================================

        const from =
          msg.key.remoteJid;

        // ==================================
        // TEXTO
        // ==================================

        const text =

          msg.message
            .conversation ||

          msg.message
            .extendedTextMessage
            ?.text ||

          "";

        if (!text)
          return;

        // ==================================
        // IGNORAR GRUPOS
        // ==================================

        if (
          from.endsWith("@g.us")
        ) {

          return;

        }

        console.log(
          "📩",
          from,
          text
        );

        // ==================================
        // HANDLER
        // ==================================

        await messageHandler({

          sock,
          from,
          text

        });

      }

      catch (err) {

        console.log(
          "❌ ERROR MENSAJE"
        );

        console.log(err);

      }

    }

  );

}

// ==========================================
// INIT
// ==========================================

startBot();