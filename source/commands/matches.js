const Command = require('./command');

class MatchesCommand extends Command {
  constructor(bot, msg, service) {
    super(bot, msg);
    this.service = service; 
  }

  async execute() {
    const chatId = this.msg.chat.id;
    const leagues = {
      'АПЛ': 'PL',
      'Ла Ліга': 'PD',
      'Серія А': 'SA',
      'Бундесліга': 'BL1',
      'Ліга чемпіонів': 'CL',
    };

    const buttons = {
      reply_markup: {
        inline_keyboard: Object.entries(leagues).map(([name, id]) => [
          { text: name, callback_data: `fixtures_${id}` } 
        ])
      }
    };

    await this.bot.sendMessage(chatId, 'Оберіть лігу для перегляду матчів:', buttons);
  }
}

module.exports = MatchesCommand;