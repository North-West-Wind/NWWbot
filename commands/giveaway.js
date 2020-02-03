const ms = require("ms"); // npm install ms
const Discord = require("discord.js");
const client = new Discord.Client();
var color = Math.floor(Math.random() * 16777214) + 1;
const moment = require("moment");
const mysql = require("mysql");

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

function setTimeout_ (fn, delay) {
    var maxDelay = Math.pow(2,31)-1;

    if (delay > maxDelay) {
        var args = arguments;
        args[1] -= maxDelay;

        return setTimeout(function () {
            setTimeout_.apply(fn, args);
        }, maxDelay);
    }

    return setTimeout.apply(fn, arguments);
}

module.exports = {
  name: "giveaway",
  description: "Giveaway something.",
  args: true,
  usage: "<time> <winners> <items>",
  aliases: ["g"],
  subcommands: ["create", "end"],
  execute(message, args, pool) {
    const filter = user => user.author.id === message.author.id;
    var guild = message.guild;
    var ended = [];
    if (args[0] === "create") {
      var item;
      var time;
      var winnerCount;

      var reacted = [];

      message.channel
        .send(
          "Giveaway creation started. \n\n`Which channel do you want the giveaway be in? (Please mention the channel)`"
        )
        .then(mesg => {
          message.channel
            .awaitMessages(filter, { time: 30000, max: 1, error: ["time"] })
            .then(collected => {
              var channelID = collected
                .first()
                .content.replace(/<#/, "")
                .replace(/>/, "");
              var channel = guild.channels.get(channelID);
            const permissions = channel.permissionsFor(message.client.user);
            if(!permissions.has("SEND_MESSAGES") || !permissions.has("EMBED_LINKS")) {
              return message.channel.send("I cannot do giveaway in this channel as I don't have the permission!")
            }
            collected.first().delete();
              mesg.edit(
                  "The channel will be " +
                    channel +
                    "\n\n`Now please enter the duration of the giveaway!`"
                )
                .then(mesg => {
                  message.channel
                    .awaitMessages(filter, {
                      time: 30000,
                      max: 1,
                      error: ["time"]
                    })
                    .then(collected2 => {
                      var duration = ms(collected2.first().content);
                      var sec = duration / 1000;
                      var dd = Math.floor(sec / 86400);
                      var dh = Math.floor((sec % 86400) / 3600);
                      var dm = Math.floor(((sec % 86400) % 3600) / 60);
                      var ds = Math.floor(((sec % 86400) % 3600) % 60);
                    var dmi = Math.floor((((duration % 86400) % 3600) % 60) % 1000);
                    var d = "";
                    var h = "";
                    var m = "";
                    var s = "";
                    var mi = "";
                    if(dd !== 0) {
                      d = " " + dd + " days";
                    }
                    if(dh !== 0) {
                      h = " " + dh + " hours";
                    }
                    if(dm !== 0) {
                      m = " " + dm + " minutes";
                    }
                    if(ds !== 0) {
                      s = " " + ds + " seconds";
                    }
                    if(dmi !== 0) {
                      mi = " " + dmi + " milliseconds";
                    }
                    collected2.first().delete();
                      mesg.edit(
                          "The duration will be**" + 
                            d + h + m + s + mi +
                        
                            "** \n\n`I'd like to know how many participants can win this giveaway. Please enter the winner count.`"
                        )
                        .then(mesg => {
                          message.channel
                            .awaitMessages(filter, {
                              time: 30000,
                              max: 1,
                              error: ["time"]
                            })
                            .then(collected3 => {
                            if(isNaN(parseInt(collected3.first().content))) {
                              return message.channel.send("The query provided is not a number! Cancelling action...")
                            }
                              if (parseInt(collected3.first().content) == 1) {
                                var participant = "participant";
                              } else {
                                var participant = "participants";
                              }
                            collected3.first().delete();
                              mesg.edit(
                                  "Alright! **" +
                                    collected3.first().content +
                                    "** " +
                                    participant +
                                    " will win the giveaway. \n\n`At last, please tell me what is going to be giveaway!`"
                                )
                                .then(mesg => {
                                  message.channel
                                    .awaitMessages(filter, {
                                      time: 30000,
                                      max: 1,
                                      error: ["time"]
                                    })
                                    .then(collected4 => {
                                      mesg.edit(
                                        "The items will be **" +
                                          collected4.first().content +
                                          "**"
                                      );
                                    item = collected4.first().content;
                                    winnerCount = collected3.first().content;
                                    if (parseInt(collected3.first().content) == 1) {
                                var sOrNot = "winner";
                              } else {
                                var sOrNot = "winners";
                              }
                                    message.channel.send("The giveaway will be held in " + channel + " for **" + d + h + m + s + "** with the item **" + item + "** and **" + winnerCount + "** " + sOrNot);
                                    collected4.first().delete();
                                    mesg.delete(10000);

                                      var millisec = ms(
                                        collected2.first().content
                                      );

                                      var currentDate = new Date();

                                      var newDate = new Date(
                                        currentDate.getTime() + millisec
                                      );

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

                                      winnerCount = parseInt(
                                        collected3.first().content
                                      );
                                      time = ms(collected2.first().content);
                                      item = collected4.first().content;

                                      pool.getConnection(function(err, con) {
                                        if (err) throw err;
                                        con.query(
                                          "SELECT giveaway FROM servers WHERE id = " +
                                            guild.id,
                                          function(err, result, fields) {
                                            var Embed = new Discord.RichEmbed()
                                              .setColor(color)
                                              .setTitle(item)
                                              .setDescription(
                                                "This giveaway will end at: \n**" +
                                                  readableTime +
                                                  "**"
                                              )
                                              .setTimestamp()
                                              .setFooter(
                                                "Hosted by " +
                                                  message.author.username +
                                                  "#" +
                                                  message.author.discriminator,
                                                message.author.displayAvatarURL
                                              );

                                            const giveawayMsg =
                                              result[0].giveaway +
                                              "**GIVEAWAY**" +
                                              result[0].giveaway;
                                            channel
                                              .send(giveawayMsg, Embed)
                                              .then(msg => {
                                                con.query(
                                                  "INSERT INTO giveaways VALUES('" +
                                                    msg.id +
                                                    "', '" +
                                                    guild.id +
                                                    "', '" +
                                                    channel.id +
                                                    "', '" +
                                                    item
                                                      .replace(/"/g, '\\"')
                                                      .replace(/'/g, "\\'") +
                                                    "', '" +
                                                    winnerCount +
                                                    "', '" +
                                                    newDateSql +
                                                    "', '" +
                                                    result[0].giveaway +
                                                    "', '" +
                                                    message.author.id +
                                                    "', '" +
                                                    color +
                                                    "')",
                                                  function(err, result) {
                                                    if (err) throw err;
                                                    console.log(
                                                      "Inserted record for " +
                                                        item +
                                                        " giveaway in channel " +
                                                        channel.name +
                                                        " of server " +
                                                        guild.name
                                                    );
                                                  }
                                                );

                                                msg.react(result[0].giveaway);
                                                setTimeout_(function() {
                                                  if(msg.deleted === true) {
                                                    con.query(
                                                          "DELETE FROM giveaways WHERE id = " +
                                                            msg.id,
                                                          function(err, con) {
                                                            if (err) throw err;
                                                            console.log(
                                                              "Deleted an ended giveaway record."
                                                            );
                                                          }
                                                        );
                                                    return;
                                                  } else {
                                                  con.query(
                                                    "SELECT * FROM giveaways WHERE id = " +
                                                      msg.id,
                                                    function(err, res, fields) {
                                                      if (err) throw err;
                                                      if (res.length < 1) {
                                                        return;
                                                      } else {
                                                        var peopleReacted = msg.reactions.get(
                                                          result[0].giveaway
                                                        );
                                                        for (const user of peopleReacted.users.values()) {
                                                          const data = user.id;
                                                          reacted.push(data);
                                                        }

                                                        const remove = reacted.indexOf(
                                                          "649611982428962819"
                                                        );
                                                        if (remove > -1) {
                                                          reacted.splice(
                                                            remove,
                                                            1
                                                          );
                                                        }

                                                        if (
                                                          reacted.length === 0
                                                        ) {
                                                          con.query(
                                                            "DELETE FROM giveaways WHERE id = " +
                                                              msg.id,
                                                            function(
                                                              err,
                                                              result
                                                            ) {
                                                              if (err)
                                                                throw err;
                                                              console.log(
                                                                "Deleted an ended giveaway record."
                                                              );
                                                            }
                                                          );
                                                          const Ended = new Discord.RichEmbed()
                                                            .setColor(color)
                                                            .setTitle(item)
                                                            .setDescription(
                                                              "Giveaway ended"
                                                            )
                                                            .addField(
                                                              "Winner(s)",
                                                              "None. Cuz no one reacted."
                                                            )
                                                            .setTimestamp()
                                                            .setFooter(
                                                              "Hosted by " +
                                                                message.author
                                                                  .username +
                                                                "#" +
                                                                message.author
                                                                  .discriminator,
                                                              message.author
                                                                .displayAvatarURL
                                                            );
                                                          msg.edit(
                                                            giveawayMsg,
                                                            Ended
                                                          );
                                                          msg
                                                            .clearReactions()
                                                            .catch(err =>
                                                              console.error(err)
                                                            );
                                                          return;
                                                        }

                                                        var index = Math.floor(
                                                          Math.random() *
                                                            reacted.length
                                                        );
                                                        var winners = [];
                                                        var winnerMessage = "";

                                                        for (
                                                          var i = 0;
                                                          i < winnerCount;
                                                          i++
                                                        ) {
                                                          winners.push(
                                                            reacted[index]
                                                          );
                                                          index = Math.floor(
                                                            Math.random() *
                                                              reacted.length
                                                          );
                                                        }

                                                        for (
                                                          var i = 0;
                                                          i < winners.length;
                                                          i++
                                                        ) {
                                                          winnerMessage +=
                                                            "<@" +
                                                            winners[i] +
                                                            "> ";
                                                        }

                                                        const Ended = new Discord.RichEmbed()
                                                          .setColor(color)
                                                          .setTitle(item)
                                                          .setDescription(
                                                            "Giveaway ended"
                                                          )
                                                          .addField(
                                                            "Winner(s)",
                                                            winnerMessage
                                                          )
                                                          .setTimestamp()
                                                          .setFooter(
                                                            "Hosted by " +
                                                              message.author
                                                                .username +
                                                              "#" +
                                                              message.author
                                                                .discriminator,
                                                            message.author
                                                              .displayAvatarURL
                                                          );
                                                        msg.edit(
                                                          giveawayMsg,
                                                          Ended
                                                        );
                                                        msg
                                                          .clearReactions()
                                                          .catch(error =>
                                                            console.error(
                                                              "Failed to clear reactions: ",
                                                              error
                                                            )
                                                          );

                                                        con.query(
                                                          "DELETE FROM giveaways WHERE id = " +
                                                            msg.id,
                                                          function(err, con) {
                                                            if (err) throw err;
                                                            console.log(
                                                              "Deleted an ended giveaway record."
                                                            );
                                                          }
                                                        );
                                                      }
                                                    }
                                                  );
                                                }
                                                }, time);
                                              });
                                          }
                                        );

                                        con.release();
                                      });
                                    })
                                    .catch(err => {
                                      message.channel.send(
                                        "30 seconds have passed. Action cancelled."
                                      );
                                    });
                                });
                            })
                            .catch(err => {
                              message.channel.send(
                                "30 seconds have passed. Action cancelled."
                              );
                            });
                        });
                    })
                    .catch(err => {
                      message.channel.send(
                        "30 seconds have passed. Action cancelled."
                      );
                    });
                });
            })
            .catch(err => {
              message.channel.send("30 seconds have passed. Action cancelled.");
            });
        });
    } else if (args[0] === "end") {
      if (!args[1]) {
        return;
      }
      var msgID = args[1];
      pool.getConnection(function(err, con) {
        if (err) throw err;
        con.query("SELECT * FROM giveaways WHERE id = " + msgID, async function(
          err,
          result,
          fields
        ) {
          if (result === undefined || !result || result === null) {
            return message.channel.send("No giveaway was found!");
          }

          if (result[0].author !== message.author.id) {
            return message.channel.send(
              "You cannot end a giveaway that is not hosted by you!"
            );
          }

          const done = msgID;
          ended.push(done);

          if (err) throw err;
          var fetchGuild = message.client.guilds.get(result[0].guild);
          var channel = fetchGuild.channels.get(result[0].channel);
          var msg = await channel.fetchMessage(msgID);
          var fetchUser = await message.client.fetchUser(result[0].author);
          var endReacted = [];
          var peopleReacted = await msg.reactions.get(result[0].emoji);
          for (const user of peopleReacted.users.values()) {
            const data = user.id;
            endReacted.push(data);
          }

          const remove = endReacted.indexOf("649611982428962819");
          if (remove > -1) {
            endReacted.splice(remove, 1);
          }

          if (endReacted.length === 0) {
            con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
              err,
              result
            ) {
              if (err) throw err;
              console.log("Deleted an ended giveaway record.");
            });
            const Ended = new Discord.RichEmbed()
              .setColor(parseInt(result[0].color))
              .setTitle(result[0].item)
              .setDescription("Giveaway ended")
              .addField("Winner(s)", "None. Cuz no one reacted.")
              .setTimestamp()
              .setFooter(
                "Hosted by " +
                  fetchUser.username +
                  "#" +
                  fetchUser.discriminator,
                fetchUser.displayAvatarURL
              );
            msg.edit(Ended);
            msg.clearReactions().catch(err => console.error(err));
            return;
          }

          var index = Math.floor(Math.random() * endReacted.length);
          var winners = [];
          var winnerMessage = "";
          var winnerCount = result[0].winner;

          for (var i = 0; i < winnerCount; i++) {
            winners.push(endReacted[index]);
            index = Math.floor(Math.random() * endReacted.length);
          }

          for (var i = 0; i < winners.length; i++) {
            winnerMessage += "<@" + winners[i] + "> ";
          }

          const Ended = new Discord.RichEmbed()
            .setColor(parseInt(result[0].color))
            .setTitle(result[0].item)
            .setDescription("Giveaway ended")
            .addField("Winner(s)", winnerMessage)
            .setTimestamp()
            .setFooter(
              "Hosted by " + fetchUser.username + "#" + fetchUser.discriminator,
              fetchUser.displayAvatarURL
            );
          msg.edit(Ended);
          msg
            .clearReactions()
            .catch(error =>
              console.error("Failed to clear reactions: ", error)
            );

          con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
            err,
            con
          ) {
            if (err) throw err;
            console.log("Deleted an ended giveaway record.");
          });
        });
        con.release();
      });
    } else if(args[0] === "list") {
      pool.getConnection(function(err, con) {
        if(err) throw err;
        con.query("SELECT * FROM giveaways WHERE guild = " + guild.id, function(err, results, fields) {
          if(err) throw err;
          const Embed = new Discord.RichEmbed()
          .setColor(color)
          .setTitle("Giveaway list")
          .setDescription("**" + guild.name + "** - " + results.length + " giveaways")
          .setTimestamp()
          .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
          
          if(results.length > 25) {
            for(var i = 0; i < 25; i++) {
              var newDate = new Date(results[i].endAt)
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
              Embed.addField(readableTime, results[i].item);
            }
            
          } else {
            results.forEach(result => {
              var newDate = new Date(result.endAt)
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
              Embed.addField(readableTime, result.item);
            })
          }
          message.channel.send(Embed)
          
          
        });
        con.release();
      })
    }
  }
};
