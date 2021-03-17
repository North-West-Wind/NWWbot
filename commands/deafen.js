const { findMember, genPermMsg, commonModerationEmbed } = require("../function.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash.js");

module.exports = {
  name: "deafen",
  description: "Deafen a member while the member is in a voice channel.",
  usage: "<user | user ID> [reason]",
  aliases: ["deaf"],
  category: 1,
  args: 1,
  permissions: 8388608,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to deafen.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "reason", "The reason of deafening this user.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    if (!member) return InteractionResponse.sendMessage("Cannot find the user.");
    await message.delete();
    var reason;
    if (args[1]?.value) reason = args[1].value;
    const embeds = commonModerationEmbed(guild, author, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send(embeds[0]).catch(() => { });
      return InteractionResponse.sendEmbeds(embeds[1]);
    } catch (error) {
      return InteractionResponse.sendEmbeds(embeds[2]);
    }
  },
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works on server.");
    if (!message.member.permissions.has(this.permissions)) return message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(this.permissions)) return message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0]);

    if (!member) return;
    await message.delete();
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const embeds = commonModerationEmbed(message.guild, message.author, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send(embeds[0]).catch(() => { });
      await message.author.send(embeds[1]);
    } catch (error) {
      await message.author.send(embeds[2]);
    }
  }
}