
import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color, query, findUser } from "../../function.js";

export function calculateLevel(exp: number) {
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
  return { level, cost: costs.reduce((a, b) => a + b) }
}

class RankCommand implements FullCommand {
  name = "rank"
  description = "Displays your rank in the server. Leveling system was inspired by MEE6."
  category = 3
  options = [{
    name: "user",
    description: "The user's rank to get.",
    type: "USER",
    required: false
  }];
  
  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command doesn't support DMs.");
    const result = await query(`SELECT * FROM leveling WHERE guild = '${interaction.guild.id}' ORDER BY exp DESC`);
    const rankEmbed = this.createEmbed(interaction.options.getUser("user") || interaction.user, interaction.guild, interaction.client, result);
    if (!rankEmbed) return await interaction.reply("Failed to get your ranking!");
    await interaction.reply({embeds: [rankEmbed]});
  }

  async run(message: NorthMessage, args: string[]) {
    if (!message.guild) return await message.channel.send("This command doesn't support DMs.");
    const result = await query(`SELECT * FROM leveling WHERE guild = '${message.guild.id}' ORDER BY exp DESC`);
    var user = message.author;
    if (args[0]) try { user = await findUser(args[0]); } catch (err: any) { await message.channel.send(err.message); };
    const rankEmbed = this.createEmbed(user, message.guild, message.client, result);
    if (!rankEmbed) return await message.channel.send("Failed to get your ranking!");
    await message.channel.send({embeds: [rankEmbed]});
  }

  createEmbed(user: Discord.User, guild: Discord.Guild, client: NorthClient, results: any[]) {
    const result = results.find(x => x.user == user.id);
    if (!result) return null;
    const exp = parseInt(result.exp);
    const { level, cost } = calculateLevel(exp);
    const everyone = [];
    for (let i = 0; i < results.length; i++) everyone.push(results[i].id);
    const dashes = [];
    for (let i = 0; i < 20; i++) dashes.push("=");
    var percentage = Math.floor((exp / cost) * 100);
    var progress = Math.round(percentage / 5);
    dashes.splice(progress, 1, "+");
    var rank = everyone.indexOf(result.id) + 1;
    const rankEmbed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle(`Rank of **${user.tag}** in **${guild.name}**`)
      .setDescription(`Rank: **${rank}**\nLevel: **${level}**\nMultiplier: **${result.multiplier}**\nOverall Progress: **${exp}** / **${cost}**\n\nProgress to Next Level: \n**${exp}** / **${cost}** - **${percentage}%**\n${level} **${dashes.join("")}** ${(level + 1)}`)
      .setFooter({ text: "Every level requires 50 XP more to level up.", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
    return rankEmbed;
  }
};

const cmd = new RankCommand();
export default cmd;