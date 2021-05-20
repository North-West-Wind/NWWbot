const Discord = require("discord.js");
const { setTimeout_, ms, jsDate2Mysql, readableDateTime, readableDateTimeText, color } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");
const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

async function endPoll(client, con, id, msg, message, title, authorID, options, color) {
  var shouldDel = true;
  try {
    if (!msg || msg.deleted) throw new Error("Poll is deleted");
    shouldDel = false;
    const author = await client.users.fetch(authorID);
    const allOptions = Array.isArray(options) ? options : JSON.parse(options);
    const end = [];
    for (let i = 0; i < allOptions.length; i++) {
      const option = allOptions[i];
      const emoji = emojis[i];
      const reaction = msg.reactions.cache.get(emoji);
      var count = 0;
      if (reaction?.count) count = reaction.count - 1;
      const mesg = `**${count}** - \`${option}\``;
      end.push(mesg);
    }
    const pollMsg = "⬆**Poll**⬇";
    const Ended = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(unescape(title))
      .setDescription(`Poll ended. Here are the results:\n\n\n${end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
      .setTimestamp()
      .setFooter("Hosted by " + author.tag, author.displayAvatarURL());
    msg.edit(pollMsg, Ended);
    const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

    await msg.channel.send("A poll has ended!\n" + link);
    msg.reactions.removeAll().catch(() => { });
    await con.query("DELETE FROM poll WHERE id = " + msg.id);
    if (message) await message.channel.send("Ended a poll!");
  } catch (err) {
    if (shouldDel) {
      await con.query("DELETE FROM poll WHERE id = " + id);
      if (message) await message.channel.send("Ended a poll!");
    } else if (message) await message.reply("there was an error trying to end the poll!");
  }
}

module.exports = {
  name: "poll",
  description: "Manage polls on the server.",
  usage: "<subcommand>",
  subcommands: ["create", "end", "list"],
  subaliases: ["cr", "en", "li"],
  subdesc: ["Create a poll on the server.", "End a poll on the server.", "List all the polls on the server."],
  subusage: [null, "<subcommand> <ID>"],
  category: 4,
  args: 1,
  async execute(message, args) {
    if (!args[0]) return await message.channel.send(`Proper usage: ${message.prefix}${this.name} ${this.usage}\nSubcommands: \`${this.subcommands.join("`, `")}\``);
    if (args[0] === "create") return await this.create(message);
    if (args[0] === "end") return await this.end(message, args);
    if (args[0] === "list") return await this.list(message, args);
  },
  async create(message) {
    const filter = m => m.author.id === message.author.id;
    var msg = await message.channel.send('Starting a poll. Type "cancel" to cancel.\n\n`Please enter where you want to host your poll.(Mention the channel)`');
    const channelCollected = await message.channel.awaitMessages(filter, { time: 30000, max: 1 });
    if (!channelCollected.first()) return await msg.edit("Time's up. Cancelled action.");
    await channelCollected.first().delete();
    if (channelCollected.first().content === "cancel") return await msg.edit("Cancelled poll.");
    const channelID = channelCollected.first().content.replace(/<#/g, "").replace(/>/g, "");
    const channel = await message.guild.channels.resolve(channelID);
    if (!channel) return await msg.edit(channelID + " isn't a valid channel!");
    await msg.edit(`Great! The channel will be ${channel}.\n\n\`Please tell me the title of the poll!\``);
    const collected = await message.channel.awaitMessages(filter, { time: 60000, max: 1 })
    if (!collected.first()) return await msg.edit("Time's up. Cancelled action.");
    await collected.first().delete();
    if (collected.first().content === "cancel") return await msg.edit("Cancelled poll.");
    const title = collected.first().content;
    await msg.edit(`The title will be **${title}**\n\n\`Now, I'd like to know the duration.\``);
    const collected2 = await message.channel.awaitMessages(filter, { time: 30000, max: 1 });
    if (!collected2.first()) return await msg.edit("Time's up. Cancelled action.");
    await collected2.first().delete();
    const duration = ms(collected2.first().content);
    if (isNaN(duration)) return await message.channel.send("**" + collected2.first().content + "** is not a valid duration!");
    await msg.edit(`Alright! The poll will last for**${readableDateTimeText(duration)}**. \n\n\`Last but not least, please enter the options. Please break a line for each options!\``);
    const optionString = await message.channel.awaitMessages(filter, { time: 60000, max: 1 });
    if (!optionString.first()) return msg.edit("Time's up. Cancelled action.");
    await optionString.first().delete();
    if (optionString.first().content === "cancel") return await msg.edit("Cancelled poll.");
    const options = optionString.first().content.replace(/'/g, "#quot;").replace(/"/g, "#dquot;").split("\n");
    if (options.length <= 1) return await message.channel.send("Please provide at least 2 options! Cancelled action.");
    await msg.edit("Nice! **" + options.length + "** options it is!\n\n");
    await message.channel.send(`The poll will be held in channel ${channel} for **${readableDateTimeText(duration)}** with the title **${title}** and the options will be **${optionString.first().content.split("\n").join(", ")}**`);

    var optionArray = [];
    var allOptions = [];
    var num = -1;
    for (let i = 0; i < options.length; i++) try {
      ++num;
      optionArray.push(emojis[num] + " - `" + options[i] + "`");
      allOptions.push(options[i]);
    } catch {
      --num;
    }

    const currentDate = new Date();
    const newDate = new Date(currentDate.getTime() + duration);
    const newDateSql = jsDate2Mysql(newDate);
    const readableTime = readableDateTime(newDate);
    const pollMsg = "⬆**Poll**⬇";
    const color = color();
    const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setDescription(`React with the numbers to vote!\nThis poll will end at:\n**${readableTime}**\n\n\n${optionArray.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')}`)
      .setTimestamp()
      .setFooter("Hosted by " + message.author.tag, message.author.displayAvatarURL());
    var msg = await channel.send(pollMsg, Embed);
    for (var i = 0; i < optionArray.length; i++) await msg.react(emojis[i]);
    for (var i = 0; i < options.length; i++) options[i] = escape(options[i]);
    await message.pool.query(`INSERT INTO poll VALUES(${msg.id}, ${message.guild.id}, ${channel.id}, '["${options.join('", "')}"]', '${newDateSql}', ${message.author.id}, ${color}, '${escape(title)}')`);
    NorthClient.storage.log(`Inserted poll record for ${title} in channel ${channel.name} of server ${message.guild.name}`);
    setTimeout_(async () => {
      const con = await message.pool.getConnection();
      try {
        await endPoll(message.client, con, msg.id, msg, null, title, message.author.id, allOptions, color);
      } catch (err) { }
      con.release();
    }, duration);

  },
  async end(message, args) {
    if (!args[1]) return message.channel.send("Please provide the ID of the message!");
    var msgID = args[1];
    const con = await message.pool.getConnection();
    var [result] = await con.query("SELECT * FROM poll WHERE id = '" + msgID + "'");
    if (result.length == 0) return message.channel.send("No poll was found!");
    if (result[0].author !== message.author.id) return message.channel.send("You cannot end a poll that was not created by you!");
    try {
      const channel = await message.client.channels.fetch(result[0].channel);
      const msg = await channel.messages.fetch(result[0].id);
      await endPoll(message.client, con, result[0].id, msg, message, result[0].title, result[0].author, result[0].options, result[0].color);
    } catch (err) { }
    con.release();
  },
  async list(message) {
    var [results] = await message.pool.query("SELECT * FROM poll WHERE guild = " + message.guild.id);
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Poll list")
      .setDescription("**" + message.guild.name + "** - " + results.length + " polls")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    for (var i = 0; i < Math.min(25, results.length); i++) {
      const newDate = new Date(results[i].endAt);
      const readableTime = readableDateTime(newDate);
      Embed.addField(readableTime, unescape(results[i].title));
    }
    await message.channel.send(Embed);
  },
  endPoll
};
