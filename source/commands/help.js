const Command = require('./command');

class HelpCommand extends Command {
  execute() {
    const helpText = `
    Команди:
  /start - почати
  /help - допомога
  /info - інформація
    `;
    return this.bot.sendMessage(this.msg.chat.id, helpText);
  }
}

module.exports = HelpCommand;
