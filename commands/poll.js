const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const pollEmbed = require("discord.js-poll-embed");
const client = new Discord.Client();
const ms = require("ms");
module.exports = {
  name: "poll",
  description: "create a poll.",
  usage: "<title> <time> <options>",
  execute(message, args) {
    message.delete();
    if (message.mentions.users.size) {
      return message.reply("I don't accept mentions in the poll!");
    }
    const emojiList = [
      "\u0031\u20E3",
      "\u0032\u20E3",
      "\u0033\u20E3",
      "\u0034\u20E3",
      "\u0035\u20E3",
      "\u0036\u20E3",
      "\u0037\u20E3",
      "\u0038\u20E3",
      "\u0039\u20E3",
      "\uD83D\uDD1F"
    ];
    const defEmojiList = [
      "\u0031\u20E3",
      "\u0032\u20E3",
      "\u0033\u20E3",
      "\u0034\u20E3",
      "\u0035\u20E3",
      "\u0036\u20E3",
      "\u0037\u20E3",
      "\u0038\u20E3",
      "\u0039\u20E3",
      "\uD83D\uDD1F"
    ];
    const forceEndPollEmoji = "\u2705";
    const title = args[0];
    const options = args.slice(2);

    const timeout = ms(args[1]) / 1000;
    const pollEmbed = async (
      msg,
      title,
      options,
      timeout = ms(args[1]) / 1000,
      emojiList = defEmojiList.slice(),
      forceEndPollEmoji = "\u2705"
    ) => {
      if (!msg && !msg.channel) return msg.reply("Channel is inaccessible.");
      if (!title) return msg.reply("Poll title is not given.");
      if (!options) return msg.reply("Poll options are not given.");
      if (options.length < 2)
        return msg.reply("Please provide more than one choice.");
      if (options.length > emojiList.length)
        return msg.reply(`Please provide ${emojiList.length} or less choices.`);
      let minute = Math.floor((timeout % 3600) / 60);
      let hour = Math.floor((timeout % 86400) / 3600);
      let day = Math.floor(timeout / 3600 / 24);
      let second = timeout % 60;
      let text = `*The poll will end in **${day} days ${hour} hours ${minute} minutes ${second} seconds**.\nPlease leave your vote below.*\n\n`;
      const emojiInfo = {};
      for (const option of options) {
        const emoji = emojiList.splice(0, 1);
        emojiInfo[emoji] = { option: option.replace(/_/g, " "), votes: 0 };
        text += `${emoji} : ${option.replace(/_/g, " ")}\n\n`;
      }
      const usedEmojis = Object.keys(emojiInfo);

      const poll = await msg.channel.send(
        embedBuilder(title, msg.author.tag).setDescription(text)
      );
      for (const emoji of usedEmojis) await poll.react(emoji);

      const reactionCollector = poll.createReactionCollector(
        (reaction, user) =>
          usedEmojis.includes(reaction.emoji.name) && !user.bot,
        timeout === 0 ? {} : { time: timeout * 1000 }
      );
      const voterInfo = new Map();
      reactionCollector.on("collect", (reaction, user) => {
        if (usedEmojis.includes(reaction.emoji.name)) {
          if (
            reaction.emoji.name === forceEndPollEmoji &&
            msg.author.id === user.id
          )
            return reactionCollector.stop();
          if (!voterInfo.has(user.id))
            voterInfo.set(user.id, { emoji: reaction.emoji.name });
          const votedEmoji = voterInfo.get(user.id).emoji;
          if (votedEmoji !== reaction.emoji.name) {
            const lastVote = poll.reactions.get(votedEmoji);
            lastVote.count -= 1;
            emojiInfo[votedEmoji].votes -= 1;
            voterInfo.set(user.id, { emoji: reaction.emoji.name });
          }
          emojiInfo[reaction.emoji.name].votes += 1;
        }
      });

      reactionCollector.on("dispose", (reaction, user) => {
        if (usedEmojis.includes(reaction.emoji.name)) {
          voterInfo.delete(user.id);
          emojiInfo[reaction.emoji.name].votes -= 1;
        }
      });

      reactionCollector.on("end", () => {
        text = "*Alright, time's up!*\n\n";
        for (const emoji in emojiInfo)
          text += `\`${emojiInfo[emoji].option}\` - \`${emojiInfo[emoji].votes}\`\n\n`;
        poll.delete();
        msg.channel.send(
          embedBuilder(title, msg.author.tag).setDescription(text)
        );
      });
    };

    const embedBuilder = (title, author) => {
      return new Discord.RichEmbed()
        .setColor(color)
        .setTitle(`Poll - ${title.replace(/_/g, " ")}`)
        .setFooter(`Poll created by ${author}`);
    };
    pollEmbed(message, title, options, timeout, emojiList, forceEndPollEmoji);
  }
};
