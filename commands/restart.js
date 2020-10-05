const { exec } = require("child_process");

module.exports = {
  name: "restart",
  description: "Restart the bot",
  aliases: ["re"],
  category: 10,
  async execute(message, args) {
    if (message.author.id != process.env.DC) return;
    await message.channel.send("Restarted.");
    process.exit(1);
  }
};
