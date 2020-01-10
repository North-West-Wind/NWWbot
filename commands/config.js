const Discord = require("discord.js");
const client = new Discord.Client();

module.exports = {
  name: "config",
  description: "Show configuration of the server.",
  execute(message, args, pool) {
    const guild = message.guild;
    pool.getConnection(function(err, con) {
      con.query("SELECT * FROM servers WHERE id=" + guild.id, function(err, result, fields) {
        console.log(result[0].wel_channel)
        const welcomeChannel = guild.channels.get(result[0].wel_channel);
        const Embed = new Discord.RichEmbed()
        .setTitle("Configuration of " + guild.name)
        .setColor()
        .addField("Welcome message", result[0].welcome, true)
        .addField("Welcome channel", welcomeChannel, true);
        message.channel.send(Embed);
        if(err) throw err;
      });
      
    con.release();
          })
  }
}