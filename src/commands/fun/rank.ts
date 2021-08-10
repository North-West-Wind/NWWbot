
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { color } from "../../function";
import { RowDataPacket } from "mysql2";

class RankCommand implements SlashCommand {
  name = "rank"
  description = "Display your rank in the server. Leveling system was inspired by MEE6."
  category = 3
  
  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command doesn't support DMs.");
    const [result] = <RowDataPacket[][]> await interaction.client.pool.query(`SELECT * FROM leveling WHERE guild = '${interaction.guild.id}' ORDER BY exp DESC`);
    const rankEmbed = this.createEmbed(interaction.user, interaction.guild, interaction.client, result);
    if (!rankEmbed) return await interaction.reply("Failed to get your ranking!");
    await interaction.reply({embeds: [rankEmbed]});
  }

  async run(message: NorthMessage) {
    if (!message.guild) return await message.channel.send("This command doesn't support DMs.");
    const [result] = <RowDataPacket[][]> await message.pool.query(`SELECT * FROM leveling WHERE guild = '${message.guild.id}' ORDER BY exp DESC`);
    const rankEmbed = this.createEmbed(message.author, message.guild, message.client, result);
    if (!rankEmbed) return await message.channel.send("Failed to get your ranking!");
    await message.channel.send({embeds: [rankEmbed]});
  }

  createEmbed(author: Discord.User, guild: Discord.Guild, client: NorthClient, result: any[]) {
    const user = result.find(x => x.user == author.id);
    if (!user) return null;
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

const cmd = new RankCommand();
export default cmd;