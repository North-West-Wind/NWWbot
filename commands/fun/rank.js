const Discord = require("discord.js");
const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash");
const { color } = require("../../function");
module.exports = {
  name: "rank",
  description: "Display your rank in the server. However, this command requires a DLC to work. Leveling system was inspired by MEE6.",
  category: 3,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command doesn't support DMs.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await client.users.fetch(interaction.member.user.id);
    const [result] = await client.pool.query(`SELECT * FROM leveling WHERE guild = '${guild.id}' ORDER BY exp DESC`);
    const rankEmbed = this.createEmbed(author, guild, client, result);
    if (rankEmbed.error) return InteractionResponse.sendMessage("Failed to get your ranking!");
    return InteractionResponse.sendEmbeds(rankEmbed);
  },
  async execute(message) {
    if (!message.guild) return await message.channel.send("This command doesn't support DMs.");
    const [result] = await message.pool.query(`SELECT * FROM leveling WHERE guild = '${message.guild.id}' ORDER BY exp DESC`);
    const rankEmbed = this.createEmbed(message.author, message.guild, message.client, result);
    if (rankEmbed.error) return await message.channel.send("Failed to get your ranking!");
    await message.channel.send(rankEmbed);
  },
  createEmbed(author, guild, client, result) {
    const user = result.find(x => x.user == author.id);
    if (!user) return { error: true };
    var expBackup = parseInt(user.exp);
    var exp = parseInt(user.exp);
    var cost = 50;
    var costs = [];
    var level = 0;
    while (exp >= cost) {
      exp -= cost;
      costs.push(cost);
      cost += 50;
      level++;
    }
    costs.push(cost);
    const everyone = [];
    for (let i = 0; i < result.length; i++) everyone.push(result[i].id);
    const dashes = [];
    for (let i = 0; i < 20; i++) dashes.push("=");
    var percentage = Math.floor((exp / cost) * 100);
    var progress = Math.round(percentage / 5);
    dashes.splice(progress, 1, "+");
    var rank = everyone.indexOf(user.id) + 1;
    const rankEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`Rank of **${author.tag}** in **${guild.name}**`)
      .setDescription(`Rank: **${rank}**\nLevel: **${level}**\nOverall Progress: **${expBackup}** / **${costs.reduce((a, b) => a + b)}**\n\nProgress to Next Level: \n**${exp}** / **${cost}** - **${percentage}%**\n${level} **${dashes.join("")}** ${(level + 1)}`)
      .setFooter("Every level requires 50 XP more to level up.", client.user.displayAvatarURL())
      .setTimestamp();
    return rankEmbed;
  }
};
