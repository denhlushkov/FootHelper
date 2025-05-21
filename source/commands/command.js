class Command {
  constructor(bot, msg) {
    this.bot = bot;
    this.msg = msg;
  }

  execute() {
    throw new Error('Execute method must be implemented.');
  }
}

module.exports = Command;
