const Command = require('./command');

class MatchesCommand extends Command {
  constructor(bot, msg, proxy) {
    super(bot, msg);
    this.matchProxy = proxy;
  }

  async execute() {
    const chatId = this.msg.chat.id;
    try {
      const matches = await this.matchProxy.getLatestMatches();

      if (!matches.length) {
        return this.bot.sendMessage(chatId, 'Наразі немає активних матчів.');
      }

      const message = matches
        .map(match => `${match.home} vs ${match.away} — ${match.time}`)
        .join('\n');

      await this.bot.sendMessage(chatId, `Останні матчі:\n\n${message}`);
    } catch (err) {
      console.error('Помилка отримання матчів:', err);
      this.bot.sendMessage(chatId, 'Виникла помилка при отриманні матчів.');
    }
  }
}

module.exports = MatchesCommand;
