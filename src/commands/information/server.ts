
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color, readableDateTime } from "../../function.js";

class ServerCommand implements FullCommand {
  name = 'server'
  description = 'Displays some server information.'
  category = 6

  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command only works on server.");
    await interaction.reply({ embeds: [await this.createServerEmbed(interaction.guild)] });
  }

  async run(message: NorthMessage) {
    if (!message.guild) return await message.channel.send("This command only works on server.");
    await message.channel.send({ embeds: [await this.createServerEmbed(message.guild)] });
  }

  async createServerEmbed(guild: Discord.Guild) {
    const name = guild.name;
    const id = guild.id;
    const memberCount = guild.memberCount;
    const userMember = await guild.members.fetch();
    let userMemberCount = 0;
    let botMemberCount = 0;
    let onlineMembers = 0;
    let idleMembers = 0;
    let dndMembers = 0;
    for (const member of userMember.values()) {
      if (!member.user.bot) userMemberCount += 1;
      else if (member.user.bot) botMemberCount += 1;
      if (member.presence && member.presence.status === "online") onlineMembers += 1;
      else if (member.presence && member.presence.status === "idle") idleMembers += 1;
      else if (member.presence && member.presence.status === "dnd") dndMembers += 1;
    }
    const roles = guild.roles.cache;
    const roleIDs = [];
    for (const role of roles.values()) {
      if (role.name !== "@everyone")
        roleIDs.push(role.id);
    }
    const createdAt = guild.createdAt
    const owner = userMember.find(x => x.id === guild.ownerId).user.tag;
    const icon = guild.iconURL();
    const region = guild.preferredLocale;
    const createdTime = readableDateTime(createdAt);

    const Embed = new Discord.EmbedBuilder()
      .setTitle("Information of " + name)
      .setColor(color())
      .setThumbnail(icon)
      .addFields([
        { name: "ID", value: id, inline: true },
        { name: "Member statuses", value: `Online: \`${onlineMembers}\`\nIdle: \`${idleMembers}\`\nDo not Disturb: \`${dndMembers}\``, inline: true },
        { name: "Member count", value: `Members: \`${memberCount}\`\nUsers: \`${userMemberCount}\`\nBots: \`${botMemberCount}\``, inline: true },
        { name: "Created", value: createdTime, inline: true },
        { name: "Region", value: region.charAt(0).toUpperCase() + region.slice(1), inline: true },
        { name: "Owner", value: owner, inline: true },
        { name: `Roles [${roleIDs.length}]`, value: (`<@&${roleIDs.join("> <@&")}>`).length < 1024 ? (`<@&${roleIDs.join("> <@&")}>`) : "Too many roles..." }
      ])
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: guild.client.user.displayAvatarURL() });
    return Embed;
  }
}

const cmd = new ServerCommand();
export default cmd;