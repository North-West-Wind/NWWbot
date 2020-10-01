const Discord = require("discord.js");
const { shuffleArray } = require("../function.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "shuffle",
  description: "Shuffle the song queue.",
  usage: " ",
  async music(message, serverQueue, queue, pool) {
    if (!serverQueue || serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to shuffle the queue when the bot is playing!");
    if(serverQueue.playing) await shuffleArray(serverQueue.songs, 1);
    else await shuffleArray(serverQueue.songs, 0);
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to connect to the database!");
      con.query(
        "UPDATE servers SET queue = '" +
          escape(JSON.stringify(serverQueue.songs)) +
          "' WHERE id = " +
          message.guild.id,
        function(err) {
          if (err)
            return message.reply(
              "there was an error trying to update the queue!"
            );
          console.log("Updated song queue of " + message.guild.name);
        }
      );
      con.release();
    });
    message.channel.send("Song queue has been shuffled.");
  }
};
