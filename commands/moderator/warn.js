const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { findMember, genPermMsg, commonModerationEmbed } = require("../../function.js");

module.exports = {
  name: "warn",
  description: "Warn a member of the server. 3 warnings will lead to a ban.",
  args: 1,
  usage: "<user | user ID> [reason]",
  category: 1,
  permission: 4,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to warn.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "reason", "The reason of warning.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works in a server.");
    const { guild, member: author } = await InteractionResponse.createFakeMessage(client, interaction);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    var reason;
    if (args[1]?.value) reason = args[1].value;
    const warnEmbeds = commonModerationEmbed(guild, author.user, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(guild, member, client.pool, reason);
      member.send(warnEmbeds[0]).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(guild, author.user, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.send(banEmbeds[0]).catch(() => { });
        await client.pool.query(`DELETE FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
      }
      return InteractionResponse.sendEmbeds(warnEmbeds[1]);
    } catch (err) {
      return InteractionResponse.sendEmbeds(warnEmbeds[2]);
    }
  },
  async execute(message, args) {
    if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permission, 1));
    const member = await findMember(message, args[0]);
    if (!member) return;
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const warnEmbeds = commonModerationEmbed(message.guild, message.author, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(message.guild, member, message.pool, reason);
      member.send(warnEmbeds[0]).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.send(banEmbeds[0]).catch(() => { });
        await message.pool.query(`DELETE FROM warn WHERE guild = '${message.guild.id}' AND user = '${member.id}'`);
      }
      await message.channel.send(warnEmbeds[1]);
    } catch (err) {
      await message.channel.send(warnEmbeds[2]);
    }
  },
  async warn(guild, member, pool, reason) {
    await pool.query(`INSERT INTO warn VALUES (NULL, '${guild.id}', '${member.id}', '${escape(reason)}')`);
    const [results] = await pool.query(`SELECT * FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
    return results.length;
  }
};
