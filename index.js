const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const qrcode = require("qrcode-terminal");

const { log } = require("./services/loggerService");
const messageHandler = require("./handlers/messageHandler");

const RECONNECT_DELAY_MS = 5000;

function delay(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}

async function startBot() {

  console.log("Iniciando bot restaurante...");

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState("auth");

  const {
    version
  } = await fetchLatestBaileysVersion();

  console.log("Version de Baileys:", version);
  console.log("Esperando codigo QR. Si ya hay una sesion activa en auth/, el bot conectara sin pedir QR.");

  const sock = makeWASocket({

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

  const originalSendMessage = sock.sendMessage.bind(sock);

  sock.sendMessage = async (...args) => {

    await delay(1500);

    return originalSendMessage(...args);

  };

  sock.ev.on(
    "creds.update",
    saveCreds
  );

  sock.ev.on(

    "connection.update",

    async (update) => {

      const {
        connection,
        qr,
        lastDisconnect
      } = update;

      if (qr) {

        console.log("\nESCANEA ESTE CODIGO QR CON WHATSAPP\n");

        qrcode.generate(
          qr,
          {
            small: true
          }
        );

      }

      if (connection === "open") {

        console.log("BOT CONECTADO");
        log("BOT CONECTADO");

      }

      if (connection === "close") {

        console.log("DESCONECTADO");
        console.log(lastDisconnect?.error);
        log("DESCONECTADO");

        const reconnect =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode !== DisconnectReason.loggedOut;

        if (reconnect) {

          console.log(`RECONECTANDO EN ${RECONNECT_DELAY_MS / 1000} SEGUNDOS...`);
          log(`RECONECTANDO EN ${RECONNECT_DELAY_MS / 1000} SEGUNDOS...`);

          await delay(RECONNECT_DELAY_MS);
          startBot().catch(handleStartupError);

        }

      }

    }

  );

  sock.ev.on(

    "messages.upsert",

    async ({
      messages,
      type
    }) => {

      try {

        if (type !== "notify") {
          return;
        }

        const msg = messages[0];

        if (!msg?.message || msg.key.fromMe) {
          return;
        }

        console.log("Mensaje recibido:", msg.key.remoteJid);

        await messageHandler(
          sock,
          msg
        );

      }

      catch (err) {

        console.log("ERROR MENSAJE");
        console.log(err);

      }

    }

  );

}

function handleStartupError(err) {

  console.log("ERROR AL INICIAR BOT");
  console.log(err);
  log(`ERROR AL INICIAR BOT: ${err.message}`);

}

startBot().catch(handleStartupError);
