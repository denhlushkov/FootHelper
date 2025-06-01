const Command = require('./command');

class InfoCommand extends Command {
  execute() {
    return this.bot.sendMessage(this.msg.chat.id, 
      'Цей бот допоможе тобі слідкувати за футбольними подіями!\nХочеш дізнатися як зіграла твії улюблений клуб чи становище у таблиці - ти прийшов за адресою'
    );
  }
}

module.exports = InfoCommand;
