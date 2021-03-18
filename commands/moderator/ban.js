const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../../classes/Slash.js");
const { findMember, genPermMsg, commonModerationEmbed } = require("../../function.js");
module.exports = {
  name: "ban",
  description: "Ban a member from the server.",
  args: 1,
  usage: "<user | user ID> [days] [reason]",
  category: 1,
  permissions: 4,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to ban.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "days", "The duration (in days) of getting banned."),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "reason", "The reason of banning the user.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const member = await guild.members.fetch(args[0].value);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(4)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(4)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    if (!member) return InteractionResponse.sendMessage("Cannot find the member.");
    let reason = "";
    var options = {};
    if (args[1]?.value) {
      if (isNaN(parseInt(args[1].value)) || parseInt(args[1].value) > 7 || parseInt(args[1].value) < 0) return InteractionResponse.sendMessage("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
      if (args[2]?.value) reason = args[2].value;
      options = { reason: reason, days: parseInt(args[1]) };
    }
    const embeds = commonModerationEmbed(guild, author.user, member, "ban", "banned", reason);
    try {
      await member.ban(options);
    } catch (err) {
      return InteractionResponse.sendEmbeds(embeds[2]);
    }
    member.user.send(embeds[0]).catch(() => { });
    return InteractionResponse.sendEmbeds(embeds[1]);
  },
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works on server.");
    if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0])
    if (!member) return;
    let reason = "";
    var options = {};
    if (args[1]) {
      if (isNaN(parseInt(args[1])) || parseInt(args[1]) > 7 || parseInt(args[1]) < 0) return message.channel.send("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
      if (args[2]) reason = args.slice(2).join(" ");
      options = { reason: reason, days: parseInt(args[1]) };
    }
    const embeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", reason);
    try {
      await member.ban(options);
    } catch (err) {
      return await message.channel.send(embeds[2]);
    }
    user.send(embeds[0]).catch(() => NorthClient.storage.log("Failed to send DM to " + user.username));
    await message.channel.send(embeds[1]);
  }
};
