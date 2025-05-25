const Command = require('./command');

class StandingsCommand extends Command {
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
    };

    const buttons = {
      reply_markup: {
        inline_keyboard: Object.entries(leagues).map(([name, id]) => [
          { text: name, callback_data: `${id}` }
        ])
      }
    };

    await this.bot.sendMessage(chatId, 'Оберіть лігу для перегляду турнірної таблиці:', buttons);
  }
}

module.exports = StandingsCommand;
