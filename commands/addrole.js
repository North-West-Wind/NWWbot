const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "addrole",
  description: "Create a new role.",
  args: true,
  usage: "<role name>",
  execute(message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) {
      message.reply(`you don\'t have the permission to use this command.`);
      return;
    }
    message.guild
      .createRole({
        name: `${args[0]}`
      })
      .then(role => console.log(`Created new role with name ${role.name}`))
      .catch(console.error);
    const Embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle("Yay! New role!")
      .addField(`A new role was created: `, `${args[0]}`, true)
      .addBlankField()
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);
  }
};
