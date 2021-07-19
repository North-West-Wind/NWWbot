const { findMember, genPermMsg } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");

module.exports = {
  name: "nickname",
  description: "Set user's nickname on the server.",
  usage: "<user | user ID> <nickname>",
  aliases: ["nick"],
  category: 0,
  args: 2,
  permissions: 134217728,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to change nickname.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "nickname", "The new nickname of the user.").setRequired(true)
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if(!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    try {
      await member.setNickname(args[1].value);
    } catch(err) {
      NorthClient.storage.error(err);
      return InteractionResponse.sendMessage("Failed to set nickname!");
    }
    return InteractionResponse.sendMessage(`Set **${member.user.tag}**'s nickname to **${args[1].value}**`);
  },
  async execute(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if(!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
		const member = await findMember(message, args[0]);
    if(!member) return;
    try {
      await member.setNickname(args.slice(1).join(" "));
    } catch(err) {
      NorthClient.storage.error(err);
      return message.channel.send("Failed to set nickname!");
    }
    await message.channel.send(`Set **${member.user.tag}**'s nickname to **${args.slice(1).join(" ")}**`);
  }
}