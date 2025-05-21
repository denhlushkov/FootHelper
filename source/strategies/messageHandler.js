class MessageHandlerStrategy {
  constructor(commandFactory) {
    this.commandFactory = commandFactory;
  }

  handle(msg) {
    const command = msg.text?.trim().toLowerCase();

    if (command?.startsWith('/')) {
      const handler = this.commandFactory.create(command, msg);
      if (handler) {
        return handler.execute();
      }
    }

    return this.commandFactory.bot.sendMessage(msg.chat.id, 'Невідома команда. Напишіть /help');
  }
}

module.exports = MessageHandlerStrategy;
