const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "addrole",
  description: "Create a new role.",
  args: true,
  usage: "<role name> [color]",
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
    if(!args[1]) {
      message.guild
      .roles.create({ data: {
        name: `${args[0]}`
      }})
      .then(role => console.log(`Created new role with name ${role.name} in server ${message.guild.name}`))
      .catch(console.error);
    } else {
      try {
        message.guild
      .roles.create({ data: {
        name: `${args[0]}`,
        color: args[1]
      }})
      .then(role => console.log(`Created new role with name ${role.name} in server ${message.guild.name}`))
      .catch(console.error);
      } catch(err) {
        const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Failed to Create Role")
      .setDescription(`Failed to create the role **${args[0]}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);
        return;
      }
    }
    
    const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Role Created Successfully")
      .setDescription(`Created a new role **${args[0]}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);
  }
};
