const Command = require('./command');

class InfoCommand extends Command {
  execute() {
    return this.bot.sendMessage(this.msg.chat.id, 'Цей бот допоможе тобі слідкувати за футбольними подіями!');
  }
}

module.exports = InfoCommand;
