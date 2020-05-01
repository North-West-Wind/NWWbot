module.exports = {
  name: "clear",
  description: "Clear the song queue.",
  usage: " ",
  music(message, serverQueue, looping, queue, pool) {
    const guild = message.guild;

    if(serverQueue.connection != null && serverQueue.connection.dispatcher)
  serverQueue.connection.dispatcher.destroy();
  if(message.guild.me.voice.channel)
  message.guild.me.voice.channel.leave();
    queue.delete(message.guild.id);
    pool.getConnection((err, con) => {
      if (err)
        return message.reply(
          "there was an error trying to execute that command!"
        );
      con.query(
        "UPDATE servers SET queue = NULL WHERE id = '" + message.guild.id + "'",
        (err, result) => {
          if (err)
            return message.reply(
              "there was an error trying to execute that command!"
            );
          message.channel.send("Cleared queue!");
        }
      );
      con.release();
    });
  }
};
