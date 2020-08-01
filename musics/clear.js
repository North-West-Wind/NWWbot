module.exports = {
  name: "clear",
  description: "Clear the song queue and stop the playing soundtrack. Also resets the volume to 100%.",
  usage: " ",
  music(message, serverQueue, looping, queue, pool) {
    const guild = message.guild;

    if (serverQueue && serverQueue.connection != null && serverQueue.connection.dispatcher)
      serverQueue.connection.dispatcher.destroy();
    if (message.guild.me.voice.channel)
      message.guild.me.voice.channel.leave();
    queue.delete(message.guild.id);
    pool.getConnection((err, con) => {
      if (err)
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      con.query(
        "UPDATE servers SET queue = NULL WHERE id = '" + message.guild.id + "'",
        (err, result) => {
          if (err)
            return message.reply(
              "there was an error trying to update the queue!"
            );
          message.channel.send("Cleared queue!");
        }
      );
      con.release();
    });
  }
};
