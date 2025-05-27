const Command = require('../commands/command'); 

class LoggingDecorator extends Command {
  constructor(command, bot, msg) {
    super(bot, msg);
    this.decorCommand = command;
  }

  async execute() {
    const commandName = this.decorCommand.constructor.name;
    const user = this.msg.from.username || this.msg.from.first_name;

    try {
      await this.decorCommand.execute();
      console.log(`[LOG] Command ${commandName} by @${user} finished successfully.`);
    } catch (error) {
      console.error(`[LOG] Command ${commandName} by @${user} failed:`, error.message);
      throw error;
    }
  }
}

module.exports = LoggingDecorator;