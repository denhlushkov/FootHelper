class CallbackQueryHandler {
  constructor(bot, service) {
    this.bot = bot;
    this.service = service;
  }

  async handle(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const callbackData = query.data;

    let leagueCode;
    let dataType;

    if (callbackData.startsWith('fixtures_')) {
      dataType = 'fixtures';
      leagueCode = callbackData.substring('fixtures_'.length);
    } else {
      dataType = 'standings';
      leagueCode = callbackData;
    }

    console.log(`[CallbackQueryHandler] DataType: ${dataType}, LeagueCode: ${leagueCode}`);

    try {
      await this.bot.deleteMessage(chatId, messageId);

      let dataToFormat;
      let title = '';

      if (dataType === 'standings') {
        dataToFormat = await this.service.getLeagueStandings(leagueCode);
        title = `Турнірна таблиця (${leagueCode}):\n\n`;

        if (!dataToFormat || dataToFormat.length === 0) {
          await this.bot.sendMessage(chatId, 'Немає доступної турнірної таблиці для цієї ліги.');
          return;
        }

        const tableRows = dataToFormat
          .map((team, index) => `${index + 1}. ${team.name} — ${team.points} очок`);
        
        await this._sendLongMessage(chatId, title, tableRows);

      } else if (dataType === 'fixtures') {
        dataToFormat = await this.service.getLeagueFixtures(leagueCode);
        title = `Найближчі/Останні матчі (${leagueCode}):\n\n`;

        if (!dataToFormat || dataToFormat.length === 0) {
          await this.bot.sendMessage(chatId, 'Немає доступних матчів для цієї ліги або вони не були завантажені.');
          return;
        }

        const MAX_FIXTURES_TO_DISPLAY = 20; 
        const fixturesToDisplay = dataToFormat.slice(0, MAX_FIXTURES_TO_DISPLAY);

        const fixtureLines = fixturesToDisplay
          .map(match => `⚽️ ${match.homeTeam} vs ${match.awayTeam}\n🗓 ${match.date} (Статус: ${match.status})`);
        
        await this._sendLongMessage(chatId, title, fixtureLines, dataToFormat.length > MAX_FIXTURES_TO_DISPLAY);

      } else {
          await this.bot.sendMessage(chatId, 'Невідомий тип запиту. Спробуйте ще раз.');
      }

    } catch (err) {
      console.error(`[CallbackQueryHandler] Error handling callback query for ${callbackData}:`, err);
      this.bot.sendMessage(chatId, 'Виникла помилка при завантаженні даних. Спробуйте пізніше.');
    }
  }

  async _sendLongMessage(chatId, title, dataLines, hasMore = false) {
    const MAX_MESSAGE_LENGTH = 4096;
    let currentMessage = title;
    const messagesToSend = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if ((currentMessage + line + '\n\n').length <= MAX_MESSAGE_LENGTH) {
        currentMessage += line + '\n\n';
      } else {
        messagesToSend.push(currentMessage.trim());
        currentMessage = (i === 0 ? title : '') + line + '\n\n';
      }
    }
    if (currentMessage.trim().length > 0) {
      messagesToSend.push(currentMessage.trim());
    }

    if (hasMore) {
        const lastMessage = messagesToSend[messagesToSend.length - 1];
        if ((lastMessage + '\n\n... (показано не всі дані)').length <= MAX_MESSAGE_LENGTH) {
            messagesToSend[messagesToSend.length - 1] += '\n\n... (показано не всі дані)';
        } else {
            messagesToSend.push('... (показано не всі дані)');
        }
    }

    for (const msgText of messagesToSend) {
      await this.bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

module.exports = CallbackQueryHandler;