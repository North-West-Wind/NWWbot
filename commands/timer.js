const Discord = require("discord.js");
const { jsDate2Mysql, ms, readableDateTimeText } = require("../function.js");

module.exports = {
  name: "timer",
  description: "Manage your timers on the server.",
  usage: "<subcommand>",
  subcommands: ["create", "edit", "delete"],
  subdesc: ["Create a timer on the server.", "Edit a timer on the server.", "Delete a timer on the server."],
  subusage: [null, "<subcommand> <ID>", 1],
  category: 4,
  args: 1,
  async execute(message, args) {
    if (!this.subcommands.includes(args[0].toLowerCase())) return await message.channel.send(`What is that subcommand? This are the subcommands: **${this.subcommands.join(", ")}**`);
    switch (args[0].toLowerCase()) {
      case "create": return await this.create(message);
      case "edit": return await this.edit(message, args);
      case "delete": return await this.delete(message, args);
    }
  },
  async create(message) {
    let msg = await message.channel.send("What will be the title of the timer?");
    let title = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000, errors: ["time"] }).catch(() => { });
    if (!title || !title.first() || !title.first().content) return message.channel.send("Timed out. You didn't provide the title in time!");
    title.first().delete();
    title = title.first().content;
    msg = await msg.edit("Title received. Which channel you want the timer to be in? Please mention the channel.");
    let channel = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => { });
    if (!channel || !channel.first() || !channel.first().content) return message.channel.send("Timed out. You didn't provide the channel in time!");
    let channelID = channel.first().content.replace(/<#/g, "").replace(/>/g, "");
    let fetchChannel = await message.guild.channels.resolve(channelID);
    channel.first().delete();
    if (!fetchChannel) return message.channel.send("That is not a valid channel!");
    channel = fetchChannel;
    msg = await msg.edit("Channel received. How long do you want the timer to last for? Please enter the duration (example: 10m23s)");
    let time = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => { });
    if (!time || !time.first() || !time.first().content) return message.channel.send("Timed out. You didn't provide the duration in time!");
    let duration = ms(time.first().content);
    time.first().delete();
    if (isNaN(duration)) return message.channel.send("The duration given is not valid!");
    time = duration;
    msg = await msg.edit(`Timer created in <#${channel.id}> with the title **${title}** and will last for **${readableDateTimeText(time)}**`);
    let em = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(title)
      .setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`)
      .setTimestamp()
      .setFooter(`Created by ${message.author.tag}`, message.client.user.displayAvatarURL());
    msg = await channel.send(em);
    let count = 0;
    let id = setInterval(async () => {
      time -= 1000;
      if (time <= 0) {
        clearInterval(id);
        em.setDescription("The timer has ended.");
        try {
          msg = await msg.edit(em);
          message.author.send(`Your timer in **${message.guild.name}** has ended! https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
        } catch (err) { }
        const con = await message.pool.getConnection();
        try {
          var [results] = await con.query(`SELECT * FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`);
          if (results.length < 1) return;
          await con.query(`DELETE FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`);
          console.log("Deleted a timed out timer from the database.");
        } catch (err) {
          console.error(err);
          await message.reply("there was an error trying to delete the timer!");
        }
        con.release();
        console.timers.delete(msg.id);
        return;
      }
      if (count < 4) return ++count;
      em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
      try {
        msg = await msg.edit(em);
      } catch (err) {
        time = 0;
      }
      count = 0;
    }, 1000);
    try {
      await message.pool.query(`INSERT INTO timer(guild, channel, author, msg, title, endAt) VALUES('${message.guild.id}', '${msg.channel.id}', '${message.author.id}', '${msg.id}', '${escape(title)}', '${jsDate2Mysql(new Date(Date.now() + time))}')`);
      await message.channel.send("The timer has been recorded!");
      console.timers.set(msg.id, id);
    } catch (err) {
      console.error(err);
      await message.reply("there was an error trying to record the timer!");
    }
  },
  async edit(message, args) {
    if (!args[1]) return message.channel.send("You didn't provide a message ID!");
    const con = await message.pool.getConnection();
    try {
      var [results] = await con.query(`SELECT * FROM timer WHERE msg='${args[1]}'`);
      if (results.length === 0) return message.channel.send("No timer was found!");
      if (results[0].author != message.author.id) return message.channel.send("This timer is not yours!");
      if (results[0].guild != message.guild.id) return message.channel.send("The timer is not on this server!");
      try {
        let channel = await message.guild.channels.resolve(results[0].channel);
        var mesg = await channel.messages.fetch(results[0].msg);
      } catch (err) {
        return await message.channel.send("Your message was not found!");
      }
      let msg = await message.channel.send("What will be the title of the timer?");
      let title = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000, errors: ["time"] }).catch(() => { });
      if (!title || !title.first() || !title.first().content) return message.channel.send("Timed out. You didn't provide the title in time!");
      title.first().delete();
      title = title.first().content;
      msg = await msg.edit("Title received. Which channel you want the timer to be in? Please mention the channel.");
      let channel = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => { });
      if (!channel || !channel.first() || !channel.first().content) return message.channel.send("Timed out. You didn't provide the channel in time!");
      let channelID = channel.first().content.replace(/<#/g, "").replace(/>/g, "");
      let fetchChannel = await message.guild.channels.resolve(channelID);
      channel.first().delete();
      if (!fetchChannel) return message.channel.send("That is not a valid channel!");
      channel = fetchChannel;
      msg = await msg.edit("Channel received. How much longer do you want the timer to last for? Please enter the duration (example: 10m23s)");
      let time = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => { });
      if (!time || !time.first() || !time.first().content) return message.channel.send("Timed out. You didn't provide the duration in time!");
      let duration = ms(time.first().content);
      time.first().delete();
      if (isNaN(duration)) return message.channel.send("The duration given is not valid!");
      time = duration + results[0].endAt.getTime() - Date.now();
      msg = await msg.edit(`Timer updated in <#${channel.id}> with the title **${title}** and will last for **${readableDateTimeText(time)}**`);
      let em = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle(title)
        .setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`)
        .setTimestamp()
        .setFooter(`Created by ${message.author.tag}`, message.client.user.displayAvatarURL());
      msg = await channel.send(em);
      mesg.delete();
      let count = 0;
      let id = setInterval(async () => {
        time -= 1000;
        if (time <= 0) {
          clearInterval(id);
          em.setDescription("The timer has ended.");
          try {
            msg = await msg.edit(em);
            message.author.send(`Your timer in **${message.guild.name}** has ended! https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
          } catch (err) { }
          const conn = await message.pool.getConnection();
          try {
            await conn.query(`SELECT * FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`);
            if (results.length < 1) throw new Error("Custom");
            await conn.query(`DELETE FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`);
            console.log("Deleted a timed out timer from the database.");
          } catch (err) {
            console.error(err);
            if (err.message !== "Custom") await message.reply("there was an error trying to delete the timer!");
          }
          conn.release();
          console.timers.delete(msg.id);
          return;
        }
        if (count < 4) return ++count;
        em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${readableDateTimeText(time)}**`);
        try {
          msg = await msg.edit(em);
        } catch (err) {
          time = 0;
        }
        count = 0;
      }, 1000);
      con.query(`UPDATE timers SET channel = '${msg.channel.id}', msg = '${msg.id}', title = '${escape(title)}', endAt = '${jsDate2Mysql(new Date(Date.now() + time))}' WHERE msg = '${mesg.id}'`);
      message.channel.send("The timer has been recorded!");
      console.timers.delete(mesg.id);
      console.timers.set(msg.id, id);
    } catch (err) {
      console.error(err);
      await message.reply("there was an error trying to update the timer!");
    }
    con.release();
  },
  async delete(message, args) {
    if (!args[1]) return await message.channel.send("You didn't provide a message ID!");
    const con = await message.pool.getConnection();
    var error = undefined;
    try {
      var [results] = await con.query(`SELECT * FROM timer WHERE msg='${args[1]}'`);
      if (results.length === 0) throw error = await message.channel.send("No timer was found!");
      if (results[0].author != message.author.id) throw error = await message.channel.send("This timer is not yours!");
      if (results[0].guild != message.guild.id) throw error = await message.channel.send("The timer is not on this server!");
      await con.query(`DELETE FROM timers WHERE msg = '${args[1]}' AND author = '${message.author.id}'`);
      await message.channel.send(`Timer ${unescape(results[0].title)} deleted.`);
    } catch (err) {
      if (!error) {
        console.error(err);
        await message.reply("there was an error trying to delete the timer!");
      }
    }
    con.release();
  }
}