require('dotenv').config();

const TelegramApi = require('node-telegram-bot-api');
const CommandFactory = require('./commands/factory');
const MessageHandler = require('./strategies/messageHandler');
const MatchProxy = require('./services/proxy');
const MatchService = require('./services/api');
const CallbackQueryHandler = require('./strategies/callbackHandler');
const BOT_COMMANDS = require('./utils/botCommands');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set!");
}
class Bot {
  constructor() {
    this.bot = new TelegramApi(TOKEN, { polling: true });    
    this.service = new MatchProxy(new MatchService());
    this.commandFactory = new CommandFactory(this.bot, this.service);
    this.handler = new MessageHandler(this.commandFactory);
    this.callbackHandler = new CallbackQueryHandler(this.bot, this.service);
  }
  
  init() {
    this.bot.setMyCommands(BOT_COMMANDS);

    this.bot.on('message', async (msg) => {
      await this.handler.handle(msg);
    });

    this.bot.on('callback_query', async (query) => {
      await this.callbackHandler.handle(query);
    });
  }
}

module.exports = Bot;
