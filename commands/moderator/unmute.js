const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { findMember, commonModerationEmbed } = require("../../function.js");

module.exports = {
  name: "unmute",
  description: "Unmute a member while the member is in a voice channel.",
  args: 1,
  usage: "<user | user ID> [reason]",
  category: 1,
  permissions: 4194304,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to unmute.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "reason", "The reason of unmuting.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works in a server.");
    const { guild, member: author } = await InteractionResponse.createFakeMessage(client, interaction);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    var reason;
    if (args[1]?.value) reason = args[1].value;
    const embeds = commonModerationEmbed(guild, author.user, member, "unmute", "unmuted", reason);
    try {
      if (reason) await member.voice.setMute(false, reason);
      else await member.voice.setMute(false);
      member.user.send(embeds[0]).catch(() => { });
      return InteractionResponse.sendEmbeds(embeds[1]);
    } catch (err) {
      return InteractionResponse.sendEmbeds(embeds[2]);
    }
  },
  async execute(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0]);
    if (!member) return;
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const embeds = commonModerationEmbed(message.guild, message.author, member, "unmute", "unmuted", reason);
    try {
      if (reason) await member.voice.setMute(false, reason);
      else await member.voice.setMute(false);
      member.user.send(embeds[0]).catch(() => { });
      await message.channel.send(embeds[1]);
    } catch (error) {
      await message.author.send(embeds[2]);
    }
  }
}