var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "delrole",
  description: "Delete a role.",
  args: true,
  usage: "<role name>",
  execute(message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    message.guild.roles
      .find(role => role.name === `${args[0]}`)
      .delete()
      .then(role => console.log(`Deleted role ${role.name} in server ${message.guild}`))
      .catch(console.error);

    const Discord = require('discord.js');
    const Embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle("The role is gone!")
      .addField(`A role was deleted: `, `${args[0]}`, true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);

  }
};
