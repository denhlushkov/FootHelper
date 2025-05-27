const StartCommand = require('./start');
const HelpCommand = require('./help');
const InfoCommand = require('./info');
const StandingsCommand = require('./standings');
const MatchesCommand = require('./matches');
const LoggingDecorator = require('./decorator');

class CommandFactory {
  constructor(botIn, service) {
    this.bot = botIn;
    this.service = service;
  }

  create(command, msg) {
    let comInstance = null;

    switch (command) {
      case '/start':
        comInstance = new StartCommand(this.bot, msg);
        break;
      case '/help':
        comInstance = new HelpCommand(this.bot, msg);
        break;
      case '/info':
        comInstance = new InfoCommand(this.bot, msg);
        break;
      case '/standings':
        comInstance = new StandingsCommand(this.bot, msg, this.service);
        break;
      case '/matches':
        comInstance = new MatchesCommand(this.bot, msg, this.service);
        break;
      default:
        return null;
    }

    if (comInstance) {
      return new LoggingDecorator(comInstance, this.bot, msg);
    }

    return null;
  }
}

module.exports = CommandFactory;
