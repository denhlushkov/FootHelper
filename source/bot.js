const TelegramApi = require('node-telegram-bot-api');
const CommandFactory = require('./commands/factory');
const MessageHandler = require('./strategies/messageHandler');
const FlashscoreService = require('./services/api');
const FlashscoreProxy = require('./services/proxy');

const TOKEN = '8007962131:AAF8NFQpZAtT-ZC2hpH_A4-2SovIukRIfhY';

class Bot {
  constructor() {
    const flashApi = new FlashscoreService();

    this.bot = new TelegramApi(TOKEN, { polling: true });    
    this.flashProxy = new FlashscoreProxy(flashApi);
    this.commandFactory = new CommandFactory(this.bot);
    this.handler = new MessageHandler(this.commandFactory);
  }
  
  init() {
    this.bot.on('message', async (msg) => {
      await this.handler.handle(msg);
    });
  }
}

module.exports = Bot;
