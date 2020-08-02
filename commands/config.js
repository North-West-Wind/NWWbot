const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
var panelEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "⏹"],
  welcomeEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "⬅", "⏹"],
  yesNo = ["1️⃣", "2️⃣", "⬅", "⏹"],
  leaveEmoji = ["1️⃣", "2️⃣", "⬅", "⏹"];

module.exports = {
  name: "config",
  description: "Generate a token for logging into the Configuration Panel.",
  usage: "[subcommand]",
  subcommands: ["new", "panel"],

  async execute(message, args, pool) {
    if (message.channel instanceof Discord.DMChannel) {
      return message.channel.send("Direct messages is not configurable.");
    }
    if (!message.member.permissions.has("MANAGE_GUILD")) {
      message.reply(`you don\'t have the permission to use this command.`);
      return;
    }

    const guild = message.guild;

    if (args[0] === "new") {
      return await this.new(message, args, pool);
    }
    if (args[0] === "panel") {
      return await this.panel(message, args, pool);
    }

    pool.getConnection(function (err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      con.query(
        "SELECT * FROM servers WHERE id='" + guild.id + "'",
        async function (err, result) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          if (!result[0]) {
            con.query(
              "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
              guild.id +
              ", '[]', '🎉')",
              function (err) {
                if (err) {
                  message.reply("there was an error trying to insert record for your server!");
                  return console.error(err);
                }
                console.log("Inserted record for " + guild.name);
              }
            );
          }
          if (result[0].token !== null) {
            return message.author.send(
              "Token was created for **" +
              guild.name +
              "** before.\nToken: `" +
              result[0].token +
              "`"
            );
          } else {
            require("crypto").randomBytes(24, function (err, buffer) {
              if (err) return message.reply("there was an error trying to generate a token!");
              var generated = buffer.toString("hex");

              con.query(
                "UPDATE servers SET token = '" +
                generated +
                "' WHERE id = '" +
                guild.id +
                "'",
                function (err) {
                  if (err) {
                    console.error(err);
                    return message.reply(
                      "there was an error trying to update the token!"
                    );
                  }
                  console.log("Created token for server " + guild.name);
                  message.author.send(
                    "Created token for guild - **" +
                    guild.name +
                    "**\nToken: `" +
                    generated +
                    "`"
                  );
                }
              );
            });
          }
        }
      );
      con.release();
    });
  },
  new(message, args, pool) {
    var guild = message.guild;
    require("crypto").randomBytes(24, function (err, buffer) {
      if (err) return message.reply("there was an error trying to generate a token!");
      var generated = buffer.toString("hex");
      pool.getConnection(function (err, con) {
        if (err) {
          console.error(err);
          return message.reply(
            "there was an error trying to connect to the database!"
          );
        }
        con.query(
          "SELECT * FROM servers WHERE id='" + guild.id + "'",
          async function (err, result) {
            if (err) {
              console.error(err);
              return message.reply(
                "there was an error trying to execute that command!"
              );
            }
            if (!result[0]) {
              con.query(
                "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                guild.id +
                ", '[]', '🎉')",
                function (err) {
                  if (err) {
                    message.reply("there was an error trying to insert record for your server!");
                    return console.error(err);
                  }
                  console.log("Inserted record for " + guild.name);
                }
              );
            }
            con.query(
              "UPDATE servers SET token = '" +
              generated +
              "' WHERE id = '" +
              guild.id +
              "'",
              function (err) {
                if (err) {
                  console.error(err);
                  return message.reply(
                    "there was an error trying to update the token!"
                  );
                }
                console.log("Generated a new token for " + guild.name);
                message.author.send(
                  "Generated a new token for server - **" +
                  guild.name +
                  "**\nToken: `" +
                  generated +
                  "`"
                );
              }
            );
          });
        con.release();
      });
    });
  },
  async panel(message, args, pool) {
    const msgFilter = x => x.author.id === message.author.id;
    const filter = (reaction, user) =>
      welcomeEmoji.includes(reaction.emoji.name) &&
      user.id === message.author.id &&
      !user.bot;
    const login = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(message.guild.name + "'s Configuration Panel")
      .setDescription("Please login with the token.")
      .setTimestamp()
      .setFooter(
        "Please enter within 60 seconds.",
        message.client.user.displayAvatarURL()
      );
    var mesg = await message.channel.send(login);
    var loginToken = await message.channel
      .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
      .catch(err => timedOut(mesg, login));
    var receivedToken = loginToken.first().content;
    loginToken.first().delete();
    pool.getConnection(function (err, con) {
      if (err) return message.reply("there was an error trying to connect to the database!");
      con.query(
        "SELECT * FROM servers WHERE token = '" +
        receivedToken +
        "' AND id = " +
        message.guild.id,
        async function (err, results) {
          if (err) return message.reply("there was an error trying to fetch data from the database!");
          if (results.length < 1) {
            login
              .setDescription("Wrong token.")
              .setFooter(
                "Try again when you have the correct one for your server.",
                message.client.user.displayAvatarURL()
              );
            return await mesg.edit(login);
          }
          const panelEmbed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(message.guild.name + "'s Configuration Panel")
            .setDescription(
              "Please choose an option to configure:\n\n1️⃣ Welcome Message\n2️⃣ Leave Message\n3️⃣ Giveaway Emoji\n⏹ Quit"
            )
            .setTimestamp()
            .setFooter(
              "Please choose within 60 seconds.",
              message.client.user.displayAvatarURL()
            );
          var msg = await mesg.edit(panelEmbed);
          start(msg, panelEmbed);
        }
      );
      con.release();
    });
    function end(msg, panelEmbed) {
      panelEmbed
        .setDescription("Panel shutted down.")
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      msg.edit(panelEmbed);
      return msg.reactions.removeAll().catch(console.error);
    }

    function timedOut(msg, panelEmbed) {
      panelEmbed
        .setDescription("Panel timed out.")
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      msg.edit(panelEmbed);
      return msg.reactions.removeAll().catch(console.error);
    }

    async function start(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "Please choose an option to configure:\n\n1️⃣ Welcome Message\n2️⃣ Leave Message\n3️⃣ Boost Message\n4️⃣ Giveaway Emoji\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < panelEmoji.length; i++) {
        await msg.react(panelEmoji[i]);
      }
      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = panelEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        return await welcome(msg, panelEmbed);
      }
      if (receivedID == 1) return await leave(msg, panelEmbed);
      if (receivedID == 2) return await boost(msg, panelEmbed);
      if (receivedID == 3) return await giveaway(msg, panelEmbed);
      if (receivedID == 4) {
        return await end(msg, panelEmbed);
      }
    }

    async function welcome(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Welcome Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n3️⃣ Image\n4️⃣ Autorole\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < welcomeEmoji.length; i++) {
        await msg.react(welcomeEmoji[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = welcomeEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await welcomeMsg(msg, panelEmbed);
      if (receivedID == 1) return await welcomeChannel(msg, panelEmbed);
      if (receivedID == 2) return await welcomeImage(msg, panelEmbed);
      if (receivedID == 3) return await welcomeAutorole(msg, panelEmbed);
      if (receivedID == 4) {
        return await start(msg, panelEmbed);
      }

      if (receivedID == 5) {
        return await end(msg, panelEmbed);
      }
    }

    async function welcomeMsg(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Welcome Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Welcome Message/Message/Set**\nPlease enter the Welcome Message in this channel."
          )
          .setFooter(
            "Please enter within 120 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 120000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));
        if (msgCollected === undefined) return await timedOut(msg, panelEmbed);
        const contents = msgCollected.first().content.replace(/'/g, "\\'");

        msgCollected.first().delete();

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET welcome = '" +
            contents +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }

      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Welcome Message/Message/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET welcome = NULL WHERE id = " + message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Message/Reset**\nWelcome Message was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await welcome(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }

    async function welcomeChannel(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Welcome Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Welcome Message/Channel/Set**\nPlease mention the Welcome Channel in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));
        if (msgCollected.first() === undefined) return await timedOut(msg, panelEmbed);

        const channelID = msgCollected
          .first()
          .content.replace(/<#/g, "")
          .replace(/>/g, "");
        msgCollected.first().delete();
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel || channel == undefined || channel == null) {
          panelEmbed
            .setDescription(
              "**Welcome Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds..."
            )
            .setFooter(
              "Please wait patiently.",
              msg.client.user.displayAvatarURL()
            );
          await msg.edit(panelEmbed);

          return setTimeout(function () {
            start(msg, panelEmbed);
          }, 3000);
        }

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET wel_channel = '" +
            channelID +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Welcome Message/Channel/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET wel_channel = NULL WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) throw err;
              panelEmbed
                .setDescription(
                  "**Welcome Message/Channel/Reset**\nWelcome Channel was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await welcome(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }

    async function welcomeImage(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Welcome Message/Image**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Welcome Message/Image/Set**\nPlease paste the Welcome Image or its link in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        if (msgCollected.first().attachments.size == 0) {
          var attachment = msgCollected.first().content;
        } else {
          var attachment = msgCollected
            .first()
            .attachments.values()
            .next().value.attachment;
        }
        msgCollected.first().delete();
        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(`SELECT wel_img FROM servers WHERE id = '${message.guild.id}'`, (err, results) => {
            if (err) return message.reply("there was an error trying to fetch data from the database!");
            let urls = "";
            urls = [attachment];
            if (results[0].wel_img) {
              try {
                let old = JSON.parse(results[0].wel_img);
                old.push(attachment);
                urls = old;
              } catch (err) {
                urls = [attachment];
              }
            }
            con.query(
              "UPDATE servers SET wel_img = '" +
              JSON.stringify(urls) +
              "' WHERE id = " +
              message.guild.id,
              async function (err) {
                if (err) return message.reply("there was an error trying to update the configuration!");
                panelEmbed
                  .setDescription(
                    "**Welcome Message/Image/Set**\nImage received! Returning to panel main page in 3 seconds..."
                  )
                  .setFooter(
                    "Please wait patiently.",
                    msg.client.user.displayAvatarURL()
                  );
                await msg.edit(panelEmbed);
                return setTimeout(function () {
                  start(msg, panelEmbed);
                }, 3000);
              }
            );
          });
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Welcome Message/Image/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET wel_img = NULL WHERE id = " + message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Image/Reset**\nWelcome Image was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await welcome(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }

    async function welcomeAutorole(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Welcome Message/Autorole**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Welcome Message/Autorole/Set**\nPlease mention the roles or its ID in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        var collectedArgs = msgCollected.first().content.split(/ +/);
        var roles = [];
        msgCollected.first().delete();

        for (var i = 0; i < collectedArgs.length; i++) {
          if (
            isNaN(
              parseInt(collectedArgs[i].replace(/<@&/g, "").replace(/>/g, ""))
            )
          ) {
            panelEmbed
              .setDescription(
                "**Welcome Message/Autorole/Set**\nOne of the role is not valid! Returning to panel main page in 3 seconds..."
              )
              .setFooter(
                "Please wait patiently.",
                msg.client.user.displayAvatarURL()
              );
            await msg.edit(panelEmbed);
            return setTimeout(function () {
              start(msg, panelEmbed);
            }, 3000);
          }
          await roles.push(
            collectedArgs[i].replace(/<@&/g, "").replace(/>/g, "")
          );
        }

        pool.getConnection(async function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET autorole = '" +
            JSON.stringify(roles) +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Autorole/Set**\nRoles received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Welcome Message/Autorole/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET autorole = '[]' WHERE id = " + message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Welcome Message/Autorole/Reset**\nAutorole was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await welcome(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }

    async function leave(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Leave Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < leaveEmoji.length; i++) {
        await msg.react(leaveEmoji[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = leaveEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await leaveMsg(msg, panelEmbed);
      if (receivedID == 1) return await leaveChannel(msg, panelEmbed);
      if (receivedID == 2) return await start(msg, panelEmbed);
      if (receivedID == 3) return await end(msg, panelEmbed);
    }

    async function leaveMsg(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Leave Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Leave Message/Message/Set**\nPlease enter the Leave Message in this channel."
          )
          .setFooter(
            "Please enter within 120 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 120000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        const contents = msgCollected.first().content.replace(/'/g, "\\'");

        msgCollected.first().delete();

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET leave_msg = '" +
            contents +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Leave Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }

      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Leave Message/Message/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET leave_msg = NULL WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Leave Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await leave(msg, panelEmbed);
      if (receivedID == 3) return await end(msg, panelEmbed);
    }

    async function leaveChannel(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Leave Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Leave Message/Channel/Set**\nPlease mention the Leave Channel in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        const channelID = msgCollected
          .first()
          .content.replace(/<#/g, "")
          .replace(/>/g, "");
        msgCollected.first().delete();
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel || channel == undefined || channel == null) {
          panelEmbed
            .setDescription(
              "**Leave Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds..."
            )
            .setFooter(
              "Please wait patiently.",
              msg.client.user.displayAvatarURL()
            );
          await msg.edit(panelEmbed);

          return setTimeout(function () {
            start(msg, panelEmbed);
          }, 3000);
        }

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET leave_channel = '" +
            channelID +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Leave Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Leave Message/Channel/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET leave_channel = NULL WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Leave Message/Channel/Reset**\nLeave Channel was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await leave(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }

    async function giveaway(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Giveaway Emoji**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Giveaway Emoji/Set**\nPlease enter the Giveaway Emoji you preferred in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));
        msgCollected.first().delete();
        pool.getConnection(function (err, con) {
          con.query(
            "UPDATE servers SET giveaway = '" +
            msgCollected.first().content +
            "' WHERE id = " +
            message.guild.id,
            async function (err, result) {
              if (err) throw err;
              panelEmbed
                .setDescription(
                  "**Giveaway Emoji/Set**\nEmoji received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Giveaway Emoji/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET giveaway = '🎉' WHERE id = " + message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Giveaway Emoji/Reset**\nGiveaway Emoji was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await start(msg, panelEmbed);
      if (receivedID == 3) return await end(msg, panelEmbed);
    }

    async function boost(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Boost Message**\nPlease choose an option to configure:\n\n1️⃣ Message\n2️⃣ Channel\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < leaveEmoji.length; i++) {
        await msg.react(leaveEmoji[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = leaveEmoji.indexOf(reaction.emoji.name);
      if (receivedID == 0) return await boostMsg(msg, panelEmbed);
      if (receivedID == 1) return await boostChannel(msg, panelEmbed);
      if (receivedID == 2) return await start(msg, panelEmbed);
      if (receivedID == 3) return await end(msg, panelEmbed);
    }

    async function boostMsg(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Boost Message/Message**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Boost Message/Message/Set**\nPlease enter the Boost Message in this channel."
          )
          .setFooter(
            "Please enter within 120 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 120000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        const contents = msgCollected.first().content.replace(/'/g, "\\'");

        msgCollected.first().delete();

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET boost_msg = '" +
            contents +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Boost Message/Message/Set**\nMessage received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }

      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Boost Message/Message/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET boost_msg = NULL WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Boost Message/Message/Reset**\nLeave Message was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await boost(msg, panelEmbed);
      if (receivedID == 3) return await end(msg, panelEmbed);
    }

    async function boostChannel(msg, panelEmbed) {
      panelEmbed
        .setDescription(
          "**Boost Message/Channel**\nPlease choose an option to configure:\n\n1️⃣ Set\n2️⃣ Reset\n⬅ Back\n⏹ Quit"
        )
        .setFooter(
          "Please choose within 60 seconds.",
          message.client.user.displayAvatarURL()
        );
      await msg.edit(panelEmbed);
      await msg.reactions.removeAll().catch(console.error);

      for (var i = 0; i < yesNo.length; i++) {
        await msg.react(yesNo[i]);
      }

      var collected = await msg
        .awaitReactions(filter, {
          idle: 6e4,
          max: 1,
          error: ["time"]
        })
        .catch(err => timedOut(msg, panelEmbed));

      const reaction = collected.first();
      let receivedID = yesNo.indexOf(reaction.emoji.name);
      if (receivedID == 0) {
        panelEmbed
          .setDescription(
            "**Boost Message/Channel/Set**\nPlease mention the Boost Channel in this channel."
          )
          .setFooter(
            "Please enter within 60 seconds.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        var msgCollected = await msg.channel
          .awaitMessages(msgFilter, { idle: 60000, max: 1, error: ["time"] })
          .catch(err => timedOut(msg, panelEmbed));

        const channelID = msgCollected
          .first()
          .content.replace(/<#/g, "")
          .replace(/>/g, "");
        msgCollected.first().delete();
        const channel = msg.guild.channels.resolve(channelID);
        if (!channel || channel == undefined || channel == null) {
          panelEmbed
            .setDescription(
              "**Boost Message/Channel/Set**\nThe channel is not valid! Returning to panel main page in 3 seconds..."
            )
            .setFooter(
              "Please wait patiently.",
              msg.client.user.displayAvatarURL()
            );
          await msg.edit(panelEmbed);

          return setTimeout(function () {
            start(msg, panelEmbed);
          }, 3000);
        }

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET boost_channel = '" +
            channelID +
            "' WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Boost Message/Channel/Set**\nChannel received! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 1) {
        panelEmbed
          .setDescription("**Boost Message/Channel/Reset**\nResetting...")
          .setFooter(
            "Please wait patiently.",
            msg.client.user.displayAvatarURL()
          );
        await msg.edit(panelEmbed);
        await msg.reactions.removeAll().catch(console.error);

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET boost_channel = NULL WHERE id = " +
            message.guild.id,
            async function (err) {
              if (err) return message.reply("there was an error trying to update the configuration!");
              panelEmbed
                .setDescription(
                  "**Boost Message/Channel/Reset**Boost Channel was reset! Returning to panel main page in 3 seconds..."
                )
                .setFooter(
                  "Please wait patiently.",
                  msg.client.user.displayAvatarURL()
                );
              await msg.edit(panelEmbed);
              return setTimeout(function () {
                start(msg, panelEmbed);
              }, 3000);
            }
          );
          con.release();
        });
      }
      if (receivedID == 2) return await boost(msg, panelEmbed);
      if (receivedID == 3) {
        return await end(msg, panelEmbed);
      }
    }
  }
};
