const { ApplicationCommand, ApplicationCommandOption, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../classes/Slash");
const { genPermMsg } = require("../function");

module.exports = {
  name: 'announce',
  description: 'Let the bot announce something for you in a specific channel.',
  aliases: ['ann'],
  usage: "<channel | channel ID> <announcement>",
  args: 2,
  category: 0,
  permission: 2048,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description).setOptions([
    new ApplicationCommandOption(7, "channel", "The channel to announce in.").setRequired(true),
    new ApplicationCommandOption(3, "announcement", "The message to be announced.").setRequired(true)
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("This command is only available in servers."));
    const guild = await client.guilds.fetch(interaction.guild_id);
    const member = await guild.members.fetch(interaction.member.user.id);
    const channel = await client.channels.fetch(args[0].value);
    if (!channel) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("The channel is not valid!"));
    if (!channel.permissionsFor(guild.me).has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 1)));
    if (!channel.permissionsFor(member).has(this.permission)) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent(genPermMsg(this.permission, 0)));
    await channel.send(args[1].value);
    return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("Announcement made."));
  },
  async execute(message, args) {
    var channel = await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if (!channel || channel == undefined || channel == null) return await message.channel.send("The channel is not valid!");
    if (!channel.permissionsFor(message.guild.me).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!channel.permissionsFor(message.member).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    await channel.send(args.slice(1).join(" "));
    await message.channel.send("Announcement made.");
  }
}
