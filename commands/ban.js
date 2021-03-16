const Discord = require("discord.js");
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse, InteractionApplicationCommandCallbackData } = require("../classes/Slash.js");
const { findMember, color, genPermMsg } = require("../function.js");
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
  slash: async(client, interaction, args) => {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works in a server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const member = await guild.members.fetch(args[0].value);
    const author = await client.users.fetch(interaction.member.user.id);
    if (!author.permissions.has(4)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(4)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    if (!member) return InteractionResponse.sendMessage("Cannot find the member.");
    let reason = "";
    var options = {};
    if (args[1]?.value) {
      if(isNaN(parseInt(args[1].value)) || parseInt(args[1].value) > 7 || parseInt(args[1].value) < 0) return InteractionResponse.sendMessage("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
      if(args[2]?.value) reason = args[2].value;
      options = { reason: reason, days: parseInt(args[1]) };
    }
    await member.ban(options);
    const banEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`You've been banned`)
      .setDescription(`In **${guild.name}**`)
      .setTimestamp()
      .setFooter(`Banned by ${author.tag}`, author.displayAvatarURL());
    if (reason !== "") banEmbed.addField("Reason", reason);
    member.user.send(banEmbed).catch(() => NorthClient.storage.log("Failed to send DM to " + member.user.username));
    const banSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("User Banned!")
      .setDescription(`Banned **${member.user.tag}** in server **${guild.name}**.`);
    return InteractionResponse.sendEmbeds(banSuccessfulEmbed);
  },
  async execute(message, args) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0])

    if (!member) return;
    let reason = "";
    var options = {};
    if (args[1]) {
      if(isNaN(parseInt(args[1])) || parseInt(args[1]) > 7 || parseInt(args[1]) < 0) return message.channel.send("The number of days of messages to delete provided is not valid. Please provide a number between 0 and 7.")
      if(args[2]) reason = args.slice(2).join(" ");
      options = { reason: reason, days: parseInt(args[1]) };
    }
    await member.ban(options);
    var banEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`You've been banned`)
      .setDescription(`In **${message.guild.name}**`)
      .setTimestamp()
      .setFooter(`Banned by ${message.author.tag}`, message.author.displayAvatarURL());
    if (reason !== "") banEmbed.addField("Reason", reason);
    user.send(banEmbed).catch(() => NorthClient.storage.log("Failed to send DM to " + user.username));
    var banSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("User Banned!")
      .setDescription(`Banned **${user.tag}** in server **${message.guild.name}**.`);
    message.channel.send(banSuccessfulEmbed);
  }
};
