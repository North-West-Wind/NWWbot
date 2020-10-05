const Discord = require("discord.js");
const solenolyrics = require("solenolyrics");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "lyrics",
  description: "Display lyrics of songs if they are found.",
  usage: "<song>",
  category: 7,
  async execute(message, args) {
    if(!args[0]) return message.channel.send("You didn't provide any song!" + ` Usage: ${message.client.prefix}${this.name}${this.usage}`);
    
    var lyrics = await solenolyrics.requestLyricsFor(args.join(" "));
    var title = await solenolyrics.requestTitleFor(args.join(" "));
    var author = await solenolyrics.requestAuthorFor(args.join(" "));
    try {
      var icon = await solenolyrics.requestIconFor(args.join(" "));
    } catch(err) {
      var icon = undefined;
    }
    
    if(!author && !title) return message.channel.send("Cannot find the song! Try to be more specific?");
    if(!title) title = "Title Not Found";
    if(!author) author = "No Authors Found";
    if(!lyrics) lyrics = "No lyrics were found";
    
    var lyricsArr = lyrics.split("\n\n");
    if(lyricsArr.length === 1) lyricsArr = lyrics.split("\n");
    var allEmbeds = [];
    for(let i = 0; i < lyricsArr.length; i++) {
      var str = [];
      if(lyricsArr[i].length >= 2048) {
        var oneLine = lyricsArr[i].split("\n");
        for(let s = 0; s < oneLine.length; s++) {
          str = [];
          async function recheck() {
            var tempLength = str.join("\n").length;
            if((isNaN(tempLength) ? 0 : tempLength) + ("\n").length + (oneLine[s] ? oneLine[s].length : 2048) < 2048) {
              str.push(oneLine[s]);
              s++;
              return await recheck();
            }
          }
          recheck();
          var em = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(title)
          .setAuthor(author)
          .setDescription(str.join("\n"))
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          allEmbeds.push(em);
        }
        continue;
      }
      async function recheck() {
        var tempLength = str.join("\n\n").length;
        if((isNaN(tempLength) ? 0 : tempLength) + ("\n\n").length + (lyricsArr[i] ? lyricsArr[i].length : 2048) < 2048) {
          str.push(lyricsArr[i]);
          i++;
          return await recheck();
        } else {
          i--;
        }
      }
      recheck();
      var em = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setAuthor(author)
      .setDescription(str.join("\n\n"))
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      allEmbeds.push(em);
    }
    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };
    if (allEmbeds.length == 1) {
      message.channel.send(allEmbeds[0]);
    } else {
      var s = 0;
      var msg = await message.channel.send(allEmbeds[0]);

      await msg.react("⏮");
      await msg.react("◀");
      await msg.react("▶");
      await msg.react("⏭");
      await msg.react("⏹");
      var collector = await msg.createReactionCollector(filter, {
        idle: 60000,
        errors: ["time"]
      });

      collector.on("collect", function(reaction, user) {
        reaction.users.remove(user.id);
        switch (reaction.emoji.name) {
          case "⏮":
            s = 0;
            msg.edit(allEmbeds[s]);
            break;
          case "◀":
            s -= 1;
            if (s < 0) {
              s = allEmbeds.length - 1;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "▶":
            s += 1;
            if (s > allEmbeds.length - 1) {
              s = 0;
            }
            msg.edit(allEmbeds[s]);
            break;
          case "⏭":
            s = allEmbeds.length - 1;
            msg.edit(allEmbeds[s]);
            break;
          case "⏹":
            collector.emit("end");
            break;
        }
      });
      collector.on("end", function() {
        msg.reactions.removeAll().catch(console.error);
        setTimeout(() => msg.edit({ embed: null, content: `**[Lyrics of ${title}**]` }), 10000);
      });
    }
  }
}