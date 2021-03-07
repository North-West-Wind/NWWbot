const moment = require("moment");
const { setTimeout_, genPermMsg, findRole } = require("../function.js");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
  name: "role-message",
  description: "Manage messages for users to react and join a role.",
  usage: "<subcommand>",
  subcommands: ["create", "refresh"],
  subdesc: ["Create a role-message.", "Refresh an existing role-message."],
  subusage: [null, "<subcommand> <ID>"],
  subaliases: ["cr", "re"],
  aliases: ["role-msg", "rm"],
  category: 0,
  args: 1,
  permission: 10240,
  async execute(message, args) {
    if (args[0] === "create" || args[0] === "cr") return await this.create(message);
    if (args[0] === "refresh" || args[0] === "re") return await this.refresh(message, args);
  },
  async create(message) {
    if (!message.guild.me.permissions.has(268435456)) return await message.channel.send(genPermMsg(268435456, 1));
    if (!message.member.permissions.has(268435456)) return await message.channel.send(genPermMsg(268435456, 0));
    var msg = await message.channel.send("Please enter the message you want to send.");
    const collected = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 120000, max: 1 }).catch(NorthClient.storage.error);
    if (!collected.first()) return await msg.edit("Did not receive any message in time! Action cancelled.");
    await collected.first().delete();
    const pendingMsg = collected.first().content;
    if (!pendingMsg) return await msg.edit("Did not receive any message! Action cancelled.");
    if (pendingMsg === "cancel") return await msg.edit("Action cancelled.");
    await msg.edit("Message received.\n\nNow, please tell me where you want the message to go to by mentioning the channel.");
    const collected2 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 30000, max: 1 }).catch(NorthClient.storage.error);
    if (!collected2.first()) return msg.edit("30 seconds have passed but you didn't mention any channel! Action cancelled.");
    await collected2.first().delete();
    if (!collected2.first().content) return await msg.edit("Did not receive any channel! Action cancelled.");
    if (collected2.first().content === "cancel") return await msg.edit("Action cancelled.");
    const channelID = collected2.first().content.replace(/<#/g, "").replace(/>/g, "");
    const channel = await message.guild.channels.resolve(channelID);
    if (!channel) return msg.edit(channelID + " isn't a valid channel!");
    if (!channel.permissionsFor(message.guild.me).has(this.permission)) return await msg.edit(genPermMsg(this.permission, 1));
    if (!channel.permissionsFor(message.member).has(this.permission)) return await msg.edit(genPermMsg(this.permission, 0));
    await msg.edit(`Great! The channel will be <#${channel.id}>.\n\nAfter that, can you tell me what role you are giving the users? Please break a line for each role.`);
    const collected3 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 60000, max: 1 }).catch(NorthClient.storage.error);
    if (!collected3.first()) return await msg.edit("Did not receive any role in time! Action cancelled.");
    await collected3.first().delete();
    if (!collected3.first().content) return await msg.edit("Did not receive any role! Action cancelled.");
    if (collected3.first().content === "cancel") return msg.edit("Action cancelled.");
    if (collected3.first().content === "no") return msg.edit("Hey! That's rude!");
    const roles = [];
    for (const str of collected3.first().content.split("\n")) {
      const roless = [];
      for (const stri of str.split(/ +/)) {
        const role = await findRole(message, stri);
        if (!role) return;
        const highest = message.guild.me.roles.highest.position;
        if (role.position > highest) return await msg.edit("I cannot assign this role to users.");
        roless.push(role.id);
      }
      roles.push(roless);
    }
    await msg.edit(`**${roles.length}** role${roles.length > 1 ? "s" : ""} received.\n\nAt last, you will need to provide the reactions/emojis you want for each role! Break a line for each of them.`);
    const collected4 = await message.channel.awaitMessages(x => x.author.id === message.author.id, { time: 60000, max: 1 }).catch(NorthClient.storage.error);
    if (!collected4.first()) return await msg.edit("Did not receive any emoji in time! Action cancelled.");
    if (!collected4.first().content) return await msg.edit("Did not receive any emoji! Action cancelled.");
    await collected4.first().delete();
    if (collected4.first().content === "cancel") return await msg.edit("Action cancelled.");
    collected4.first().delete();
    var emojis = collected4.first().content.split("\n");
    var mesg = await channel.send(pendingMsg);
    emojis.map(emoji => {
      const id = emoji.match(/\d+/g);
      if (!Array.isArray(id)) return emoji;
      else return id[id.length - 1];
    });
    try {
      for (const emoji of emojis) await mesg.react(emoji);
    } catch (err) {
      await mesg.delete();
      return await msg.edit("I cannot react with one of the reactions!");
    }
    var now = new Date();
    NorthClient.storage.rm.push({
      id: mesg.id,
      guild: message.guild.id,
      channel: channel.id,
      author: message.author.id,
      expiration: now,
      roles: JSON.stringify(roles),
      emojis: JSON.stringify(emojis)
    });
    try {
      await message.pool.query(`INSERT INTO rolemsg VALUES('${mesg.id}', '${message.guild.id}', '${channel.id}', '${message.author.id}', '${moment(now.getTime() + (7 * 24 * 3600 * 1000)).format("YYYY-MM-DD HH:mm:ss")}', '${JSON.stringify(roles)}', '${JSON.stringify(emojis)}')`);
      await message.channel.send("Successfully created record for message. The message will expire after 7 days.");
      this.expire(message, 7 * 24 * 3600 * 1000, mesg.id);
    } catch (err) {
      NorthClient.storage.error(err);
      await message.reply("there was an error trying to record the message!");
    }
  },
  async refresh(message, args) {
    const con = await message.pool.getConnection();
    try {
      var [results] = await con.query(`SELECT * FROM rolemsg WHERE id = '${args[1]}' AND guild = '${message.guild.id}' AND author = '${message.author.id}'`);
      if (results.length == 0) await message.channel.send("No message was found with that ID!");
      else {
        await con.query(`UPDATE rolemsg SET expiration = '${moment(Date.now() + (7 * 24 * 3600 * 1000)).format("YYYY-MM-DD HH:mm:ss")}' WHERE id = '${results[0].id}'`);
        await message.channel.send("The message has been refreshed. It will last for 7 more days.");
      }
    } catch (err) {
      NorthClient.storage.error(err);
      await message.reply("there was an error while refreshing the message!");
    }
    con.release();
  },
  expire: (message, length, id) => setTimeout_(async () => {
    const con = await message.pool.getConnection();
    try {
      var [results] = await con.query(`SELECT expiration, channel FROM rolemsg WHERE id = '${id}'`);
      if (!results[0]) throw new Error("No results");
      const date = new Date();
      if (results[0].expiration - date <= 0) {
        await con.query(`DELETE FROM rolemsg WHERE id = '${id}'`);
        const channel = await message.client.channels.fetch(results[0].channel);
        const msg = await channel.messages.fetch(results[0].id);
        msg.reactions.removeAll().catch(() => { });
      } else expire(message, results[0].expiration - date, id);
    } catch (err) {
      NorthClient.storage.error(err);
    }
    con.release();
  }, length)
}