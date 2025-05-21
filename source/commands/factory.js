const StartCommand = require('./start');
const HelpCommand = require('./help');
const InfoCommand = require('./info');
const MatchesCommand = require('./matches');

class CommandFactory {
  constructor(botIn, proxy) {
    this.bot = botIn;
    this.matchProxy = proxy;
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
        return new MatchesCommand(this.bot, msg, this.matchProxy);
      default:
        return null;
    }
  }
}

module.exports = CommandFactory;
