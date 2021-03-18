const { ApplicationCommand, ApplicationCommandOption, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../../classes/Slash");
const { genPermMsg, commonRoleEmbed } = require("../../function");

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
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("This command only works on server."));
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 0)));
    if (!guild.me.permissions.has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 1)));
    const embeds = commonRoleEmbed(message.client, "create", "created", args[0].value);
    try {
      if (!args[1]?.value) await guild.roles.create({ data: { name: args[0].value } });
      else await guild.roles.create({ data: { name: args[0].value, color: args[1].value } });
      return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds([embeds[0].toJSON()]));
    } catch (err) {
      return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds([embeds[1].toJSON()]));
    }
  },
  async execute(message, args) {
    if (!message.guild) return await message.channel.send("This command only works on server.");
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!args[0]) return await message.channel.send("You didn't tell me the role name!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    const embeds = commonRoleEmbed(message.client, "create", "created", args[0]);
    try {
      if (!args[1]) await message.guild.roles.create({ data: { name: args[0] } });
      else await message.guild.roles.create({ data: { name: args[0], color: args[1] } });
      return await message.channel.send(embeds[0]);
    } catch (err) {
      return await message.channel.send(embeds[1]);
    }
  }
};
