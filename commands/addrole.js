const Discord = require("discord.js");
const { ApplicationCommand, ApplicationCommandOption, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../classes/Slash");
const { genPermMsg, color } = require("../function");

module.exports = {
  name: "addrole",
  description: "Add a new role to the server. The “color” parameter is optional.",
  args: 1,
  usage: "<role name> [color]",
  category: 0,
  permission: 268435456,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description)
    .setOptions([
      new ApplicationCommandOption(3, "name", "The name of the role.").setRequired(true),
      new ApplicationCommandOption(3, "color", "The color of the role.")
    ]),
  slash: async(client, interaction, args) => {
    if (!interaction.guild_id) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("You cannot use this command in DMs."));
    const guild = await client.guilds.fetch(interaction.guild_id);
    const member = await guild.members.fetch(interaction.member.user.id);
    if (!member.permissions.has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 0)));
    if (!guild.me.permissions.has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 1)));
    if (!args[1]?.value) await guild.roles.create({ data: { name: args[0].value } });
    else {
      try {
        await guild.roles.create({ data: { name: args[0].value, color: args[1].value } });
      } catch (err) {
        const Embed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Failed to Create Role")
          .setDescription(`Failed to create the role **${args[0].value}**`)
          .setTimestamp()
          .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
        return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds([Embed.toJSON()]));
      }
    }
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Role Created Successfully")
      .setDescription(`Created a new role **${args[0].value}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
      return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds([Embed.toJSON()]));
  },
  async execute(message, args) {
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!args[0]) return await message.channel.send("You didn't tell me the role name!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    if (!args[1]) await message.guild.roles.create({ data: { name: args[0] } });
    else {
      try {
        await message.guild.roles.create({ data: { name: args[0], color: args[1] } });
      } catch (err) {
        const Embed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Failed to Create Role")
          .setDescription(`Failed to create the role **${args[0]}**`)
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        return await message.channel.send(Embed);
      }
    }
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Role Created Successfully")
      .setDescription(`Created a new role **${args[0]}**`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    await message.channel.send(Embed);
  }
};
