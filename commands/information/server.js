const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash.js");
const { twoDigits, color } = require("../../function.js")

module.exports = {
	name: 'server',
	description: 'Display some server information.',
  category: 6,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(_client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    return InteractionResponse.ackknowledge();
  },
  async postSlash(client, interaction) {
    if (!interaction.guild_id) return;
    const message = await InteractionResponse.createFakeMessage(client, interaction);
    await this.execute(message);
  },
	async execute(message) {
    const name = message.guild.name;
    const id = message.guild.id;
    const memberCount = message.guild.memberCount;
    const userMember = await message.guild.members.fetch();
    const userMemberCount = [];
    const botMemberCount = [];
    var onlineMembers = 0;
    var idleMembers = 0;
    var dndMembers = 0;
    for(const member of userMember.values()) {
      if(member.user.bot === false) userMemberCount.push(member.id);
      if(member.user.bot) botMemberCount.push(member.id);
      if (member.presence && member.presence.status === "online") onlineMembers += 1;
      else if (member.presence && member.presence.status === "idle") idleMembers += 1;
      else if (member.presence && member.presence.status === "dnd") dndMembers += 1;
    }
    const roles = message.guild.roles.cache;
    const roleIDs = [];
    for(const role of roles.values()) {
      if(role.name !== "@everyone")
      roleIDs.push(role.id);
    }
    const createdAt = message.guild.createdAt
    const owner = message.guild.owner.user.tag;
    const icon = message.guild.iconURL({ format: "png", dynamic: true});
    const region = message.guild.region;
    
    var date = createdAt.getDate();
        var month = createdAt.getMonth();
        var year = createdAt.getFullYear();
        var hour = createdAt.getHours();
        var minute = createdAt.getMinutes();
        var second = createdAt.getSeconds();
      
      var createdTime =
          twoDigits(date) +
          "/" +
          twoDigits(month + 1) +
          "/" +
          twoDigits(year) +
          " " +
          twoDigits(hour) +
          ":" +
          twoDigits(minute) +
          ":" +
          twoDigits(second) +
          " UTC";
		
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
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    message.channel.send(Embed);
    
	},
};