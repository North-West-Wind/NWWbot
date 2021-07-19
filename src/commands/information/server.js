const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash.js");
const { twoDigits, color, readableDateTime } = require("../../function.js")

module.exports = {
  name: 'server',
  description: 'Display some server information.',
  category: 6,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.sendEmbeds(await this.createServerEmbed(await client.guilds.fetch(interaction.guild_id)));
  },
  async execute(message) {
    const Embed = await this.createServerEmbed(message.guild);
    message.channel.send(Embed);
  },
  async createServerEmbed(guild) {
    const name = guild.name;
    const id = guild.id;
    const memberCount = guild.memberCount;
    const userMember = await guild.members.fetch();
    const userMemberCount = [];
    const botMemberCount = [];
    var onlineMembers = 0;
    var idleMembers = 0;
    var dndMembers = 0;
    for (const member of userMember.values()) {
      if (member.user.bot === false) userMemberCount.push(member.id);
      if (member.user.bot) botMemberCount.push(member.id);
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
    const owner = guild.owner.user.tag;
    const icon = guild.iconURL({ format: "png", dynamic: true });
    const region = guild.region;
    const createdTime = readableDateTime(createdAt);

    const Embed = new Discord.MessageEmbed()
      .setTitle("Information of " + name)
      .setColor(color())
      .setThumbnail(icon)
      .addField("ID", id, true)
      .addField("Member statuses", `Online: \`${onlineMembers}\`\nIdle: \`${idleMembers}\`\nDo not Disturb: \`${dndMembers}\``, true)
      .addField("Member count", `Members: \`${memberCount}\`\nUsers: \`${userMemberCount.length}\`\nBots: \`${botMemberCount.length}\``, true)
      .addField("Created", createdTime, true)
      .addField("Region", region.charAt(0).toUpperCase() + region.slice(1), true)
      .addField("Owner", owner, true)
      .addField(`Roles [${roleIDs.length}]`, (`<@&${roleIDs.join("> <@&")}>`).length < 1024 ? (`<@&${roleIDs.join("> <@&")}>`) : "Too many roles...")
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    return Embed;
  }
};