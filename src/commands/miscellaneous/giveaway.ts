
import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { jsDate2Mysql, readableDateTime, setTimeout_, readableDateTimeText, genPermMsg, ms, color, query, findChannel, msgOrRes, mysqlEscape } from "../../function.js";
import { globalClient as client } from "../../common.js";

export async function endGiveaway(msg: Discord.Message, message: Discord.Message | Discord.CommandInteraction = null) {
  var shouldDel = true;
  try {
    if (!msg) throw new Error("Poll is deleted");
    shouldDel = false;
    const giveaway = NorthClient.storage.giveaways.get(msg.id);
    const peopleReacted = msg.reactions.cache.get(giveaway.emoji);
    var reacted = [...(await peopleReacted.users.fetch()).values()].map(user => user.id);
    var reacted: Discord.Snowflake[];
    const remove = reacted.indexOf(client.user.id);
    if (remove > -1) reacted.splice(remove, 1);
  
    const Ended = msg.embeds[0].setDescription("Giveaway ended");
    if (reacted.length === 0) {
      Ended.addField("Winner(s)", "None. Cuz no one reacted.")
      await msg.edit({ embeds: [Ended] });
      msg.reactions.removeAll().catch(() => { });
      await query("DELETE FROM giveaways WHERE id = " + msg.id);
    } else {
      var index = Math.floor(Math.random() * reacted.length);
      const winners = [];
      var winnerMessage = "";
      const winnerCount = giveaway.winner;
      for (let i = 0; i < winnerCount; i++) {
        const w = reacted[index];
        if (!w) break;
        winners.push(w);
        reacted.splice(index, 1);
        index = Math.floor(Math.random() * reacted.length);
      }
      for (let i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
      Ended.addField("Winner(s)", winnerMessage);
      await msg.edit({ embeds: [Ended] });
      const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
      await msg.channel.send(`Congratulation, ${winnerMessage}! You won **${Ended.title}**!\n${link}`);
      msg.reactions.removeAll().catch(() => { });
      await query("DELETE FROM giveaways WHERE id = " + msg.id);
    }
  } catch (err: any) {
    console.error(err);
    if (shouldDel) {
        await query("DELETE FROM giveaways WHERE id = " + msg.id);
        if (message) await msgOrRes(message, "Ended a poll!");
    } else if (message) await message.reply("There was an error trying to end the poll!");
  }
}
async function setupGiveaway(message: NorthMessage | NorthInteraction, channel: Discord.TextChannel, time: number, item: string, winnerCount: number) {
  const author = message instanceof Discord.Message ? message.author : message.user;
  const giveawayEmo = NorthClient.storage.guilds[message.guild.id]?.giveaway ? NorthClient.storage.guilds[message.guild.id].giveaway : "🎉";
  const newDate = new Date(Date.now() + time);
  const newDateSql = jsDate2Mysql(newDate);
  const readableTime = readableDateTime(newDate);
  const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle(item)
    .setDescription(`React with ${giveawayEmo} to participate!\n**${winnerCount} winner${winnerCount > 1 ? "s" : ""}** will win\nThis giveaway will end at: \n**${readableTime}**`)
    .setTimestamp()
    .setFooter({ text: "Hosted by " + author.tag, iconURL: author.displayAvatarURL() });
  const giveawayMsg = giveawayEmo + "**GIVEAWAY**" + giveawayEmo;
  var msg = await channel.send({ content: giveawayMsg, embeds: [Embed] });
  await query(`INSERT INTO giveaways VALUES('${msg.id}', '${message.guild.id}', '${channel.id}', '${author.id}', '${winnerCount}', '${newDateSql}', ${mysqlEscape(giveawayEmo)})`);
  await msg.react(giveawayEmo);
  setTimeout_(async () => await endGiveaway(await channel.messages.fetch(msg.id)), time);
}

class GiveawayCommand implements FullCommand {
  name = "giveaway"
  description = "Manage giveaways on the server."
  args = 1
  usage = "<subcommand>"
  aliases = ["g"]
  subcommands = ["create", "end", "list"]
  subdesc = ["Creates a giveaway on the server.", "Ends a giveaway on the server.", "Lists all the giveaways on the server."]
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
      const channel = <Discord.TextChannel>interaction.options.getChannel("channel");
      const time = ms(interaction.options.getString("duration"));
      const winnerCount = interaction.options.getInteger("winner");
      const item = interaction.options.getString("item");
      setupGiveaway(interaction, channel, time, item, winnerCount);
      return await interaction.reply(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`)
    } else if (sub === "end") {
      const msgID = interaction.options.getString("id");
      const result = await query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
      if (result.length != 1 || !result) return await interaction.reply("No giveaway was found!");
      if (result[0].author !== interaction.member.user.id) return await interaction.reply("You cannot end a giveaway that is not hosted by you!");
      endGiveaway(result[0]);
      return await interaction.reply("The giveaway is being terminated...");
    } else if (sub === "list") {
      const results = await query(`SELECT * FROM giveaways WHERE guild = '${interaction.guild.id}'`)
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Giveaway list")
        .setDescription("**" + interaction.guild.name + "** - " + results.length + " giveaways")
        .setTimestamp()
        .setFooter({ text: "Have a nice day! :)", iconURL: interaction.client.user.displayAvatarURL() });
      for (var i = 0; i < Math.min(25, results.length); i++) {
        const readableTime = readableDateTime(new Date(results[i].endAt));
        Embed.addField(readableTime, results[i].item);
      }
      return await interaction.reply({ embeds: [Embed] });
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

    const channel = await findChannel(message.guild, args[1].replace(/<#/g, "").replace(/>/g, ""));
    if (!channel || !(channel instanceof Discord.TextChannel)) return await message.channel.send(args[1] + " is not a valid channel!");
    const permissions = channel.permissionsFor(message.guild.me);
    const userPermission = channel.permissionsFor(message.member);
    if (!permissions.has(BigInt(18432))) return await message.channel.send(genPermMsg(18432, 1));
    if (!userPermission.has(BigInt(18432))) return await message.channel.send(genPermMsg(18432, 0));
    const time = ms(args[2]);
    if (!time) return message.channel.send(`The duration **${args[2]}** is invalid!`);
    const winnerCount = parseInt(args[3]);
    if (isNaN(winnerCount)) return message.channel.send(`**${args[3]}** is not a valid winner count!`);
    const item = args.slice(4).join(" ");
    await setupGiveaway(message, channel, time, item, winnerCount);
    await message.channel.send(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`);
  }

  async end(message: NorthMessage, args: string[]) {
    if (!args[1]) return message.channel.send("You didn't provide any message ID!");
    const msgID = args[1];
    const result = await query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
    if (result.length != 1 || !result) return message.channel.send("No giveaway was found!");
    if (result[0].author !== message.author.id) return message.channel.send("You cannot end a giveaway that is not hosted by you!");
    await endGiveaway(result[0]);
  }

  async list(message: NorthMessage) {
    const guild = message.guild;
    var results = await query(`SELECT * FROM giveaways WHERE guild = '${guild.id}'`)
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Giveaway list")
      .setDescription("**" + guild.name + "** - " + results.length + " giveaways")
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
    for (var i = 0; i < Math.min(25, results.length); i++) {
      const readableTime = readableDateTime(new Date(results[i].endAt));
      Embed.addField(readableTime, results[i].item);
    }
    await message.channel.send({ embeds: [Embed] });
  }
};

const cmd = new GiveawayCommand();
export default cmd;