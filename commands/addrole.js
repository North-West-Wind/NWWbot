const Discord = require("discord.js");

module.exports = {
  name: "addrole",
  description: "Add a new role to the server. The “color” parameter is optional.",
  args: 1,
  usage: "<role name> [color]",
  category: 0,
  permission: 268435456,
  async execute(message, args) {
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(console.genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(this.permission)) return await message.channel.send(console.genPermMsg(this.permission, 1));
    if (!args[0]) return await message.channel.send("You didn't tell me the role name!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    if (!args[1]) await message.guild.roles.create({ data: { name: args[0] } });
    else {
      try {
        await message.guild.roles.create({ data: { name: args[0], color: args[1] } });
      } catch (err) {
        const Embed = new Discord.MessageEmbed()
          .setColor(console.color())
          .setTitle("Failed to Create Role")
          .setDescription(`Failed to create the role **${args[0]}**`)
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        return await message.channel.send(Embed);
      }
    }
    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Role Created Successfully")
      .setDescription(`Created a new role **${args[0]}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    await message.channel.send(Embed);
  }
};
