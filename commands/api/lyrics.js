const Discord = require("discord.js");
const solenolyrics = require("solenolyrics");
const { createEmbedScrolling, color } = require("../../function.js");

module.exports = {
  name: "lyrics",
  description: "Display lyrics of songs if they are found.",
  usage: "<song>",
  category: 7,
  args: 1,
  async execute(message, args) {
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
    const allEmbeds = [];
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
          const em = new Discord.MessageEmbed()
          .setThumbnail(icon)
          .setColor(color())
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
      .setThumbnail(icon)
      .setColor(color())
      .setTitle(title)
      .setAuthor(author)
      .setDescription(str.join("\n\n"))
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      allEmbeds.push(em);
    }
    if (allEmbeds.length == 1) await message.channel.send(allEmbeds[0]);
    else await createEmbedScrolling(message, allEmbeds, 2);
  }
}