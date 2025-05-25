class CallbackQueryHandler {
  constructor(bot, service) {
    this.bot = bot;
    this.service = service;
  }

  async handle(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const leagueCode = query.data; 

    try {
      await this.bot.deleteMessage(chatId, messageId);

      const standings = await this.service.getLeagueStandings(leagueCode);

      if (!standings.length) {
        return this.bot.sendMessage(chatId, 'Немає доступної турнірної таблиці для цієї ліги.');
      }

      const table = standings
        .map((team, index) =>
          `${index + 1}. ${team.name} — ${team.points} очок`
        )
        .join('\n');

      await this.bot.sendMessage(chatId, `Турнірна таблиця:\n\n${table}`);
    } catch (err) {
      console.error('Помилка callbackHandler:', err);
      this.bot.sendMessage(chatId, 'Виникла помилка при завантаженні таблиці.');
    }
  }
}

module.exports = CallbackQueryHandler;
