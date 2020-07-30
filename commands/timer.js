const Discord = require("discord.js");
const ms = require("ms");
const { prefix } = require("../config.json");
var color = Math.floor(Math.random() * 16777214) + 1;
const pSql = require("promise-mysql");
const { jsDate2Mysql } = require("../function.js");
const mysql_config = {
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
  connectionLimit: 10,
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPW,
  database: process.env.DBNAME,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: "utf8mb4"
};

module.exports = {
  name: "timer",
  description: "Let the bot countdown for you.",
  usage: "<subcommand>",
  subcommands: ["create", "edit", "delete"],
  async execute(message, args, pool) {
    if(!args[0]) return message.channel.send(`Please choose a subcommand. **${this.subcommands.join(", ")}** Usage: ${prefix}${this.name} ${this.usage}`);
    if(!this.subcommands.includes(args[0])) return message.channel.send(`What is that subcommand? This are the subcommands: **${this.subcommands.join(", ")}**`);
    switch(args[0]) {
      case "create":
        return await this.create(message, pool);
      case "edit":
        
        break;
      case "delete":
        
        break;
    }
  },
  async create(message, pool) {
    let msg = await message.channel.send("What will be the title of the timer?");
    let title = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 60000, errors: ["time"] }).catch(() => {});
    if(!title || !title.first() || !title.first().content) return message.channel.send("Timed out. You didn't provide the title in time!");
    title.first().delete();
    title = title.first().content;
    msg = await msg.edit("Title received. Which channel you want the timer to be in? Please mention the channel.");
    let channel = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => {});
    if(!channel || !channel.first() || !channel.first().content) return message.channel.send("Timed out. You didn't provide the channel in time!");
    let channelID = channel.first().content.replace(/<#/g, "").replace(/>/g, "");
    let fetchChannel = await message.guild.channels.resolve(channelID);
    channel.first().delete();
    if(!fetchChannel) return message.channel.send("That is not a valid channel!");
    channel = fetchChannel;
    msg = await msg.edit("Channel received. How long do you want the timer to last for? Please enter the duration (example: 10m23s)");
    let time = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"] }).catch(() => {});
    if(!time || !time.first() || !time.first().content) return message.channel.send("Timed out. You didn't provide the duration in time!");
    let duration = ms(time.first().content);
    time.first().delete();
    if(isNaN(duration)) return message.channel.send("The duration given is not valid!");
    time = duration;
    let sec = Math.floor(time / 1000);
    var dd = Math.floor(sec / 86400);
    var dh = Math.floor((sec % 86400) / 3600);
    var dm = Math.floor(((sec % 86400) % 3600) / 60);
    var ds = Math.floor(((sec % 86400) % 3600) % 60);
    var d = "";
    var h = "";
    var m = "";
    var s = "";
    if (dd !== 0) {
      d = " " + dd + " days";
    }
    if (dh !== 0) {
      h = " " + dh + " hours";
    }
    if (dm !== 0) {
      m = " " + dm + " minutes";
    }
    if (ds !== 0) {
      s = " " + ds + " seconds";
    }
    msg = await msg.edit(`Timer created in <#${channel.id}> with the title **${title}** and will last for **${d + h + m + s}**`);
    let em = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(title)
    .setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${d+h+m+s}**`)
    .setTimestamp()
    .setFooter(`Created by ${message.author.tag}`, message.client.user.displayAvatarURL());
    msg = await channel.send(em);
    let count = 0;
    let id = setInterval(async() => {
      time -= 1000;
      if(time <= 0) {
        clearInterval(id);
        em.setDescription("The timer has ended.");
        msg = await msg.edit(em);
        message.author.send(`Your timer in **${message.guild.name}** has ended! https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`);
        pool.getConnection((err, con) => {
          if(err) return console.error(err);
          con.query(`SELECT * FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`, (err, results) => {
            if(err) return console.error(err);
            if(results.length < 1) return;
            con.query(`DELETE FROM timer WHERE guild = '${message.guild.id}' AND channel = '${msg.channel.id}' AND author = '${message.author.id}' AND msg = '${msg.id}'`,(err) => {
              if(err) return console.error(err);
              console.log("Deleted a timed out timer from the database.");
            });
          });
          con.release();
        });
        message.client.timers.delete(msg.id);
        return;
      }
      if(count < 4) {
        count++;
        return;
      }
      let sec = Math.floor(time / 1000);
      var dd = Math.floor(sec / 86400);
      var dh = Math.floor((sec % 86400) / 3600);
      var dm = Math.floor(((sec % 86400) % 3600) / 60);
      var ds = Math.floor(((sec % 86400) % 3600) % 60);
      var d = "";
      var h = "";
      var m = "";
      var s = "";
      if (dd !== 0) {
        d = " " + dd + " days";
      }
      if (dh !== 0) {
        h = " " + dh + " hours";
      }
      if (dm !== 0) {
        m = " " + dm + " minutes";
      }
      if (ds !== 0) {
        s = " " + ds + " seconds";
      }
      em.setDescription(`(The timer updates every **5 seconds**)\nThis is a timer and it will last for\n**${d+h+m+s}**`);
      msg = await msg.edit(em);
      count = 0;
    }, 1000);
    try {
      let con = await pSql.createConnection(mysql_config);
      await con.query(`INSERT INTO timer(guild, channel, author, msg, title, endAt) VALUES('${message.guild.id}', '${msg.channel.id}', '${message.author.id}', '${msg.id}', '${escape(title)}', '${jsDate2Mysql(new Date(Date.now() + time))}')`);
      message.channel.send("The timer has been recorded!");
      con.end();
      message.client.timers.set(msg.id, id);
    } catch(err) {
      console.error(err);
      return message.reply("there was an error while inserting the record of the timer to the database!");
    }
  }
}