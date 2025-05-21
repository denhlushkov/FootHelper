const StartCommand = require('./start');
const HelpCommand = require('./help');
const InfoCommand = require('./info');

class CommandFactory {
  constructor(botIns) {
    this.bot = botIns;
  }

  create(command, msg) {
    switch (command) {
      case '/start':
        return new StartCommand(this.bot, msg);
      case '/help':
        return new HelpCommand(this.bot, msg);
      case '/info':
        return new InfoCommand(this.bot, msg);
      default:
        return null;
    }
  }
}

module.exports = CommandFactory;
