const moment = require("moment");
module.exports = {
  name: "role-message",
  description: "Allows you to create a message for users to react and join a role.",
  usage: "<subcommand>",
  subcommands: ["create", "refresh"],
  subaliases: ["cr", "re"],
  aliases: ["role-msg", "rm"],
  category: 0,
  async execute(message, args, pool) {
    if(!args[0]) {
      return message.channel.send("Please use a subcommand!" + ` Usage: ${message.prefix}${this.name}${this.usage}`);
    }
    if(args[0] === "create" || args[0] === "cr") {
      return await this.create(message, pool, console.rm);
    }
    if(args[0] === "refresh" || args[0] === "re") {
      return await this.refresh(message, args, pool);
    }
  },
  async create(message, pool, rm) {
    var msg = await message.channel.send("Please enter the message you want to send.");
    var collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 120000, max: 1, errors: ["time"] }).catch(console.error);
    if(collected.first() === undefined) {
      return msg.edit("Did not receive any message in time! Action cancelled.");
    }
    if (collected.first().content === "cancel") {
        await collected.first().delete();
        collected.first().delete();
        return msg.edit("Action cancelled.");
    }
    collected.first().delete();
    var pendingMsg = collected.first().content;
    await msg.edit("Message received.\n\nNow, please tell me where you want the message to go to by mentioning the channel.");
    var collected2 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 30000, max: 1, errors: ["time"]}).catch(console.error);
    if(collected2.first() === undefined) {
      return msg.edit("30 seconds have passed but you didn't mention any channel! Action cancelled.");
    }
    if (collected2.first().content === "cancel") {
        await collected2.first().delete();
        return msg.edit("Action cancelled.");
    }
    var channelID = collected2
      .first()
      .content.replace(/<#/g, "")
      .replace(/>/g, "");
    var channel = await message.guild.channels.resolve(channelID);
    if (!channel || channel === undefined || channel === null) {
      collected2.first().delete();
      return msg.edit(channelID + " isn't a valid channel!");
    }
    if(!channel.permissionsFor(message.guild.me).has(10240)) return msg.edit("I don't have the permission to send in this channel!");
    if(!channel.permissionsFor(message.member).has(10240)) return msg.edit("You don't have the permission to send in this channel!");
    await collected2.first().delete();
    await msg.edit(`Great! The channel will be <#${channel.id}>.\n\nAfter that, can you tell me what role you are giving the users? Please break a line for each role.`);
    var collected3 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 60000, max: 1, errors: ["time"] }).catch(console.error);
    if(collected3.first() === undefined) {
      return msg.edit("Sorry! Time's up! I can't stay for to long!");
    }
    if (collected3.first().content === "cancel") {
        await collected3.first().delete();
        return msg.edit("Action cancelled.");
    }
    if (collected3.first().content === "no") {
        await collected3.first().delete();
        return msg.edit("Hey! That's rude!");
    }
    collected3.first().delete();
    var lines = collected3.first().content.split("\n");
    var roles = [];
    for(const str of lines) {
       var roleID = str.replace(/<@&/g, "").replace(/>/g, "");
      if (isNaN(parseInt(roleID))) {
        var role = await message.guild.roles.cache.find(
          x => x.name.toLowerCase() === `${str.toLowerCase()}`
        );
        if (role === null) {
          return msg.edit(
            "No role was found with the name " + str
          );
        }
      } else {
        var role = await message.guild.roles.cache.get(roleID);
        if (role === null) {
          return msg.edit("No role was found!");
        }
      }
      if(!message.guild.me.permissions.has(268435456)) {
        return msg.edit("I don't have the permissions to add member to roles.");
      }
      if(!message.member.permissions.has(268435456)) {
        return msg.edit("You don't have the permissions to use this.");
      }
      var highest = message.guild.me.roles.highest.position;
      if(role.position > highest) {
        return msg.edit("I cannot assign this role to users.");
      }
      roles.push(role.id);
    }
    await msg.edit(`**${roles.length}** role${roles.length > 1 ? "s" : ""} received.\n\nAt last, you will need to provide the reactions/emojis you want for each role! Break a line for each of them.`);
    var collected4 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 60000, max: 1, errors: ["time"]}).catch(console.error);
    if(collected4.first() === undefined) {
      return msg.edit("Sorry! Time's up! I can't stay for too long!");
    }
    if (collected4.first().content === "cancel") {
        await collected4.first().delete();
        return msg.edit("Action cancelled.");
    }
    collected4.first().delete();
    var emojis = collected4.first().content.split("\n");
    var mesg = await channel.send(pendingMsg);
    for(const emoji of emojis) {
      mesg.react(emoji);
    }
    var now = new Date();
    rm.push({
      id: mesg.id,
      guild: message.guild.id,
      channel: channel.id,
      author: message.author.id,
      expiration: now,
      roles: JSON.stringify(roles),
      emojis: JSON.stringify(emojis)
    });
    pool.getConnection((err, con) => {
      if(err) return message.reply("there was an error while trying to connect to the database!");
      con.query(`INSERT INTO rolemsg VALUES('${mesg.id}', '${message.guild.id}', '${channel.id}', '${message.author.id}', '${moment(now.getTime() + (7 * 24 * 3600 * 1000)).format("YYYY-MM-DD HH:mm:ss")}', '${JSON.stringify(roles)}', '${JSON.stringify(emojis)}')`, (err, result) => {
        if(err) return message.reply("there was an error while inserting the data into the database!");
        message.channel.send("Successfully created record for message. The message will expire after 7 days.");
        async function expire(length) {
          setTimeout(() => {
            con.query(`SELECT expiration FROM rolemsg WHERE id = '${result.id}'`, (err, results) => {
              if(results.length == 0) return;
              var date = new Date();
              if(results[0].expiration - date <= 0) {
                con.query(`DELETE FROM rolemsg WHERE id = '${results[0].id}'`, async(err) => {
                  if(err) return console.error(err);
                  var channel = await message.client.channels.fetch(results[0].channel);
                  var msg = await channel.messages.fetch(results[0].id);
                  console.log("Deleted an expired role-message.");
                  msg.reactions.removeAll().catch(err => console.error("Failed to remove reactions but nevermind."));
                });
              } else {
                expire(results[0].expiration - date);
              }
            });
          }, length);
        }
        expire(7 * 24 * 3600 * 1000);
      });
      con.release();
    });
  },
  async refresh(message, args, pool) {
    pool.getConnection((err, con) => {
      if(err) return message.reply("there was an error while trying to connect to the database!");
      con.query(`SELECT * FROM rolemsg WHERE id = '${args[1]}' AND guild = '${message.guild.id}' AND author = '${message.author.id}'`, (err, results) => {
        if(err) return message.reply("there was an error while finding your message!");
        if(results.length == 0) return message.channel.send("No message was found with that ID!");
        con.query(`UPDATE rolemsg SET expiration = '${moment(Date.now() + (7 * 24 * 3600 * 1000)).format("YYYY-MM-DD HH:mm:ss")}' WHERE id = '${results[0].id}'`, (err) => {
          if(err) return message.reply("there was an error while refreshing the message!");
          message.channel.send("The message has been refreshed. It will last for 7 more days.")
        });
      });
      con.release();
    });
  }
}