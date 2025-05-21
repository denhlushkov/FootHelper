const telegramApi = require('node-telegram-bot-api');

const token = '8007962131:AAF8NFQpZAtT-ZC2hpH_A4-2SovIukRIfhY';

const bot = new telegramApi(token, {polling: true});

bot.on('message', async msg => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (text === '/start'){
        return bot.sendMessage(chatId, 'Вітаю тебе в Foot Helper');
    }
});