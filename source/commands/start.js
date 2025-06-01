const Command = require('./command');

class StartCommand extends Command {
  async execute() {
    return this.bot.sendMessage(this.msg.chat.id, 'Вітаю тебе в Foot Helper!\nКоманди можеш побачити в меню або написавши /help')
  }
}

module.exports = StartCommand;
