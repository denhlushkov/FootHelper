const Command = require('./command');

class StartCommand extends Command {
  execute() {
    return this.bot.sendMessage(this.msg.chat.id, 'Вітаю тебе в Foot Helper!');
  }
}

module.exports = StartCommand;
