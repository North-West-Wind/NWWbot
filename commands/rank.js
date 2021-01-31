const Discord = require("discord.js");
module.exports = {
  name: "rank",
  description: "Display your rank in the server. However, this command requires a DLC to work. Leveling system was inspired by MEE6.",
  category: 3,
  async execute(message) {
    if (!message.guild) return await message.channel.send("This command doesn't support DMs.");
    var [result] = await message.pool.query(`SELECT * FROM leveling WHERE guild = '${message.guild.id}' ORDER BY exp DESC`);
    const user = result.find(x => x.user == message.author.id);
    if (!user) throw new Error("Not found");
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
      .setColor(console.color())
      .setTitle(`Rank of **${message.author.tag}** in **${message.guild.name}**`)
      .setDescription(`Rank: **${rank}**\nLevel: **${level}**\nOverall Progress: **${expBackup}** / **${costs.reduce((a, b) => a + b)}**\n\nProgress to Next Level: \n**${exp}** / **${cost}** - **${percentage}%**\n${level} **${dashes.join("")}** ${(level + 1)}`)
      .setFooter("Every level requires 50 XP more to level up.", message.client.user.displayAvatarURL())
      .setTimestamp();
    await message.channel.send(rankEmbed);
  }
};
