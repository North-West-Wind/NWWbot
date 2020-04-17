const { exec } = require("child_process");

module.exports = {
  name: "restart",
  description: "Restart the bot",
  aliases: ["re"],
  async execute(message, args) {
    if (message.author.id !== "416227242264363008") return;
    await message.channel.send("Restarted.");
    if (args[0] && args[0] === "full") {
      return exec("enable-pnpm", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
      });
    }
    process.exit(1);
  }
};
