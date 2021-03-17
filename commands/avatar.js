const Discord = require("discord.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../classes/Slash.js");
const { findUser, color } = require("../function.js");
module.exports = {
  name: "avatar",
  description: "Display the message author's avatar or the mentioned user's avatar.",
  aliases: ["icon", "pfp"],
  usage: "[user | user ID]",
  category: 6,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "Displays the avatar of this user.")
  ]),
  async slash(client, interaction, args) {
    var user;
    if (args[0]?.value) user = await client.users.fetch(args[0].value);
    else if (interaction.guild_id) user = await client.users.fetch(interaction.member.user.id);
    else user = await client.users.fetch(interaction.user.id);
    if (!user) return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setContent("Failed to find the user."));
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(user.username + "'s avatar: ")
      .setImage(user.displayAvatarURL({ size: 4096 }))
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
      return new InteractionResponse(4).setData(new InteractionApplicationCommandCallbackData().setEmbeds([Embed]));
  },
  async execute(message, args) {
    if (!args[0]) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(message.author.username + "'s avatar: ")
        .setImage(message.author.displayAvatarURL({ size: 4096 }))
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      return await message.channel.send(Embed);
    }
    const user = await findUser(message, args[0]);
    if (!user) return;
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(user.username + "'s avatar: ")
      .setImage(user.displayAvatarURL({ size: 4096 }))
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    return message.channel.send(Embed);
  }
};
