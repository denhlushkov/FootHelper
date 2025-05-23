const StartCommand = require('./start');
const HelpCommand = require('./help');
const InfoCommand = require('./info');
const MatchesCommand = require('./matches');

class CommandFactory {
  constructor(botIn, service) {
    this.bot = botIn;
    this.service = service;
  }

  create(command, msg) {
    switch (command) {
      case '/start':
        return new StartCommand(this.bot, msg);
      case '/help':
        return new HelpCommand(this.bot, msg);
      case '/info':
        return new InfoCommand(this.bot, msg);
      case '/matches':
        return new MatchesCommand(this.bot, msg, this.service);
      default:
        return null;
    }
  }
}

module.exports = CommandFactory;
