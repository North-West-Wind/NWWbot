const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "addrole",
  description: "Create a new role.",
  args: true,
  usage: "<role>",
  execute(message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!message.guild.me.permissions.has('MANAGE_ROLES')) {
      message.channel.send(`I don\'t have the permission to add roles.`)
      return;
    }
    if(!args[0]) {
      return message.channel.send("You didn't tell me the role name!");
    }
    message.guild
      .roles.create({ data: {
        name: `${args[0]}`
      }})
      .then(role => console.log(`Created new role with name ${role.name} in server ${message.guild.name}`))
      .catch(console.error);
    const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Role Created Successfully")
      .setDescription(`Created a new role **${args[0]}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);
  }
};
