const giveaways = require("discord-giveaways");
const ms = require("ms"); // npm install ms
const Discord = require("discord.js");
const client = new Discord.Client();
giveaways.launch(client, {
  updateCountdownEvery: 5000,
  botsCanWin: false,
  ignoreIfHasPermission: ["MANAGE_MESSAGES", "MANAGE_GUILD", "ADMINISTRATOR"],
  embedColor: "#FF0000",
  embedColorEnd: "#000000",
  reaction: "🎉",
  storage: __dirname + "/giveaways.json"
});
module.exports = {
  name: "giveaway",
  description: "Make some giveaway!",
  aliases: ["g"],
  args: true,
  execute(message, args) {
    const settings = {
      prefix: "?"
    };

    giveaways
      .start(message.channel, {
        time: ms(args[0]),
        prize: args.slice(2).join(" "),
        winnersCount: parseInt(args[1])
      })
      .then(gData => {
        console.log(gData); // {...} (messageid, end date and more)
      });
  }
};
