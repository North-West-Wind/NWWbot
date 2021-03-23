const Discord = require("discord.js");
const { color, genPermMsg, commonModerationEmbed, findMember } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "unban",
  description: "Unban a member of the server.",
  usage: "<user | user ID> [reason]",
  args: 1,
  category: 1,
  permissions: 4,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to unban.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "reason", "The reason of unbanning.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works in a server.");
    const { guild, member: author } = await InteractionResponse.createFakeMessage(client, interaction);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    var reason;
    if (args[1]?.value) reason = args[1].value;
    const embeds = commonModerationEmbed(guild, author.user, member, "unban", "unbanned", reason);
    try {
      if (reason) await guild.members.unban(member.user, reason);
      else await guild.members.unban(member.user);
      member.user.send(embeds[0]).catch(() => { });
      return InteractionResponse.sendEmbeds(embeds[1]);
    } catch (err) {
      return InteractionResponse.sendEmbeds(embeds[2]);
    }
  },
  async execute(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0])
    if (!member) return;
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const embeds = commonModerationEmbed(message.guild, message.author, member, "unban", "unbanned", reason);
    try {
      if (reason) await message.guild.members.unban(member.user, reason);
      else await message.guild.members.unban(member.user);
      member.send(embeds[0]).catch(() => { });
      await message.channel.send(embeds[1]);
    } catch (err) {
      await message.channel.send(embeds[2]);
    }
  }
};
