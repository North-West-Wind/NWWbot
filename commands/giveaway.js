const { ms } = require("../function.js");
const Discord = require("discord.js");

const { twoDigits, setTimeout_ } = require("../function.js");

module.exports = {
  name: "giveaway",
  description: "Create, end or list giveaways on the server.",
  args: 1,
  usage: "<subcommand>",
  aliases: ["g"],
  subcommands: ["create", "end", "list"],
  category: 4,
  async execute(message, args) {
    const guild = message.guild;
    const prefix = message.prefix;

    if (args[0] === "create") {
      if (args[1]) {
        if (!args[2]) {
          message.channel.send(
            "Single-line `giveaway create` command usage: `" +
            prefix +
            this.name +
            " create <channel> <duration> <winner count> <item>`"
          );
          return message.channel.send(
            "Please provide the duration if you want to use this command in 1 line."
          );
        }
        if (!args[3]) {
          message.channel.send(
            "Single-line `giveaway create` command usage: `" +
            prefix +
            this.name +
            " create <channel> <duration> <winner count> <item>`"
          );
          return message.channel.send(
            "Please provide the winner count if you want to use this command in 1 line."
          );
        }
        if (!args[4]) {
          message.channel.send(
            "Single-line `giveaway create` command usage: `" +
            prefix +
            this.name +
            " create <channel> <duration> <winner count> <item>`"
          );
          return message.channel.send(
            "Please provide the items if you want to use this command in 1 line."
          );
        }

        var channel = await message.guild.channels.resolve(
          args[1].replace(/<#/g, "").replace(/>/g, "")
        );
        if (channel === undefined || channel === null) {
          return message.channel.send(args[1] + " is not a valid channel!");
        }
        const permissions = channel.permissionsFor(message.guild.me);
        const userPermission = channel.permissionsFor(message.member);
        if (
          !permissions.has(18432)
        ) {
          return message.channel.send(
            "I cannot do giveaway in this channel as I don't have the permission!"
          );
        }
        if (
          !userPermission.has(18432)
        ) {
          return message.channel.send(
            "I cannot do giveaway in this channel as you don't have the permission to send message there!"
          );
        }
        var time = ms(args[2]);
        if (time === undefined) {
          return message.channel.send(
            "Cannot parse the duration with the argument provided: " + args[2]
          );
        }
        var winnerCount = parseInt(args[3]);
        if (isNaN(winnerCount)) {
          return message.channel.send(
            args[3] + " is not a valid winner count!"
          );
        }

        if (winnerCount == 1) {
          var winnerS = " winner";
        } else {
          var winnerS = " winners";
        }

        var item = args.slice(4).join(" ");
        var sec = time / 1000;
        var dd = Math.floor(sec / 86400);
        var dh = Math.floor((sec % 86400) / 3600);
        var dm = Math.floor(((sec % 86400) % 3600) / 60);
        var ds = Math.floor(((sec % 86400) % 3600) % 60);
        var dmi = Math.floor(
          time - dd * 86400000 - dh * 3600000 - dm * 60000 - ds * 1000
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
        message.channel.send(
          "Created new giveaway in channel <#" +
          channel.id +
          "> for**" +
          d +
          h +
          m +
          s +
          mi +
          "** with the item **" +
          item +
          "** and **" +
          winnerCount +
          winnerS +
          "**."
        );

        var reacted = [];
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

        if (parseInt(args[3]) == 1) {
          var sOrNot = "winner";
        } else {
          var sOrNot = "winners";
        }

        console.getConnection(function (err, con) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          con.query(
            `SELECT giveaway FROM servers WHERE id = '${guild.id}'`,
            function (err, result) {
              if (err) {
                console.error(err);
                return message.reply("there was an error trying to find the giveaway!");
              }
              const color = console.color();
              var Embed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle(item)
                .setDescription(
                  "React with " +
                  result[0].giveaway +
                  " to participate!\n" +
                  "**" +
                  winnerCount +
                  " " +
                  sOrNot +
                  "** will win\n" +
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
                  message.author.displayAvatarURL()
                );

              const giveawayMsg =
                result[0].giveaway + "**GIVEAWAY**" + result[0].giveaway;
              channel.send(giveawayMsg, Embed).then(msg => {
                con.query(
                  "INSERT INTO giveaways VALUES('" +
                  msg.id +
                  "', '" +
                  guild.id +
                  "', '" +
                  channel.id +
                  "', '" +
                  escape(item) +
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
                  function (err) {
                    if (err) {
                      console.error(err);
                      return message.reply(
                        "there was an error trying to execute that command!"
                      );
                    }
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
                setTimeout_(function () {
                  if (msg.deleted) {
                    con.query(
                      "DELETE FROM giveaways WHERE id = " + msg.id,
                      function (err) {
                        if (err) {
                          console.error(err);
                          return message.reply(
                            "there was an error trying to delete the giveaway!"
                          );
                        }
                        console.log("Deleted an ended giveaway record.");
                      }
                    );
                    return;
                  } else {
                    con.query(
                      "SELECT * FROM giveaways WHERE id = " + msg.id,
                      function (err, res) {
                        if (err) {
                          console.error(err);
                          return message.reply(
                            "there was an error trying to find the giveaway!"
                          );
                        }
                        if (res.length < 1) {
                          return;
                        } else {
                          var peopleReacted = msg.reactions.cache.get(
                            result[0].giveaway
                          );
                          for (const user of peopleReacted.users.cache.values()) {
                            const data = user.id;
                            reacted.push(data);
                          }

                          const remove = reacted.indexOf(message.client.user.id);
                          if (remove > -1) {
                            reacted.splice(remove, 1);
                          }

                          if (reacted.length === 0) {
                            con.query(
                              "DELETE FROM giveaways WHERE id = " + msg.id,
                              function (err) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                console.log(
                                  "Deleted an ended giveaway record."
                                );
                              }
                            );
                            const Ended = new Discord.MessageEmbed()
                              .setColor(console.color())
                              .setTitle(item)
                              .setDescription("Giveaway ended")
                              .addField("Winner(s)", "Nobody reacted.")
                              .setTimestamp()
                              .setFooter(
                                "Hosted by " +
                                message.author.username +
                                "#" +
                                message.author.discriminator,
                                message.author.displayAvatarURL()
                              );
                            msg.edit(giveawayMsg, Ended);
                            msg.reactions
                              .removeAll()
                              .catch(err => console.error(err));
                            return;
                          }

                          var index = Math.floor(
                            Math.random() * reacted.length
                          );
                          var winners = [];
                          var winnerMessage = "";

                          for (var i = 0; i < winnerCount; i++) {
                            winners.push(reacted[index]);
                            index = Math.floor(Math.random() * reacted.length);
                          }

                          for (var i = 0; i < winners.length; i++) {
                            winnerMessage += "<@" + winners[i] + "> ";
                          }

                          const Ended = new Discord.MessageEmbed()
                            .setColor(console.color())
                            .setTitle(item)
                            .setDescription("Giveaway ended")
                            .addField("Winner(s)", winnerMessage)
                            .setTimestamp()
                            .setFooter(
                              "Hosted by " +
                              message.author.username +
                              "#" +
                              message.author.discriminator,
                              message.author.displayAvatarURL()
                            );
                          msg.edit(giveawayMsg, Ended);
                          var link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                          msg.channel.send(
                            "Congratulation, " +
                            winnerMessage +
                            "! You won **" +
                            item +
                            "**!\n" +
                            link
                          );
                          msg.reactions
                            .removeAll()
                            .catch(error =>
                              console.error(
                                "Failed to clear reactions: ",
                                error
                              )
                            );

                          con.query(
                            "DELETE FROM giveaways WHERE id = " + msg.id,
                            function (err) {
                              if (err) {
                                console.error(err);
                                return message.reply(
                                  "there was an error trying to execute that command!"
                                );
                              }
                              console.log("Deleted an ended giveaway record.");
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

          
        });
        return;
      }
      return await this.create(message);
    }
    if (args[0] === "end") {
      return await this.end(message, args);
    }
    if (args[0] === "list") {
      return await this.list(message, args);
    }
  },
  async create(message) {
    const filter = user => user.author.id === message.author.id;
    const guild = message.guild;
    var item;
    var time;
    var winnerCount;
    var reacted = [];
    var mesg = await message.channel.send('Giveaway creation started. Type "cancel" to cancel.\n\n`Which channel do you want the giveaway be in? (Please mention the channel)`');
    const collected = await message.channel.awaitMessages(filter, { time: 30000, max: 1, errors: ["time"] });
    if(collected && collected.first()) await collected.first().delete();
    else if(!collected.first().content) return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected.first().content === "cancel") return mesg.edit("Cancelled giveaway.");
    var channelID = collected
      .first()
      .content.replace(/<#/, "")
      .replace(/>/, "");

    var channel = guild.channels.resolve(channelID);

    if (!channel) {
      collected.first().delete();
      return mesg.edit(
        collected.first().content + " is not a valid channel!"
      );
    }
    const permissions = channel.permissionsFor(message.guild.me);
    const userPermission = channel.permissionsFor(message.member);
    if (
      !permissions.has(18432)
    ) {
      return mesg.edit(
        "I cannot do giveaway in this channel as I don't have the permission!"
      );
    }
    if (
      !userPermission.has(18432)
    ) {
      return mesg.edit(
        "I cannot do giveaway in this channel as you don't have the permission to send message there!"
      );
    }
    collected.first().delete();
    mesg = await mesg.edit("The channel will be <#" + channel.id + ">\n\n`Now please enter the duration of the giveaway!`");
    const collected2 = await message.channel
      .awaitMessages(filter, {
        time: 30000,
        max: 1,
        errors: ["time"]
      });
    if(collected2 && collected2.first()) await collected2.first().delete();
    else if(!collected2.first().content) return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected2.first().content === "cancel") {
      return mesg.edit("Cancelled giveaway.");
    }
    var duration = ms(collected2.first().content);
    if (isNaN(duration)) {
      collected2.first().delete();
      return mesg.edit(
        "**" +
        collected2.first().content +
        "** is not a valid duration!"
      );
    }
    var sec = duration / 1000;
    var dd = Math.floor(sec / 86400);
    var dh = Math.floor((sec % 86400) / 3600);
    var dm = Math.floor(((sec % 86400) % 3600) / 60);
    var ds = Math.floor(((sec % 86400) % 3600) % 60);
    var dmi = Math.floor(
      duration -
      dd * 86400000 -
      dh * 3600000 -
      dm * 60000 -
      ds * 1000
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
    collected2.first().delete();
    mesg = await mesg
      .edit(
        "The duration will be**" +
        d +
        h +
        m +
        s +
        mi +
        "** \n\n`I'd like to know how many participants can win this giveaway. Please enter the winner count.`"
      );
    const collected3 = await message.channel
      .awaitMessages(filter, {
        time: 30000,
        max: 1,
        errors: ["time"]
      })
    if(collected3 && collected3.first()) await collected3.first().delete();
    else if(!collected3.first().content) return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected3.first().content === "cancel") {
      return mesg.edit("Cancelled giveaway.");
    }
    if (isNaN(parseInt(collected3.first().content))) {
      collected3.first().delete();
      return mesg.edit(
        "**" +
        collected3.first().content +
        "** is not a valid winner count!"
      );
    }
    if (parseInt(collected3.first().content) == 1) {
      var participant = "participant";
    } else {
      var participant = "participants";
    }
    collected3.first().delete();
    mesg = await mesg
      .edit(
        "Alright! **" +
        parseInt(collected3.first().content) +
        "** " +
        participant +
        " will win the giveaway. \n\n`At last, please tell me what is going to be giveaway!`"
      )
    const collected4 = await message.channel
      .awaitMessages(filter, {
        time: 30000,
        max: 1,
        errors: ["time"]
      })
    if(collected4 && collected4.first()) await collected4.first().delete();
    else if(!collected4.first().content) return mesg.edit("30 seconds have passed. Giveaway cancelled.");
    if (collected4.first().content === "cancel") {
      return mesg.edit("Cancelled giveaway.");
    }
    mesg.edit(
      "The items will be **" +
      collected4.first().content +
      "**"
    );
    item = collected4.first().content;
    winnerCount = collected3.first().content;
    if (
      parseInt(collected3.first().content) == 1
    ) {
      var sOrNot = "winner";
    } else {
      var sOrNot = "winners";
    }
    message.channel.send(
      "The giveaway will be held in <#" +
      channel.id +
      "> for **" +
      d +
      h +
      m +
      s +
      mi +
      "** with the item **" +
      item +
      "** and **" +
      winnerCount +
      "** " +
      sOrNot
    );
    collected4.first().delete();

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

    winnerCount = parseInt(collected3.first().content);
    time = ms(collected2.first().content);
    item = collected4.first().content;

    console.getConnection(function (err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query(
        `SELECT giveaway FROM servers WHERE id = '${guild.id}'`,
        function (err, result) {
          if(err) {
            console.error(err);
            return message.reply("there was an error trying to find the giveaway!");
          }
          const color = console.color();
          var Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(item)
            .setDescription(
              "React with " +
              result[0].giveaway +
              " to participate!\n" +
              "**" +
              winnerCount +
              " " +
              sOrNot +
              "** will win\n" +
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
              message.author.displayAvatarURL()
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
                escape(item) +
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
                function (err, result) {
                  if (err) {
                    console.error(err);
                    return message.reply(
                      "there was an error trying to execute that command!"
                    );
                  }
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
              setTimeout_(function () {
                if (msg.deleted) {
                  con.query(
                    "DELETE FROM giveaways WHERE id = " +
                    msg.id,
                    function (err, con) {
                      if (err) {
                        console.error(err);
                        return message.reply(
                          "there was an error trying to execute that command!"
                        );
                      }
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
                    function (err, res) {
                      if (err) {
                        console.error(err);
                        return message.reply(
                          "there was an error trying to execute that command!"
                        );
                      }
                      if (res.length < 1) {
                        return;
                      } else {
                        var peopleReacted = msg.reactions.cache.get(
                          result[0].giveaway
                        );
                        for (const user of peopleReacted.users.cache.values()) {
                          const data = user.id;
                          reacted.push(data);
                        }

                        const remove = reacted.indexOf(message.client.user.id);
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
                            `DELETE FROM giveaways WHERE id = '${msg.id}'`,
                            function (err) {
                              if (err) {
                                console.error(err);
                                return message.reply("there was an error trying to execute that command!");
                              }
                              console.log(
                                "Deleted an ended giveaway record."
                              );
                            }
                          );
                          const Ended = new Discord.MessageEmbed()
                            .setColor(console.color())
                            .setTitle(item)
                            .setDescription(
                              "Giveaway ended"
                            )
                            .addField(
                              "Winner(s)",
                              "Nobody reacted."
                            )
                            .setTimestamp()
                            .setFooter(
                              "Hosted by " +
                              message.author
                                .username +
                              "#" +
                              message.author
                                .discriminator,
                              message.author.displayAvatarURL()
                            );
                          msg.edit(
                            giveawayMsg,
                            Ended
                          );
                          msg.reactions
                            .removeAll()
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

                        const Ended = new Discord.MessageEmbed()
                          .setColor(console.color())
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
                            message.author.displayAvatarURL()
                          );
                        msg.edit(
                          giveawayMsg,
                          Ended
                        );
                        var link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
                        msg.channel.send(
                          "Congratulation, " +
                          winnerMessage +
                          "! You won **" +
                          item +
                          "**!\n" +
                          link
                        );
                        msg.reactions
                          .removeAll()
                          .catch(error =>
                            console.error(
                              "Failed to clear reactions: ",
                              error
                            )
                          );

                        con.query(
                          "DELETE FROM giveaways WHERE id = " +
                          msg.id,
                          function (err, con) {
                            if (err) {
                              console.error(
                                err
                              );
                              return message.reply(
                                "there was an error trying to execute that command!"
                              );
                            }
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

      
    });
  },
  async end(message, args) {
    if (!args[1]) {
      return message.channel.send("You didn't provide any message ID!");
    }
    var msgID = args[1];
    console.getConnection(function (err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query(
        "SELECT * FROM giveaways WHERE id = '" + msgID + "'",
        async function (err, result) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          if (result.length < 1 || !result) {
            return message.channel.send("No giveaway was found!");
          }

          if (result[0].author !== message.author.id) {
            return message.channel.send(
              "You cannot end a giveaway that is not hosted by you!"
            );
          }

          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          try {
            var channel = await message.client.channels.fetch(
              result[0].channel
            );
          } catch (err) {
            console.log("Failed fetching guild/channel of giveaway.");
            return console.error(err);
          }
          try {
            var msg = await channel.messages.fetch(result[0].id);
          } catch (err) {
            con.query(
              "DELETE FROM giveaways WHERE id = " + result[0].id,
              function (err, con) {
                if (err) return console.log(err);
                console.log("Deleted an ended giveaway record.");
              }
            );
            return;
          }
          if (msg.deleted) {
            con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (err) {
              if (err) return console.log(err);
              console.log("Deleted an ended giveaway record.");
            });
            return;
          } else {
            var fetchUser = await message.client.users.fetch(result[0].author);
            var endReacted = [];
            var peopleReacted = await msg.reactions.cache.get(result[0].emoji);
            await peopleReacted.users.fetch();
            try {
              for (const user of peopleReacted.users.cache.values()) {
                const data = user.id;
                endReacted.push(data);
              }
            } catch (err) {
              return console.error(err);
            }

            const remove = endReacted.indexOf(message.client.user.id);
            if (remove > -1) {
              endReacted.splice(remove, 1);
            }

            if (endReacted.length === 0) {
              con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                err,
                result
              ) {
                if (err) return console.log(err);
                console.log("Deleted an ended giveaway record.");
              });
              const Ended = new Discord.MessageEmbed()
                .setColor(parseInt(result[0].color))
                .setTitle(unescape(result[0].item))
                .setDescription("Giveaway ended")
                .addField("Winner(s)", "None. Cuz no one reacted.")
                .setTimestamp()
                .setFooter(
                  "Hosted by " +
                  fetchUser.username +
                  "#" +
                  fetchUser.discriminator,
                  fetchUser.displayAvatarURL()
                );
              msg.edit(Ended);
              msg.reactions.removeAll().catch(err => console.error(err));
              return;
            } else {
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

              const Ended = new Discord.MessageEmbed()
                .setColor(parseInt(result[0].color))
                .setTitle(unescape(result[0].item))
                .setDescription("Giveaway ended")
                .addField("Winner(s)", winnerMessage)
                .setTimestamp()
                .setFooter(
                  "Hosted by " +
                  fetchUser.username +
                  "#" +
                  fetchUser.discriminator,
                  fetchUser.displayAvatarURL()
                );
              msg.edit(Ended);
              var link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
              msg.channel.send(
                "Congratulation, " +
                winnerMessage +
                "! You won **" +
                unescape(result[0].item) +
                "**!\n" +
                link
              );
              msg.reactions
                .removeAll()
                .catch(error =>
                  console.error("Failed to clear reactions: ", error)
                );

              con.query("DELETE FROM giveaways WHERE id = " + msg.id, function (
                err,
                con
              ) {
                if (err) return console.log(err);
                message.channel.send("Ended a giveaway!");
                console.log("Deleted an ended giveaway record.");
              });
            }
          }
        }
      );
      
    });
  },
  async list(message, args) {
    const guild = message.guild;
    console.getConnection(function (err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query(`SELECT * FROM giveaways WHERE guild = '${guild.id}'`, function (
        err,
        results
      ) {
        if (err) {
          console.error(err);
          return message.reply("there was an error trying to execute that command!");
        }
        const Embed = new Discord.MessageEmbed()
          .setColor(console.color())
          .setTitle("Giveaway list")
          .setDescription(
            "**" + guild.name + "** - " + results.length + " giveaways"
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
            Embed.addField(readableTime, unescape(results[i].item));
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
            Embed.addField(readableTime, unescape(result.item));
          });
        }
        message.channel.send(Embed);
      });
      
    });
  }
};
