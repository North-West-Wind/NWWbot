const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const client = new Discord.Client();
const { ms } = require("../function.js");

const { twoDigits, setTimeout_ } = require("../function.js");

module.exports = {
  name: "poll",
  description: "Create, end or list giveaways on the server.",
  usage: "<subcommand>",
  subcommands: ["create", "end", "list"],
  category: 4,
  async execute(message, args, pool) {
    if (!args[0]) {
      return message.channel.send(
        `Proper usage: ${message.client.prefix}${this.name} ${
          this.usage
        }\nSubcommands: \`${this.subcommands.join("`, `")}\``
      );
    }

    if (args[0] === "create") {
      return await this.create(message, args, pool);
    }
    if (args[0] === "end") {
      return await this.end(message, args, pool);
    }
    if (args[0] === "list") {
      return await this.list(message, args, pool);
    }
  },
  async create(message, args, pool) {
    const filter = m => m.author.id === message.author.id;
    pool.getConnection(async function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      var msg = await message.channel.send(
        'Starting a poll. Type "cancel" to cancel.\n\n`Please enter where you want to host your poll.(Mention the channel)`'
      );
      var channelCollected = await message.channel
        .awaitMessages(filter, {
          time: 30000,
          max: 1,
          error: ["error"]
        })
        .catch(err => msg.edit("Time's up. Cancelled action."));
      if(!channelCollected.first()) return msg.edit("Time's up. Cancelled action.");
      if (channelCollected.first().content === "cancel") {
        await channelCollected.first().delete();
        return msg.edit("Cancelled poll.");
      }
      var channelID = channelCollected
        .first()
        .content.replace(/<#/g, "")
        .replace(/>/g, "");
      var channel = await message.guild.channels.resolve(channelID);
      if (!channel || channel === undefined || channel === null) {
        channelCollected.first().delete();
        return msg.edit(channelID + " isn't a valid channel!");
      }
      await channelCollected.first().delete();
      await msg.edit(
        "Great! The channel will be <#" +
          channel +
          ">.\n\n`Please tell me the title of the poll!`"
      );
      var collected = await message.channel
        .awaitMessages(filter, {
          time: 60000,
          max: 1,
          error: ["time"]
        })
        .catch(err => msg.edit("Time's up. Cancelled action."));
      if(!collected.first()) return msg.edit("Time's up. Cancelled action.");
      if (collected.first().content === "cancel") {
        await collected.first().delete();
        return msg.edit("Cancelled poll.");
      }
      var title = collected.first().content;
      await collected.first().delete();
      await msg.edit(
        "The title will be **" +
          title +
          "**\n\n`Now, I'd like to know the duration.`"
      );
      var collected2 = await message.channel
        .awaitMessages(filter, {
          time: 30000,
          max: 1,
          error: ["time"]
        })
        .catch(err => msg.edit("Time's up. Cancelled action."));
      if (!collected2.first())
        msg.edit("Time's up. Cancelled action.");
      if (collected2.first().content === "cancel") {
        await collected2.first().delete();
        return msg.edit("Cancelled poll.");
      }
      var time = ms(collected2.first().content);
      var duration = ms(collected2.first().content);
      if (isNaN(time)) {
        collected2.first().delete();
        return message.channel.send(
          "**" + collected2.first().content + "** is not a valid duration!"
        );
      }
      var sec = duration / 1000;
      var dd = Math.floor(sec / 86400);
      var dh = Math.floor((sec % 86400) / 3600);
      var dm = Math.floor(((sec % 86400) % 3600) / 60);
      var ds = Math.floor(((sec % 86400) % 3600) % 60);
      var dmi = Math.floor(
        duration - dd * 86400000 - dh * 3600000 - dm * 60000 - ds * 1000
      );
      var d = "";
      var h = "";
      var m = "";
      var s = "";
      var mi = "";
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
      if (dmi !== 0) {
        mi = " " + dmi + " milliseconds";
      }
      await collected2.first().delete();
      await msg.edit(
        "Alright! The poll will last for**" +
          d +
          h +
          m +
          s +
          mi +
          "**. \n\n`Last but not least, please enter the options. Please break a line for each options!`"
      );
      var optionString = await message.channel
        .awaitMessages(filter, {
          time: 60000,
          max: 1,
          error: ["time"]
        })
        .catch(err => msg.edit("Time's up. Cancelled action."));
      if(!optionString.first()) return msg.edit("Time's up. Cancelled action.");
      if (optionString.first().content === "cancel") {
        await optionString.first().delete();
        return msg.edit("Cancelled poll.");
      }

      var options = optionString
        .first()
        .content.replace(/'/g, "#quot;")
        .replace(/"/g, "#dquot;")
        .split("\n");
      if (options.length <= 1) {
        optionString.first().delete();
        return message.channel.send(
          "Please provide at least 2 options! Cancelling action..."
        );
      }
      await optionString.first().delete();
      await msg.edit("Nice! **" + options.length + "** options it is!\n\n");
      await message.channel.send(
        "The poll will be held in channel <#" +
          channel +
          "> for **" +
          d +
          h +
          m +
          s +
          mi +
          "** with the title **" +
          title +
          "** and the options will be **" +
          optionString
            .first()
            .content.split("\n")
            .join(", ") +
          "**"
      );

      var emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      var optionArray = [];
      var allOptions = [];
      var num = -1;
      for (var i = 0; i < options.length; i++) {
        try {
          ++num;
          optionArray.push(emojis[num] + " - `" + options[i] + "`");
          allOptions.push(options[i]);
        } catch {
          --num;
        }
      }

      var currentDate = new Date();
      var newDate = new Date(currentDate.getTime() + time);

      var date = newDate.getDate();
      var month = newDate.getMonth();
      var year = newDate.getFullYear();
      var hour = newDate.getHours();
      var minute = newDate.getMinutes();
      var second = newDate.getSeconds();

      var newDateSql =
        year +
        "-" +
        twoDigits(month + 1) +
        "-" +
        twoDigits(date) +
        " " +
        twoDigits(hour) +
        ":" +
        twoDigits(minute) +
        ":" +
        twoDigits(second);
      var readableTime =
        twoDigits(date) +
        "/" +
        twoDigits(month + 1) +
        "/" +
        twoDigits(year) +
        " " +
        twoDigits(hour) +
        ":" +
        twoDigits(minute) +
        ":" +
        twoDigits(second) +
        " UTC";
      var pollMsg = "⬆**Poll**⬇";
      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(
          "React with the numbers to vote!\nThis poll will end at:\n**" +
            readableTime +
            "**\n\n\n" +
            optionArray
              .join("\n\n")
              .replace(/#quot;/g, "'")
              .replace(/#dquot;/g, '"')
        )
        .setTimestamp()
        .setFooter(
          "Hosted by " +
            message.author.username +
            "#" +
            message.author.discriminator,
          message.author.displayAvatarURL()
        );
      var msg = await channel.send(pollMsg, Embed);
      for (var i = 0; i < optionArray.length; i++) {
        await msg.react(emojis[i]);
      }
      for (var i = 0; i < options.length; i++) {
        options[i] = escape(options[i]);
      }

      con.query(
        "INSERT INTO poll VALUES(" +
          msg.id +
          ", " +
          message.guild.id +
          ", " +
          channel.id +
          `, '["` +
          options.join('", "') +
          `"]', "` +
          newDateSql +
          '", ' +
          message.author.id +
          ", " +
          color +
          ", '" +
          escape(title) +
          "')",
        function(err) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to insert the record!"
            );
          }
          console.log(
            "Inserted poll record for " +
              title +
              " in channel " +
              channel.name +
              " of server " +
              message.guild.name
          );
        }
      );

      setTimeout_(async function() {
        if (msg.deleted === true) {
          con.query("DELETE FROM poll WHERE id = " + msg.id, function(
            err,
            result
          ) {
            if (err) {
              console.error(err);
              return;
            }
            console.log("Deleted an ended poll.");
          });
          return;
        } else {
          con.query("SELECT * FROM poll WHERE id = " + msg.id, async function(
            err,
            results
          ) {
            if (err) {
              console.error(err);
              return;
            }
            if (results.length < 1) {
              return;
            } else {
              var result = [];
              var end = [];
              for (const emoji of msg.reactions.cache.values()) {
                await result.push(emoji.count);
                var mesg =
                  "**" +
                  (emoji.count - 1) +
                  "** - `" +
                  allOptions[result.length - 1] +
                  "`";
                await end.push(mesg);
              }

              const Ended = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .setDescription(
                  "Poll ended. Here are the results:\n\n\n" +
                    end
                      .join("\n\n")
                      .replace(/#quot;/g, "'")
                      .replace(/#dquot;/g, '"')
                )
                .setTimestamp()
                .setFooter(
                  "Hosted by " +
                    message.author.username +
                    "#" +
                    message.author.discriminator,
                  message.author.displayAvatarURL()
                );
              msg.edit(pollMsg, Ended);
              var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

              msg.channel.send("A poll has ended!\n" + link);
              msg.reactions.removeAll().catch(err => {
                console.error(err);
              });
              con.query("DELETE FROM poll WHERE id = " + msg.id, function(
                err
              ) {
                if (err) {
                  console.error(err);
                  return;
                }
                console.log("Deleted an ended poll.");
              });
            }
          });
        }
      }, time);

      con.release();
    });
  },
  async end(message, args, pool) {
    if (!args[1]) {
      return message.channel.send("Please provide the ID of the message!");
    }
    var msgID = args[1];
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query("SELECT * FROM poll WHERE id = '" + msgID + "'", async function(
        err,
        result,
        fields
      ) {
        if (err) {
          console.error(err);
          return message.reply(
            "there was an error trying to execute that command!"
          );
        }
        if (result.length == 0) {
          return message.channel.send("No poll was found!");
        }
        if (result[0].author !== message.author.id) {
          return message.channel.send(
            "You cannot end a poll that was not created by you!"
          );
        }

        var channel = await message.client.channels.fetch(result[0].channel);
        try {
          var msg = await channel.messages.fetch(result[0].id);
        } catch (err) {
          con.query("DELETE FROM poll WHERE id = " + result[0].id, function(
            err,
            con
          ) {
            if (err) {
              console.error(err);
              return message.reply(
                "there was an error trying to execute that command!"
              );
            }
            console.log("Deleted an ended poll.");
          });
          return;
        }
        var author = await message.client.users.fetch(result[0].author);
        var allOptions = await JSON.parse(result[0].options);

        var pollResult = [];
        var end = [];
        for (const emoji of msg.reactions.cache.values()) {
          await pollResult.push(emoji.count);
          var mesg =
            "**" +
            (emoji.count - 1) +
            "** - `" +
            unescape(allOptions[pollResult.length - 1]) +
            "`";
          await end.push(mesg);
        }
        var pollMsg = "⬆**Poll**⬇";
        const Ended = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(unescape(result[0].title))
          .setDescription(
            "Poll ended. Here are the results:\n\n\n" +
              end
                .join("\n\n")
                .replace(/#quot;/g, "'")
                .replace(/#dquot;/g, '"')
          )
          .setTimestamp()
          .setFooter(
            "Hosted by " + author.username + "#" + author.discriminator,
            author.displayAvatarURL()
          );
        msg.edit(pollMsg, Ended);
        var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

        msg.channel.send("A poll has ended!\n" + link);
        msg.reactions.removeAll().catch(err => {
          console.error(err);
        });
        con.query("DELETE FROM poll WHERE id = " + msg.id, function(
          err,
          result
        ) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          message.channel.send("Ended a poll!");
          console.log("Deleted an ended poll.");
        });
      });
      con.release();
    });
  },
  async list(message, args, pool) {
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      con.query(
        "SELECT * FROM poll WHERE guild = " + message.guild.id,
        function(err, results) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          }
          const Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Poll list")
            .setDescription(
              "**" + message.guild.name + "** - " + results.length + " polls"
            )
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL()
            );
          if (results.length > 25) {
            for (var i = 0; i < 25; i++) {
              var newDate = new Date(results[i].endAt);
              var date = newDate.getDate();
              var month = newDate.getMonth();
              var year = newDate.getFullYear();
              var hour = newDate.getHours();
              var minute = newDate.getMinutes();
              var second = newDate.getSeconds();

              var readableTime =
                twoDigits(date) +
                "/" +
                twoDigits(month + 1) +
                "/" +
                twoDigits(year) +
                " " +
                twoDigits(hour) +
                ":" +
                twoDigits(minute) +
                ":" +
                twoDigits(second) +
                " UTC";
              Embed.addField(readableTime, unescape(results[i].title));
            }
          } else {
            results.forEach(result => {
              var newDate = new Date(result.endAt);
              var date = newDate.getDate();
              var month = newDate.getMonth();
              var year = newDate.getFullYear();
              var hour = newDate.getHours();
              var minute = newDate.getMinutes();
              var second = newDate.getSeconds();

              var readableTime =
                twoDigits(date) +
                "/" +
                twoDigits(month + 1) +
                "/" +
                twoDigits(year) +
                " " +
                twoDigits(hour) +
                ":" +
                twoDigits(minute) +
                ":" +
                twoDigits(second) +
                " UTC";
              Embed.addField(readableTime, unescape(result.title));
            });
          }
          message.channel.send(Embed);
        }
      );
      con.release();
    });
  }
};
