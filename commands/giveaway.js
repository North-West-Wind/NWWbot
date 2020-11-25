const Discord = require("discord.js");

const { setTimeout_, jsDate2Mysql, readableDateTime, genPermMsg, ms, readableDateTimeText } = require("../function.js");
async function setupGiveaway(message, channel, time, item, winnerCount) {
  await message.channel.send(`Created new giveaway in channel <#${channel.id}> for**${readableDateTimeText(time)}** with the item **${item}** and **${winnerCount} winner${winnerCount > 1 ? "s" : ""}**.`);
  const newDate = new Date(Date.now() + time);
  const newDateSql = jsDate2Mysql(newDate);
  const readableTime = readableDateTime(newDate);
  const con = await message.pool.getConnection();
  var [result] = await con.query(`SELECT giveaway FROM servers WHERE id = '${message.guild.id}'`);
  const color = console.color();
  var Embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(item)
    .setDescription(`React with ${result[0].giveaway} to participate!\n**${winnerCount} winner${winnerCount > 1 ? "s" : ""}** will win\nThis giveaway will end at: \n**${readableTime}**`)
    .setTimestamp()
    .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
  const giveawayMsg = result[0].giveaway + "**GIVEAWAY**" + result[0].giveaway;
  var msg = await channel.send(giveawayMsg, Embed);
  await con.query(`INSERT INTO giveaways VALUES('${msg.id}', '${message.guild.id}', '${channel.id}', '${escape(item)}', '${winnerCount}', '${newDateSql}', '${result[0].giveaway}', '${message.author.id}', '${color}')`);
  con.release();
  msg.react(result[0].giveaway);
  setTimeout_(async () => {
    const con = await message.pool.getConnection();
    if (msg.deleted) await con.query(`DELETE FROM giveaways WHERE id = '${msg.id}'`);
    else {
      await con.query(`SELECT * FROM giveaways WHERE id = '${msg.id}'`);
      if (res.length > 0) {
        const reacted = msg.reactions.cache.get(result[0].giveaway).users.cache.values().map(x => x.id);
        const remove = reacted.indexOf(message.client.user.id);
        if (remove > -1) reacted.splice(remove, 1);
        if (reacted.length === 0) {
          await con.query(`DELETE FROM giveaways WHERE id = '${msg.id}'`);
          const Ended = new Discord.MessageEmbed()
            .setColor(console.color())
            .setTitle(item)
            .setDescription("Giveaway ended")
            .addField("Winner(s)", "Nobody reacted.")
            .setTimestamp()
            .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
          msg.edit(giveawayMsg, Ended);
          msg.reactions.removeAll().catch(() => { });
        } else {
          var index = Math.floor(Math.random() * reacted.length);
          var winners = [];
          var winnerMessage = "";

          for (var i = 0; i < winnerCount; i++) {
            winners.push(reacted[index]);
            index = Math.floor(Math.random() * reacted.length);
          }

          for (var i = 0; i < winners.length; i++) winnerMessage += "<@" + winners[i] + "> ";
          const Ended = new Discord.MessageEmbed()
            .setColor(console.color())
            .setTitle(item)
            .setDescription("Giveaway ended")
            .addField("Winner(s)", winnerMessage)
            .setTimestamp()
            .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
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
  description: "Create, end or list giveaways on the server.",
  args: 1,
  usage: "<subcommand>",
  aliases: ["g"],
  subcommands: ["create", "end", "list"],
  category: 4,
  permission: 18432,
  async execute(message, args) {
    const prefix = message.prefix;
    if (args[0] === "create") {
      if (args[1]) {
        await message.channel.send("Single-line `giveaway create` command usage: `" + prefix + this.name + " create <channel> <duration> <winner count> <item>`");
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
    const collected = await message.channel.awaitMessages(filter, { time: 30000, max: 1, errors: ["time"] });
    if (collected && collected.first()) await collected.first().delete();
    else if (!collected.first().content) return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected.first().content === "cancel") return await mesg.edit("Cancelled giveaway.");
    const channelID = collected.first().content.replace(/<#/, "").replace(/>/, "");
    const channel = guild.channels.resolve(channelID);
    if (!channel) {
      collected.first().delete();
      return mesg.edit(collected.first().content + " is not a valid channel!");
    }
    const permissions = channel.permissionsFor(message.guild.me);
    const userPermission = channel.permissionsFor(message.member);
    if (!permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!userPermission.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    collected.first().delete();
    mesg = await mesg.edit("The channel will be <#" + channel.id + ">\n\n`Now please enter the duration of the giveaway!`");
    const collected2 = await message.channel.awaitMessages(filter, { time: 30000, max: 1, errors: ["time"] });
    if (collected2 && collected2.first()) await collected2.first().delete();
    else if (!collected2.first().content) return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected2.first().content === "cancel") return mesg.edit("Cancelled giveaway.");
    const duration = ms(collected2.first().content);
    if (isNaN(duration)) {
      collected2.first().delete();
      return await mesg.edit(`**${collected2.first().content}** is not a valid duration!`);
    }
    collected2.first().delete();
    mesg = await mesg.edit(`The duration will be**${readableDateTimeText(duration)}** \n\n\`I'd like to know how many participants can win this giveaway. Please enter the winner count.\``);
    const collected3 = await message.channel.awaitMessages(filter, { time: 30000, max: 1, errors: ["time"] });
    if (collected3 && collected3.first()) await collected3.first().delete();
    else if (!collected3.first().content) return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected3.first().content === "cancel") return mesg.edit("Cancelled giveaway.");
    if (isNaN(parseInt(collected3.first().content))) {
      collected3.first().delete();
      return await mesg.edit(`**${collected3.first().content}** is not a valid winner count!`);
    }
    collected3.first().delete();
    mesg = await mesg.edit(`Alright! **${parseInt(collected3.first().content)}** participant${parseInt(collected3.first().content) > 1 ? "s" : ""} will win the giveaway. \n\n\`At last, please tell me what is going to be given away!\``)
    const collected4 = await message.channel.awaitMessages(filter, { time: 30000, max: 1, errors: ["time"] })
    if (collected4 && collected4.first()) await collected4.first().delete();
    else if (!collected4.first().content) return await mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected4.first().content === "cancel") return await mesg.edit("Cancelled giveaway.");
    await mesg.edit(`The items will be **${collected4.first().content}**`);
    collected4.first().delete();
    setupGiveaway(message, channel, duration, collected4.first().content, parseInt(collected3.first().content));
  },
  async end(message, args) {
    if (!args[1]) return message.channel.send("You didn't provide any message ID!");
    var msgID = args[1];
    const con = await message.pool.getConnection();
    var [result] = await con.query("SELECT * FROM giveaways WHERE id = '" + msgID + "'");
    if (result.length < 1 || !result) return message.channel.send("No giveaway was found!");
    if (result[0].author !== message.author.id) return message.channel.send("You cannot end a giveaway that is not hosted by you!");
    try {
      var channel = await message.client.channels.fetch(result.channel);
      var msg = await channel.messages.fetch(result.id);
      if (msg.deleted) throw new Error("Deleted");
    } catch (err) {
      if (channel || (msg && msg.deleted)) {
        await con.query("DELETE FROM giveaways WHERE id = " + result.id);
        con.release();
        return console.log("Deleted an ended giveaway record.");
      }
    }
    const fetchUser = await message.client.users.fetch(result[0].author);
    const endReacted = await msg.reactions.cache.get(result[0].emoji).users.cache.values().map(x => x.id);
    const remove = endReacted.indexOf(message.client.user.id);
    if (remove > -1) {
      endReacted.splice(remove, 1);
    }

    if (endReacted.length === 0) {
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
      var index = Math.floor(Math.random() * endReacted.length);
      var winners = [];
      var winnerMessage = "";
      var winnerCount = result[0].winner;

      for (var i = 0; i < winnerCount; i++) {
        winners.push(endReacted[index]);
        index = Math.floor(Math.random() * endReacted.length);
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
