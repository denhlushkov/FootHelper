const Command = require('./command');

class StandingsCommand extends Command {
  constructor(bot, msg, service) {
    super(bot, msg);
    this.service = service;
  }

  async execute() {
    const chatId = this.msg.chat.id;
    const leaguesData = this.service.getLeagueButtonsData();

    if (leaguesData.length === 0) {
      await this.bot.sendMessage(chatId, 'Наразі немає доступних ліг для перегляду турнірних таблиць.');
      return;
    }

    const buttons = {
      reply_markup: {
        inline_keyboard: leaguesData.map(item => [
          { text: item.name, callback_data: `${item.code}` } 
        ])
      }
    };

    await this.bot.sendMessage(chatId, 'Оберіть лігу для перегляду турнірної таблиці:', buttons);
  }
}

module.exports = StandingsCommand;
