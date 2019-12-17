const Discord = require("discord.js");
const {prefix} = require("./config.json");
const giveaways = require("discord-giveaways");
 const ms = require("ms"); // npm install ms

module.exports = {
  checkGiveaway: async function(message) {
     if (message.author.bot) return;
    if (message.channel instanceof Discord.DMChannel) return;
    if (!message.content.startsWith(prefix)) return;
     const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
     var found = false;
    if(message.content.startsWith(prefix+"g start")) {
      giveaways.start(message.channel, {
            time: ms(args[1]),
            prize: args.slice(3).join(" "),
            winnersCount: parseInt(args[2]),
         messages: {
        giveaway: "🎉🎉 **GIVEAWAY** 🎉🎉",
        giveawayEnded: "🎉🎉 **GIVEAWAY ENDED** 🎉🎉",
        timeRemaining: "Time remaining: **{duration}**!",
        inviteToParticipate: "React with 🎉 to participate!",
        winMessage: "Congratulations, {winners}! You won **{prize}**!",
        embedFooter: "Giveaways",
        noWinner: "Giveaway cancelled, no valid participations.",
        winners: "winner(s)",
        endedAt: "Ended at",
        units: {
            seconds: "seconds",
            minutes: "minutes",
            hours: "hours",
            days: "days"
        }
    }
        }).then((gData) => {
            console.log(gData); // {...} (messageid, end date and more)
        });
        // And the giveaway has started!
      found = true;
      return found;
    }
    if(message.content.startsWith(prefix+"g list")) {
       let allGiveaways = giveaways.fetch();
       let onServer = allGiveaways.filter((g) => g.guildID === "1909282092");
      found = true;
      return found;
    }
    if(message.content.startsWith(prefix+"g reroll")) {
      let messageID = args[1];
        giveaways.reroll(messageID).then(() => {
            message.channel.send("Success! Giveaway rerolled!");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
      found = true;
      return found;
    }
    if(message.content.startsWith(prefix+"g edit")) {
       let messageID = args[1];
        giveaways.edit(messageID, {
            newWinnersCount: 3,
            newPrize: "New Prize!",
            addTime: 5000
        }).then(() => {
            message.channel.send("Success! Giveaway updated!");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
      found = true;
      return found;
    }
    if(message.content.startsWith(prefix+"g delete")) {
       
        let messageID = args[1];
        giveaways.delete(messageID).then(() => {
            message.channel.send("Success! Giveaway deleted!");
        }).catch((err) => {
            message.channel.send("No giveaway found for "+messageID+", please check and try again");
        });
      found = true;
      return found;
    }
  }
}
