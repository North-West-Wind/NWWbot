module.exports = {
  name: "clear",
  description: "Clear the song queue.",
  usage: " ",
  music(message, serverQueue, looping, queue, pool) {
    const guild = message.guild;
    if (serverQueue.playing) {
      return message.channel.send("The music must be stopped first.");
    }

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
