const Command = require('./command');

class ClubCommand extends Command {
  constructor(bot, msg, service) {
    super(bot, msg);
    this.service = service;
  }

  async execute() {
    const chatId = this.msg.chat.id;
    const leaguesData = this.service.getLeagueButtonsData();

    if (leaguesData.length === 0) {
      await this.bot.sendMessage(chatId, 'Наразі немає доступних ліг для перегляду інформації про клуби.');
      return;
    }

    const buttons = {
      reply_markup: {
        inline_keyboard: leaguesData.map(item => [
          { text: item.name, callback_data: `club_select_league:${item.code}` }
        ])
      }
    };

    await this.bot.sendMessage(
      chatId,
      'Будь ласка, виберіть лігу, щоб знайти клуб:',
      buttons
    );
  }
}

module.exports = ClubCommand;