const Discord = require("discord.js");
const { findUser, genPermMsg, color } = require("../../function.js");

module.exports = {
  name: "unwarn",
  description: "Remove all warnings of a member of the server.",
  usage: "<user | user ID>",
  category: 1,
  args: 1,
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permission, 1));
    const user = await findUser(message, args[0]);
    if (!user) return;
    const con = await message.pool.getConnection();
    var [results] = await con.query(`SELECT * FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
    if (results.length == 0) message.channel.send("This user haven't been warned before.");
    else {
      var warningEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Your warnings have been cleared`)
        .setDescription(`In **${message.guild.name}**`)
        .setTimestamp()
        .setFooter("Cleared by " + message.author.tag, message.author.displayAvatarURL());
      user.send(warningEmbed).catch(() => { });
      await con.query(`DELETE FROM warn WHERE user = '${user.id}' AND guild = '${message.guild.id}'`);
      var warnSuccessfulEmbed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("User Successfully Unwarned!")
        .setDescription(`Unwarned **${user.tag}** in server **${message.guild.name}**.`);
      message.author.send(warnSuccessfulEmbed);
      message.delete();
    }
    con.release();
  }
};
