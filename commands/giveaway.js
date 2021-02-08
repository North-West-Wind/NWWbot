const Discord = require("discord.js");

const { setTimeout_, jsDate2Mysql, readableDateTime, genPermMsg, ms, readableDateTimeText, findRole } = require("../function.js");
async function setupGiveaway(message, channel, time, item, winnerCount, weight = {}) {
  await message.channel.send(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`);
  const giveawayEmo = console.guilds[message.guild.id]?.giveaway ? console.guilds[message.guild.id].giveaway : "🎉";
  const newDate = new Date(Date.now() + time);
  const newDateSql = jsDate2Mysql(newDate);
  const readableTime = readableDateTime(newDate);
  const color = console.color();
  var Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(item)
    .setDescription(`React with ${giveawayEmo} to participate!\n**${winnerCount} winner${winnerCount > 1 ? "s" : ""}** will win\nThis giveaway will end at: \n**${readableTime}**`)
    .setTimestamp()
    .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
  const giveawayMsg = giveawayEmo + "**GIVEAWAY**" + giveawayEmo;
  var msg = await channel.send(giveawayMsg, Embed);
  await message.pool.query(`INSERT INTO giveaways VALUES('${msg.id}', '${message.guild.id}', '${channel.id}', '${escape(item)}', '${winnerCount}', '${newDateSql}', '${giveawayEmo}', '${message.author.id}', '${color}', '${JSON.stringify(weight)}')`);
  await msg.react(giveawayEmo);
  setTimeout_(async () => {
    const con = await message.pool.getConnection();
    if (msg.deleted) await con.query(`DELETE FROM giveaways WHERE id = '${msg.id}'`);
    else {
      var [res] = await con.query(`SELECT * FROM giveaways WHERE id = '${msg.id}'`);
      if (res.length > 0) {
        const weighted = [];
        const reacted = [];
        for (const user of msg.reactions.cache.get(giveawayEmo).users.cache.values()) {
            const data = user.id;
            reacted.push(data);
        }
        const remove = reacted.indexOf(message.client.user.id);
        if (remove > -1) reacted.splice(remove, 1);
        for (const id of reacted) {
          const member = await message.guild.members.fetch(id);
          for (const role in weight) if (member.roles.cache.find(r => r.id == role)) for (let i = 1; i < weight[role]; i++) weighted.push(id);
          weighted.push(id);
        }
        const Ended = new Discord.MessageEmbed()
          .setColor(console.color())
          .setTitle(item)
          .setDescription("Giveaway ended")
          .setTimestamp()
          .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
        if (weighted.length === 0) {
          Ended.addField("Winner(s)", "Nobody reacted.");
          msg.edit(giveawayMsg, Ended);
          msg.reactions.removeAll().catch(() => { });
          await con.query(`DELETE FROM giveaways WHERE id = '${msg.id}'`);
        } else {
          var index = Math.floor(Math.random() * weighted.length);
          var winners = [];
          var winnerMessage = "";

          for (var i = 0; i < winnerCount; i++) {
            winners.push(weighted[index]);
            weighted.splice(index, 1);
            index = Math.floor(Math.random() * weighted.length);
          }

          for (var i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
          Ended.addField("Winner(s)", winnerMessage);
          msg.edit(giveawayMsg, Ended);
          var link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
          msg.channel.send(`Congratulation, ${winnerMessage}! You won **${item}**!\n${link}`);
          msg.reactions.removeAll().catch(() => { });
          await con.query(`DELETE FROM giveaways WHERE id = '${msg.id}'`);
        }
      }
    }
    con.release();
  }, time);
}

module.exports = {
  name: "giveaway",
  description: "Manage giveaways on the server.",
  args: 1,
  usage: "<subcommand>",
  aliases: ["g"],
  subcommands: ["create", "end", "list"],
  subdesc: ["Create a giveaway on the server.", "End a giveaway on the server.", "List all the giveaways on the server."],
  subusage: ["<subcommand> [channel] [duration] [winner count] [item]", "<subcommand> <ID>"],
  category: 4,
  permission: 18432,
  async execute(message, args) {
    if (args[0] === "create") {
      if (args[1]) {
        if (!args[2]) return await message.channel.send("Please provide the duration if you want to use this command in 1 line.");
        if (!args[3]) return await message.channel.send("Please provide the winner count if you want to use this command in 1 line.");
        if (!args[4]) return await message.channel.send("Please provide the items if you want to use this command in 1 line.");

        const channel = await message.guild.channels.resolve(args[1].replace(/<#/g, "").replace(/>/g, ""));
        if (!channel) return await message.channel.send(args[1] + " is not a valid channel!");
        const permissions = channel.permissionsFor(message.guild.me);
        const userPermission = channel.permissionsFor(message.member);
        if (!permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
        if (!userPermission.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
        const time = ms(args[2]);
        if (!time) return message.channel.send(`The duration **${args[2]}** is invalid!`);
        const winnerCount = parseInt(args[3]);
        if (isNaN(winnerCount)) return message.channel.send(`**${args[3]}** is not a valid winner count!`);
        const item = args.slice(4).join(" ");
        return await setupGiveaway(message, channel, time, item, winnerCount);
      }
      return await this.create(message);
    }
    if (args[0] === "end") return await this.end(message, args);
    if (args[0] === "list") return await this.list(message, args);
  },
  async create(message) {
    const filter = user => user.author.id === message.author.id;
    const guild = message.guild;
    var mesg = await message.channel.send('Giveaway creation started. Type "cancel" to cancel.\n\n`Which channel do you want the giveaway be in? (Please mention the channel)`');
    const collected = await message.channel.awaitMessages(filter, { time: 30000, max: 1 });
    if (collected && collected.first()) await collected.first().delete();
    else return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected.first().content === "cancel") return await mesg.edit("Cancelled giveaway.");
    const channelID = collected.first().content.replace(/<#/, "").replace(/>/, "");
    const channel = guild.channels.resolve(channelID);
    if (!channel) return await mesg.edit(collected.first().content + " is not a valid channel!");
    const permissions = channel.permissionsFor(message.guild.me);
    const userPermission = channel.permissionsFor(message.member);
    if (!permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!userPermission.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    mesg = await mesg.edit("The channel will be <#" + channel.id + ">\n\n`Now please enter the duration of the giveaway!`");
    const collected2 = await message.channel.awaitMessages(filter, { time: 30000, max: 1 });
    if (collected2 && collected2.first()) await collected2.first().delete();
    else return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected2.first().content === "cancel") return mesg.edit("Cancelled giveaway.");
    const duration = ms(collected2.first().content);
    if (isNaN(duration)) return await mesg.edit(`**${collected2.first().content}** is not a valid duration!`);
    mesg = await mesg.edit(`The duration will be**${readableDateTimeText(duration)}** \n\n\`I'd like to know how many participants can win this giveaway. Please enter the winner count.\``);
    const collected3 = await message.channel.awaitMessages(filter, { time: 30000, max: 1 });
    if (collected3 && collected3.first()) await collected3.first().delete();
    else return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected3.first().content === "cancel") return mesg.edit("Cancelled giveaway.");
    if (isNaN(parseInt(collected3.first().content))) return await mesg.edit(`**${collected3.first().content}** is not a valid winner count!`);
    mesg = await mesg.edit(`Alright! **${parseInt(collected3.first().content)}** participant${parseInt(collected3.first().content) > 1 ? "s" : ""} will win the giveaway. \n\n\`Now, please tell me what is going to be given away!\``)
    const collected4 = await message.channel.awaitMessages(filter, { time: 30000, max: 1 })
    if (collected4 && collected4.first()) await collected4.first().delete();
    else return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected4.first().content === "cancel") return await mesg.edit("Cancelled giveaway.");
    await mesg.edit(`The items will be **${collected4.first().content}**\n\n\`At last, please enter the weight for roles and separate them with line breaks. Enter anything else to disable this feature. (Example: @role 10)\`\n\`(The example above means the user with the role will have 10 times more chance to win the giveaway)\``);
    const collected5 = await message.channel.awaitMessages(filter, { time: 30000, max: 1 })
    if (collected5 && collected5.first()) await collected5.first().delete();
    else return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    var weights = collected5.first().content.split("\n");
    weights = weights.filter(x => x != "");
    const weight = {};
    for (const w of weights) {
      const strs = w.split(/ +/);
      const role = await findRole(message, strs[0], true);
      if (!role) continue;
      const we = parseInt(strs[1]);
      if (isNaN(we)) {
        await message.channel.send(`${strs[1]} is not a valid number!`);
        continue;
      }
      weight[role.id] = we;
    }
    setupGiveaway(message, channel, duration, collected4.first().content, parseInt(collected3.first().content), weight);
  },
  async end(message, args) {
    if (!args[1]) return message.channel.send("You didn't provide any message ID!");
    var msgID = args[1];
    const con = await message.pool.getConnection();
    var [result] = await con.query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
    if (result.length != 1 || !result) return message.channel.send("No giveaway was found!");
    if (result[0].author !== message.author.id) return message.channel.send("You cannot end a giveaway that is not hosted by you!");
    try {
      var channel = await message.client.channels.fetch(result[0].channel);
      var msg = await channel.messages.fetch(result[0].id);
      if (msg.deleted) throw new Error("Deleted");
    } catch (err) {
      await message.channel.send("Cannot find channel or message! Maybe it was deleted?");
      if (channel || (msg && msg.deleted)) {
        await con.query("DELETE FROM giveaways WHERE id = " + result[0].id);
        con.release();
        console.log("Deleted an ended giveaway record.");
      }
      return;
    }
    if (!msg) return;
    const fetchUser = await message.client.users.fetch(result[0].author);
    const reacted = await msg.reactions.cache.get(result[0].emoji).users.cache.values().map(x => x.id);
    const remove = reacted.indexOf(message.client.user.id);
    if (remove > -1) {
      reacted.splice(remove, 1);
    }
    const weighted = [];
    const weight = JSON.parse(result[0].weight);
    for (const id of reacted) {
      const member = await message.guild.members.fetch(id);
      for (const role in weight) if (member.roles.cache.find(r => r.id == id)) for (let i = 1; i < weight[role]; i++) weighted.push(id);
      weighted.push(id);
    }
    if (weighted.length === 0) {
      try { await con.query("DELETE FROM giveaways WHERE id = " + msg.id); } catch (err) { console.error(err); };
      const Ended = new Discord.MessageEmbed()
        .setColor(parseInt(result[0].color))
        .setTitle(unescape(result[0].item))
        .setDescription("Giveaway ended")
        .addField("Winner(s)", "None. Cuz no one reacted.")
        .setTimestamp()
        .setFooter("Hosted by " + fetchUser.tag, fetchUser.displayAvatarURL());
      await msg.edit(Ended);
      msg.reactions.removeAll().catch(err => console.error(err));
    } else {
      var index = Math.floor(Math.random() * weighted.length);
      var winners = [];
      var winnerMessage = "";
      var winnerCount = result[0].winner;

      for (var i = 0; i < winnerCount; i++) {
        winners.push(weighted[index]);
        index = Math.floor(Math.random() * weighted.length);
      }
      for (var i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
      const Ended = new Discord.MessageEmbed()
        .setColor(parseInt(result[0].color))
        .setTitle(unescape(result[0].item))
        .setDescription("Giveaway ended")
        .addField("Winner(s)", winnerMessage)
        .setTimestamp()
        .setFooter("Hosted by " + fetchUser.tag, fetchUser.displayAvatarURL());
      msg.edit(Ended);
      const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
      msg.channel.send(`Congratulation, ${winnerMessage}! You won **${unescape(result[0].item)}**!\n${link}`);
      msg.reactions.removeAll().catch(() => { });
      try { await con.query("DELETE FROM giveaways WHERE id = " + msg.id); } catch (err) { console.error(err); };
      await message.channel.send("Ended a giveaway!");
    }
    con.release();
  },
  async list(message) {
    const guild = message.guild;
    var [results] = await message.pool.query(`SELECT * FROM giveaways WHERE guild = '${guild.id}'`)
    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Giveaway list")
      .setDescription("**" + guild.name + "** - " + results.length + " giveaways")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    for (var i = 0; i < Math.min(25, results.length); i++) {
      const readableTime = readableDateTime(new Date(results[i].endAt));
      Embed.addField(readableTime, unescape(results[i].item));
    }
    await message.channel.send(Embed);
  }
};
