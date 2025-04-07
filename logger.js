const winston = require("winston");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = "8060982627:AAEBGfcn2336WCClxY3VI8yw7uk_WItyFmI";
const CHAT_ID = "@logger_arxive";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

class TelegramTransport extends winston.Transport {
  log(info, callback) {
    bot
      .sendMessage(
        CHAT_ID,
        `📝 Log: ${info.level.toUpperCase()} - ${info.message}`
      )
      .then(() => callback(null, true))
      .catch((err) => callback(err));
  }
}

logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new TelegramTransport()],
});

module.exports = logger;
