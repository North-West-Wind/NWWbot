const Discord = require("discord.js");
const { shuffleArray } = require("../function.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "shuffle",
  description: "Shuffle the song queue.",
  usage: " ",
  async music(message, serverQueue, looping, queue, pool) {

    if (!serverQueue) return message.channel.send("There is nothing playing.");
    await shuffleArray(serverQueue.songs);
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to connect to the database!");
      con.query(
        "UPDATE servers SET queue = '" +
          escape(JSON.stringify(serverQueue.songs)) +
          "' WHERE id = " +
          message.guild.id,
        function(err, result) {
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
