
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { jsDate2Mysql, readableDateTime, setTimeout_, readableDateTimeText, genPermMsg, findRole, ms, color } from "../../function";
import { RowDataPacket } from "mysql2";
import { globalClient as client } from "../../common";
import { Pool } from "mysql2/promise";

export async function endGiveaway(pool: Pool, result) {
  try {
    var channel = <Discord.TextChannel> await client.channels.fetch(result.channel);
    var msg = await channel.messages.fetch(result.id);
    if (msg.deleted) throw new Error("Deleted");
  } catch (err: any) {
    if (channel || (msg && msg.deleted)) {
      await pool.query("DELETE FROM giveaways WHERE id = " + result.id);
      return console.log("Deleted a deleted giveaway record.");
    }
  }
  const fetchUser = await client.users.fetch(result.author);
  const reacted = [];
  const peopleReacted = msg.reactions.cache.get(unescape(result.emoji));
  try {
    await peopleReacted.users.fetch();
  } catch (err: any) {
    console.error("Giveaway reaction fetching error");
    return console.error(err);
  }
  try {
    for (const user of peopleReacted.users.cache.values()) {
      const data = user.id;
      reacted.push(data);
    }
  } catch (err: any) {
    console.error("Giveaway array init error");
    return console.error(err);
  }

  const remove = reacted.indexOf(client.user.id);
  if (remove > -1) reacted.splice(remove, 1);
  const weighted = [];
  const weight = JSON.parse(result.weight);
  const guild = await client.guilds.fetch(result.guild);
  for (const id of reacted) try {
    const member = await guild.members.fetch(id);
    for (const role in weight) if (member.roles.cache.find(r => r.id == role)) for (let i = 1; i < weight[role]; i++) weighted.push(id);
    weighted.push(id);
  } catch (err: any) { }

  const Ended = new Discord.MessageEmbed()
    .setColor(parseInt(result.color))
    .setTitle(unescape(result.item))
    .setDescription("Giveaway ended")
    .setTimestamp()
    .setFooter("Hosted by " + fetchUser.tag, fetchUser.displayAvatarURL());
  if (weighted.length === 0) {
    Ended.addField("Winner(s)", "None. Cuz no one reacted.")
    await msg.edit({embeds: [Ended]});
    msg.reactions.removeAll().catch(() => { });
    await pool.query("DELETE FROM giveaways WHERE id = " + msg.id);
  } else {
    var index = Math.floor(Math.random() * weighted.length);
    const winners = [];
    var winnerMessage = "";
    const winnerCount = result.winner;
    for (let i = 0; i < winnerCount; i++) {
      const w = weighted[index];
      if (!w) break;
      winners.push(w);
      weighted.splice(index, 1);
      index = Math.floor(Math.random() * weighted.length);
    }
    for (let i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
    Ended.addField("Winner(s)", winnerMessage);
    await msg.edit({embeds: [Ended]});
    const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
    await msg.channel.send(`Congratulation, ${winnerMessage}! You won **${unescape(result.item)}**!\n${link}`);
    msg.reactions.removeAll().catch(() => { });
    await pool.query("DELETE FROM giveaways WHERE id = " + result.id);
  }
}
async function setupGiveaway(message: NorthMessage | NorthInteraction, channel: Discord.TextChannel, time: number, item: string, winnerCount: number, weight = {}) {
    const author = message instanceof Discord.Message ? message.author : message.user;
  const giveawayEmo = NorthClient.storage.guilds[message.guild.id]?.giveaway ? NorthClient.storage.guilds[message.guild.id].giveaway : "🎉";
  const newDate = new Date(Date.now() + time);
  const newDateSql = jsDate2Mysql(newDate);
  const readableTime = readableDateTime(newDate);
  const c = color();
  var Embed = new Discord.MessageEmbed()
    .setColor(c)
    .setTitle(item)
    .setDescription(`React with ${giveawayEmo} to participate!\n**${winnerCount} winner${winnerCount > 1 ? "s" : ""}** will win\nThis giveaway will end at: \n**${readableTime}**${Object.keys(weight).length > 0 ? `\n\n**Weights:**\n${Object.keys(weight).map(x => `<@&${x}> **${weight[x]}**`).join("\n")}` : ""}`)
    .setTimestamp()
    .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
  const giveawayMsg = giveawayEmo + "**GIVEAWAY**" + giveawayEmo;
  var msg = await channel.send({ content: giveawayMsg, embeds: [Embed] });
  await client.pool.query(`INSERT INTO giveaways VALUES('${msg.id}', '${message.guild.id}', '${channel.id}', '${escape(item)}', '${winnerCount}', '${newDateSql}', '${escape(giveawayEmo)}', '${author.id}', '${color}', '${JSON.stringify(weight)}')`);
  await msg.react(giveawayEmo);
  setTimeout_(async () => {
    const [res] = <RowDataPacket[][]> await client.pool.query(`SELECT * FROM giveaways WHERE id = '${msg.id}'`);
    if (res.length == 1) await endGiveaway(client.pool, res[0]);
  }, time);
}

class GiveawayCommand implements SlashCommand {
  name = "giveaway"
  description = "Manage giveaways on the server."
  args = 1
  usage = "<subcommand>"
  aliases = ["g"]
  subcommands = ["create", "end", "list"]
  subdesc = ["Create a giveaway on the server.", "End a giveaway on the server.", "List all the giveaways on the server."]
  subusage = ["<subcommand> <channel> <duration> <winner count> <item>", "<subcommand> <ID>"]
  category = 4
  options = [
      {
          name: "create",
          description: "Creates a giveaway on the server.",
          type: "SUB_COMMAND",
          options: [
              { name: "channel", description: "The channel of the giveaway.", required: true, type: "CHANNEL" },
              { name: "duration", description: "The duration of the giveaway.", required: true, type: "STRING" },
              { name: "winner", description: "The amount of winner of the giveaway.", required: true, type: "INTEGER" },
              { name: "item", description: "The item of the giveaway.", required: true, type: "STRING" },
          ]
      },
      {
          name: "end",
          description: "Ends a giveaway on the server.",
          type: "SUB_COMMAND",
          options: [{ name: "id", description: "The ID of the giveaway message.", required: true, type: "STRING" }]
      },
      {
          name: "list",
          description: "Lists all the giveaways on the server.",
          type: "SUB_COMMAND"
      }
  ]

  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command only works on server.");
    const sub = interaction.options.getSubcommand();
    if (sub === "create") {
      const channel = <Discord.TextChannel> interaction.options.getChannel("channel");
      const time = ms(interaction.options.getString("duration"));
      const winnerCount = interaction.options.getInteger("winner");
      const item = interaction.options.getString("item");
      setupGiveaway(interaction, channel, time, item, winnerCount);
      return await interaction.reply(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`)
    } else if (sub === "end") {
      const msgID = interaction.options.getString("id");
      const [result] = <RowDataPacket[][]> await interaction.client.pool.query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
      if (result.length != 1 || !result) return await interaction.reply("No giveaway was found!");
      if (result[0].author !== interaction.member.user.id) return await interaction.reply("You cannot end a giveaway that is not hosted by you!");
      endGiveaway(interaction.client.pool, result[0]);
      return await interaction.reply("The giveaway is being terminated...");
    } else if (sub === "list") {
      const [results] = <RowDataPacket[][]> await interaction.client.pool.query(`SELECT * FROM giveaways WHERE guild = '${interaction.guild.id}'`)
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Giveaway list")
        .setDescription("**" + interaction.guild.name + "** - " + results.length + " giveaways")
        .setTimestamp()
        .setFooter("Have a nice day! :)", interaction.client.user.displayAvatarURL());
      for (var i = 0; i < Math.min(25, results.length); i++) {
        const readableTime = readableDateTime(new Date(results[i].endAt));
        Embed.addField(readableTime, unescape(results[i].item));
      }
      return await interaction.reply({embeds: [Embed]});
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (args[0] === "create") return await this.create(message, args);
    if (args[0] === "end") return await this.end(message, args);
    if (args[0] === "list") return await this.list(message);
  }

  async create(message: NorthMessage, args: string[]) {
    if (!args[2]) return await message.channel.send("Missing duration!");
    if (!args[3]) return await message.channel.send("Missing winner count!");
    if (!args[4]) return await message.channel.send("Missing items!");

    const channel = <Discord.TextChannel> await message.client.channels.fetch(args[1].replace(/<#/g, "").replace(/>/g, ""));
    if (!channel) return await message.channel.send(args[1] + " is not a valid channel!");
    const permissions = channel.permissionsFor(message.guild.me);
    const userPermission = channel.permissionsFor(message.member);
    if (!permissions.has(BigInt(18432))) return await message.channel.send(genPermMsg(18432, 1));
    if (!userPermission.has(BigInt(18432))) return await message.channel.send(genPermMsg(18432, 0));
    const time = ms(args[2]);
    if (!time) return message.channel.send(`The duration **${args[2]}** is invalid!`);
    const winnerCount = parseInt(args[3]);
    if (isNaN(winnerCount)) return message.channel.send(`**${args[3]}** is not a valid winner count!`);
    const item = args.slice(4).join(" ");
    await message.channel.send(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`)
    return await setupGiveaway(message, channel, time, item, winnerCount);
  }

  async end(message: NorthMessage, args: string[]) {
    if (!args[1]) return message.channel.send("You didn't provide any message ID!");
    const msgID = args[1];
    const [result] = <RowDataPacket[][]> await message.pool.query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
    if (result.length != 1 || !result) return message.channel.send("No giveaway was found!");
    if (result[0].author !== message.author.id) return message.channel.send("You cannot end a giveaway that is not hosted by you!");
    await endGiveaway(message.pool, result[0]);
  }

  async list(message: NorthMessage) {
    const guild = message.guild;
    var [results] = <RowDataPacket[][]> await message.pool.query(`SELECT * FROM giveaways WHERE guild = '${guild.id}'`)
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Giveaway list")
      .setDescription("**" + guild.name + "** - " + results.length + " giveaways")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    for (var i = 0; i < Math.min(25, results.length); i++) {
      const readableTime = readableDateTime(new Date(results[i].endAt));
      Embed.addField(readableTime, unescape(results[i].item));
    }
    await message.channel.send({embeds: [Embed]});
  }
};

const cmd = new GiveawayCommand();
export default cmd;