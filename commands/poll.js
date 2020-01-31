const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const client = new Discord.Client();
const ms = require("ms");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

module.exports = {
  name: "poll",
  description: "create a poll.",
  usage: "<title> <time> <options>",
  execute(message, args, pool) {
    const filter = m => m.author.id === message.author.id;
    if (args[0] === "create") {
      pool.getConnection(async function(err, con) {
        if (err) throw err;
        await message.channel.send(
          "Starting a poll.\n\n`Please enter where you want to host your poll.(Mention the channel)`"
        );
        var channelCollected = await message.channel.awaitMessages(filter, {
          time: 30000,
          max: 1,
          error: ["error"]
        });
        var channelID = channelCollected
          .first()
          .content.replace(/<#/g, "")
          .replace(/>/g, "");
        var channel = await message.guild.channels.get(channelID);
        if (!channel || channel === undefined || channel === null) {
          return message.channel.send(
            "That isn't a valid channel! Cancelling actions..."
          );
        }
        await message.channel.send(
          "Great! The channel will be " +
            channel +
            ".\n\n`Please tell me the title of the poll!`"
        );
        var collected = await message.channel.awaitMessages(filter, {
          time: 30000,
          max: 1,
          error: ["time"]
        });
        var title = collected.first().content;
        await message.channel.send(
          "The title will be **" +
            title +
            "**\n\n`Now, I'd like to know the duration.`"
        );
        var collected2 = await message.channel.awaitMessages(filter, {
          time: 30000,
          max: 1,
          error: ["time"]
        });
        var time = ms(collected2.first().content);
        var duration = ms(collected2.first().content);
        var sec = duration / 1000;
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
        await message.channel.send(
          "Alright! The poll will last for**" +
            d +
            h +
            m +
            s +
            "**. \n\n`Last but not least, please enter the options. Please break a line for each options!`"
        );
        var optionString = await message.channel.awaitMessages(filter, {
          time: 60000,
          max: 1,
          error: ["time"]
        });

        var options = optionString.first().content.split("\n");
        if (options.length <= 1) {
          return message.channel.send(
            "Please provide at least 2 options! Cancelling action..."
          );
        }
        await message.channel.send(
          "Nice! **" + options.length + "** options it is!"
        );

        var emojis = [
          "1️⃣",
          "2️⃣",
          "3️⃣",
          "4️⃣",
          "5️⃣",
          "6️⃣",
          "7️⃣",
          "8️⃣",
          "9️⃣",
          "🔟"
        ];
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
        
        const Embed = new Discord.RichEmbed()
          .setColor(color)
          .setTitle(title)
          .setDescription(
            "React with the numbers to vote!\nThis poll will end at:\n**" + readableTime + "**\n\n\n" + optionArray.join("\n\n")
          )
          .setTimestamp()
          .setFooter(
            "Hosted by " +
              message.author.username +
              "#" +
              message.author.discriminator,
            message.author.displayAvatarURL
          );
        var msg = await channel.send(Embed);
        for (var i = 0; i < optionArray.length; i++) {
          await msg.react(emojis[i]);
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
            title.replace(/'/g, /\\'/).replace(/"/g, /\\"/) +
            "')",
          function(err, result) {
            if (err) throw err;
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

        setTimeout(async function() {
          var result = [];
          var end = [];
          for (const emoji of msg.reactions.values()) {
            await result.push(emoji.count);
            var mesg =
              "**" +
              (emoji.count - 1) +
              "** - `" +
              allOptions[result.length - 1] +
              "`";
            await end.push(mesg);
          }

          const Ended = new Discord.RichEmbed()
            .setColor(color)
            .setTitle(title)
            .setDescription(
              "Poll ended. Here are the results:\n\n\n" + end.join("\n\n")
            )
            .setTimestamp()
            .setFooter(
              "Hosted by " +
                message.author.username +
                "#" +
                message.author.discriminator,
              message.author.displayAvatarURL
            );
          msg.edit(Ended);
          msg.clearReactions().catch(err => {
            console.error(err);
          });
          con.query("DELETE FROM poll WHERE id = " + msg.id, function(
            err,
            result
          ) {
            if (err) throw err;
            console.log("Deleted an ended poll.");
          });
        }, time);

        con.release();
      });
    } else if (args[0] === "end") {
      if (!args[1]) {
        return message.channel.send("Please provide the ID of the message!");
      }
      var msgID = args[1];
      pool.getConnection(function(err, con) {
        if (err) throw err;
        con.query("SELECT * FROM poll WHERE id = " + msgID, async function(
          err,
          result,
          fields
        ) {
          if (err) throw err;
          if (result[0] === undefined || !result[0] || result[0] === null) {
            return message.channel.send("No poll was found!");
          }
          if (result[0].author !== message.author.id) {
            return message.channel.send(
              "You cannot end a poll that was not created by you!"
            );
          }

          var guild = await message.client.guilds.get(result[0].guild);
          var channel = await guild.channels.get(result[0].channel);
          var msg = await channel.fetchMessage(msgID);
          var author = await message.client.fetchUser(result[0].author);
          var allOptions = await JSON.parse(result[0].options);

          var pollResult = [];
          var end = [];
          for (const emoji of msg.reactions.values()) {
            await pollResult.push(emoji.count);
            var mesg =
              "**" +
              (emoji.count - 1) +
              "** - `" +
              allOptions[pollResult.length - 1] +
              "`";
            await end.push(mesg);
          }

          const Ended = new Discord.RichEmbed()
            .setColor(color)
            .setTitle(result[0].title)
            .setDescription(
              "Poll ended. Here are the results:\n\n\n" + end.join("\n\n")
            )
            .setTimestamp()
            .setFooter(
              "Hosted by " + author.username + "#" + author.discriminator,
              author.displayAvatarURL
            );
          msg.edit(Ended);
          msg.clearReactions().catch(err => {
            console.error(err);
          });
          con.query("DELETE FROM poll WHERE id = " + msg.id, function(
            err,
            result
          ) {
            if (err) throw err;
            console.log("Deleted an ended poll.");
          });
        });
        con.release();
      });
    } else if (args[0] === "list") {
      pool.getConnection(function(err, con) {
        if (err) throw err;
        con.query(
          "SELECT * FROM poll WHERE guild = " + message.guild.id,
          function(err, results, fields) {
            if (err) throw err;
            const Embed = new Discord.RichEmbed()
              .setColor(color)
              .setTitle("Poll list")
              .setDescription(
                "**" + message.guild.name + "** - " + results.length + " polls"
              )
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                "https://i.imgur.com/hxbaDUY.png"
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
                Embed.addField(readableTime, results[i].title);
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
                Embed.addField(readableTime, result.title);
              });
            }
            message.channel.send(Embed);
          }
        );
        con.release();
      });
    }
  }
};
