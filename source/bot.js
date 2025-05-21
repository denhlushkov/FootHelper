const TelegramApi = require('node-telegram-bot-api');
const CommandFactory = require('./commands/factory');
const MessageHandler = require('./strategies/messageHandler');

const TOKEN = '8007962131:AAF8NFQpZAtT-ZC2hpH_A4-2SovIukRIfhY';

class Bot {
  constructor() {
    this.bot = new TelegramApi(TOKEN, { polling: true });
    this.commandFactory = new CommandFactory(this.bot);
    this.handler = new MessageHandler(this.commandFactory);
  }

  init() {
    this.bot.on('message', msg => this.handler.handle(msg));
  }
}

module.exports = Bot;
