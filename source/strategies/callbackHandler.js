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
    let teamId;

    if (callbackData.startsWith('fixtures_')) {
      dataType = 'fixtures';
      leagueCode = callbackData.substring('fixtures_'.length);
    } else if (callbackData.startsWith('topscorers_')) {
      dataType = 'topscorers';
      leagueCode = callbackData.substring('topscorers_'.length);
    } else if (callbackData.startsWith('club_select_league:')) { 
      dataType = 'club_select_league';
      leagueCode = callbackData.split(':')[1];
    } else if (callbackData.startsWith('club_select_team:')) {
      dataType = 'club_select_team';
      const parts = callbackData.split(':');
      leagueCode = parts[1];
      teamId = parts[2];
    } else {
      dataType = 'standings';
      leagueCode = callbackData;
    }

    console.log(`[CallbackQueryHandler] DataType: ${dataType}, LeagueCode: ${leagueCode || 'N/A'}, TeamId: ${teamId || 'N/A'}`);

    try {
      await this.bot.deleteMessage(chatId, messageId); 

      let dataToFormat;
      let title = '';
      let messageContent = ''; 

      if (dataType === 'standings') {
        dataToFormat = await this.service.getLeagueStandings(leagueCode);
        title = `Турнірна таблиця (${leagueCode}):\n\n`;

        if (!dataToFormat || dataToFormat.length === 0) {
          messageContent = 'Немає доступної турнірної таблиці для цієї ліги.';
        } else {
          const tableRows = dataToFormat
            .map((teamData, index) => {
              const teamName = teamData.team && teamData.team.name ? teamData.team.name : 'Невідома команда';
              const teamPoints = teamData.points !== undefined ? teamData.points : 'N/A';
              return `${index + 1}. ${teamName} — ${teamPoints} очок`;
            });
          await this._sendLongMessage(chatId, title, tableRows);
          return;
        }

      } else if (dataType === 'fixtures') {
        dataToFormat = await this.service.getLeagueFixtures(leagueCode);
        title = `Найближчі/Останні матчі (${leagueCode}):\n\n`;

        if (!dataToFormat || dataToFormat.length === 0) {
          messageContent = 'Немає доступних матчів для цієї ліги або вони не були завантажені.';
        } else {
          const MAX_FIXTURES_TO_DISPLAY = 20;
          const fixturesToDisplay = dataToFormat.slice(0, MAX_FIXTURES_TO_DISPLAY);

          const fixtureLines = fixturesToDisplay
            .map(match => `⚽️ ${match.homeTeam} vs ${match.awayTeam}\n🗓 ${match.date} (Статус: ${match.status})`);

          await this._sendLongMessage(chatId, title, fixtureLines, dataToFormat.length > MAX_FIXTURES_TO_DISPLAY);
          return;
        }
      } else if (dataType === 'topscorers') {
        dataToFormat = await this.service.getLeagueTopScorers(leagueCode);
        title = `⚽️ **Найкращі бомбардири ${leagueCode.toUpperCase()}** ⚽️\n\n`;

        if (!dataToFormat || dataToFormat.length === 0) {
          messageContent = `Не вдалося знайти найкращих бомбардирів для ліги ${leagueCode}.`;
        } else {
          const MAX_SCORERS_TO_DISPLAY = 15;
          const scorersToDisplay = dataToFormat.slice(0, MAX_SCORERS_TO_DISPLAY);

          const scorerLines = scorersToDisplay.map((scorer, index) => {
            const playerName = scorer.player ? scorer.player.name : 'Невідомий гравець';
            const teamName = scorer.team ? scorer.team.name : 'Невідома команда';
            const goals = scorer.goals !== undefined ? scorer.goals : 'N/A';
            return `${index + 1}. **${playerName}** (${teamName}) - ${goals} голів`;
          });
          await this._sendLongMessage(chatId, title, scorerLines, dataToFormat.length > MAX_SCORERS_TO_DISPLAY);
          return;
        }
      } else if (dataType === 'club_select_league') { 
        const teams = await this.service.getLeagueTeams(leagueCode);

        if (!teams || teams.length === 0) {
          messageContent = `Не вдалося знайти команди для ліги ${leagueCode}.`;
        } else {
          teams.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          const inlineKeyboard = {
            inline_keyboard: teams.map(team => ([
              { text: team.name, callback_data: `club_select_team:${leagueCode}:${team.id}` }
            ]))
          };

          await this.bot.sendMessage(
            chatId,
            `Оберіть команду з ліги ${leagueCode.toUpperCase()}:`,
            { reply_markup: inlineKeyboard }
          );
          return; 
        }
      } else if (dataType === 'club_select_team') { 
        if (!teamId) {
          messageContent = 'Не вдалося визначити ID команди.';
        } else {
          const { teamInfo, lastMatches } = await this.service.getTeamInfoAndMatches(teamId);

          if (!teamInfo) {
            messageContent = 'Не вдалося отримати інформацію про команду.';
          } else {
            let infoMessage = `⚽️ **Інформація про клуб ${teamInfo.name}** ⚽️\n\n`;
            infoMessage += `*Коротка назва:* ${teamInfo.shortName || 'N/A'}\n`;
            infoMessage += `*Скорочення:* ${teamInfo.tla || 'N/A'}\n`;
            infoMessage += `*Рік заснування:* ${teamInfo.founded || 'N/A'}\n`;
            infoMessage += `*Стадіон:* ${teamInfo.venue || 'N/A'}\n`;
            if (teamInfo.website) {
                infoMessage += `*Сайт:* ${teamInfo.website}\n`;
            }

            infoMessage += `\n🗓 **Останні ${lastMatches.length} матчів:**\n\n`;

            if (lastMatches.length === 0) {
              infoMessage += 'Немає інформації про останні матчі.';
            } else {
              lastMatches.forEach(match => {
                let matchResult = `${match.homeTeam} ${match.score} ${match.awayTeam}`;
                let winnerIndicator = '';
                if (match.winner === 'HOME_TEAM') {
                    winnerIndicator = ` (Перемога ${match.homeTeam})`;
                } else if (match.winner === 'AWAY_TEAM') {
                    winnerIndicator = ` (Перемога ${match.awayTeam})`;
                } else if (match.winner === 'DRAW') {
                    winnerIndicator = ` (Нічия)`;
                }
                infoMessage += `🗓 ${match.date}: ${matchResult}${winnerIndicator}\n`;
              });
            }
            await this._sendLongMessage(chatId, infoMessage, []); 
            return;
          }
        }
      } else {
        messageContent = 'Невідомий тип запиту. Спробуйте ще раз.';
      }

      if (messageContent) {
        await this.bot.sendMessage(chatId, messageContent, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      console.error(`[CallbackQueryHandler] Error handling callback query (${callbackData}):`, err);
      let errorMessage = 'Виникла помилка при завантаженні даних. Спробуйте пізніше.';
      if (err.message.includes('API Rate Limit Exceeded')) {
          errorMessage = 'Вибачте, ліміт запитів до API вичерпано. Будь ласка, спробуйте за хвилину.';
      } else if (err.message.includes('Ліга з кодом')) {
          errorMessage = err.message;
      } else if (err.message.includes('Request failed with status 403')) {
          errorMessage = 'Доступ до даних для цієї ліги обмежений вашим планом API. Спробуйте іншу лігу або оновіть план.';
      } else if (err.message.includes('Request failed with status 404')) {
          errorMessage = 'Дані не знайдено для цього запиту. Можливо, команда не існує або немає доступної інформації.';
      }
      this.bot.sendMessage(chatId, errorMessage);
    } finally {
      await this.bot.answerCallbackQuery(query.id);
    }
  }

  async _sendLongMessage(chatId, title, dataLines, hasMore = false) {
    const MAX_MESSAGE_LENGTH = 4096;
    let currentMessage = title;
    const messagesToSend = [];

    if (dataLines.length === 0 && title.length <= MAX_MESSAGE_LENGTH) {
        await this.bot.sendMessage(chatId, title, { parse_mode: 'Markdown' });
        return;
    } else if (dataLines.length === 0 && title.length > MAX_MESSAGE_LENGTH) {
        await this.bot.sendMessage(chatId, title.substring(0, MAX_MESSAGE_LENGTH), { parse_mode: 'Markdown' });
        if (title.length > MAX_MESSAGE_LENGTH) {
            await this.bot.sendMessage(chatId, '... (повна інформація надто довга)');
        }
        return;
    }


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
        const moreText = '\n\n... (показано не всі дані)';
        if ((lastMessage + moreText).length <= MAX_MESSAGE_LENGTH) {
            messagesToSend[messagesToSend.length - 1] += moreText;
        } else {
            messagesToSend.push(moreText.trim());
        }
    }

    for (const msgText of messagesToSend) {
      await this.bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

module.exports = CallbackQueryHandler;