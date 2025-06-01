const Command = require('./command');

class MatchesCommand extends Command {
  constructor(bot, msg, service) {
    super(bot, msg);
    this.service = service; 
  }

  async execute() {
    const chatId = this.msg.chat.id;
    const leaguesData = this.service.getLeagueButtonsData();

    if (leaguesData.length === 0) {
      await this.bot.sendMessage(chatId, 'Наразі немає доступних ліг для перегляду матчів.');
      return;
    }

    const buttons = {
      reply_markup: {
        inline_keyboard: leaguesData.map(item => [
          { text: item.name, callback_data: `fixtures_${item.code}` } 
        ])
      }
    };

    await this.bot.sendMessage(chatId, 'Оберіть лігу для перегляду матчів:', buttons);
  }
}

module.exports = MatchesCommand;