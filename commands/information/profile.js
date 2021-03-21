const Discord = require("discord.js");
const { findMember, createEmbedScrolling, readableDateTime, color } = require("../../function.js");
const moment = require("moment");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
require("moment-duration-format")(moment);
module.exports = {
  name: "profile",
  description:
    "Display profile of yourself or the mentioned user on the server.",
  usage: "[user | user ID]",
  category: 6,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user's information to find.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    var member = await guild.members.fetch(args[0]?.value ? args[0].value : interaction.member.user.id);
    const Embed = this.createProfileEmbed(member, client, guild);
    return InteractionResponse.sendEmbeds(Embed);
  },
  async execute(message, args) {
    if (!message.guild) return await message.channel.send("This command only works on server.");
    var member = message.member;
    if (args[0]) member = await findMember(message, args[0]);
    if (!member) return;
    const Embed = this.createProfileEmbed(member, message.client, message.guild);
    await message.channel.send(Embed);
    /*const allEmbeds = [Embed];
    if (member.presence.activities.length > 0) {
      const activityEm = new Discord.MessageEmbed()
        .setTitle("Presence of " + username)
        .setTimestamp()
        .setColor(color())
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      for (const activity of member.presence.activities) {
        const time = Date.now() - activity.createdTimestamp;
        const sec = time / 1000;
        activityEm.addField(activity.type.replace(/_/g, " "), `Name: **${activity.name}**\nDuration: ${moment.duration(sec, "seconds").format()}`);
      }
      allEmbeds.push(activityEm);
    }
    if (allEmbeds.length == 1) await message.channel.send(Embed);
    else await createEmbedScrolling(message, allEmbeds);*/

  },
  createProfileEmbed(member, client, guild) {
    const user = member.user;
    const username = user.username;
    const tag = user.tag;
    const id = user.id;
    const createdAt = user.createdAt;
    const joinedAt = member.joinedAt;
    const nick = member.displayName;
    const status = member.presence.status;
    const createdTime = readableDateTime(createdAt);
    const joinedTime = readableDateTime(joinedAt);
    const Embed = new Discord.MessageEmbed()
      .setTitle("Profile of " + username)
      .setDescription("In server **" + guild.name + "**")
      .setThumbnail(user.displayAvatarURL())
      .addField("ID", id, true)
      .addField("Username", tag, true)
      .addField("Status", status, true)
      .addField("Nickname", nick, true)
      .addField("Created", createdTime, true)
      .addField("Joined", joinedTime, true)
      .setColor(color())
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
  }
};
