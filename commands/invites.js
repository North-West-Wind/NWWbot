const Discord = require("discord.js");
const { createEmbedScrolling, color } = require("../function.js");
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
  name: "invites",
  description: "Display information about users invited on the server.",
  usage: "[subcommand]",
  subcommands: ["me", "toggle"],
  aliases: ["inv"],
  async execute(message, args) {
    if (!args[0]) {
      const guild = message.guild;
      if (!guild.me.hasPermission(32)) return message.channel.send("I don't have the permission to fetch all server invites!");
      const members = Array.from((await guild.members.fetch()).values());
      const invitedStr = [];
      const guildInvites = await guild.fetchInvites();
      for (const member of members) {
        const invites = await guildInvites.filter(i => i.inviter.id === member.id && i.guild.id === guild.id);
        const reducer = (a, b) => a + b;
        var uses = 0;
        if (invites.size > 0) uses = invites.map(i => (i.uses ? i.uses : 0)).reduce(reducer);
        if (uses == 0) continue;
        invitedStr.push({ text: `**${uses} users** from **${member.user.tag}**`, uses: uses });
      }
      const compare = (a, b) => -(a.uses - b.uses);
      invitedStr.sort(compare);
      if (invitedStr.length <= 10) {
        const em = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Number of users invited")
          .setDescription(invitedStr.map(x => x.text).join("\n"))
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        return message.channel.send(em);
      } else {
        const pages = Math.ceil(invitedStr.length / 10);
        const allEmbeds = [];
        for (let i = 0; i < pages; i++) {
          const em = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(`Number of users invited (Page ${i + 1}/${pages})`)
            .setDescription(invitedStr.slice(i * 10, (i * 10) + 10).map(x => x.text).join("\n"))
            .setTimestamp()
            .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          allEmbeds.push(em);
        }
        await createEmbedScrolling(message, allEmbeds);
      }
    } else if (args[0].toLowerCase() === "me") {
      const guild = message.guild;
      if (!guild.me.hasPermission(32)) return message.channel.send("I don't have the permission to fetch all server invites!");
      let guildInvites = await guild.fetchInvites();
      const invites = guildInvites.filter(i => i.inviter.id === message.author.id && i.guild.id === guild.id);
      const reducer = (a, b) => a + b;
      var uses = invites.map(i => i.uses ? i.uses : 0).reduce(reducer);
      let em = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle(`Number of users invited (${message.author.tag})`)
        .setDescription(`In server **${guild.name}**`)
        .addField("Invited Users", uses, true)
        .addField("Links Created", invites.size, true)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      message.channel.send(em);
    } else if (args[0].toLowerCase() === "toggle") {
      const con = await message.pool.getConnection();
      try {
        var [result] = await con.query(`SELECT * FROM nolog WHERE id = '${message.author.id}'`);
        if (result.length < 1) {
          await con.query(`INSERT INTO nolog VALUES('${message.author.id}')`);
          NorthClient.storage.noLog.push(message.author.id);
          message.channel.send("You will no longer receive message from me when someone joins the server with your invites.");
        } else {
          con.query(`DELETE FROM nolog WHERE id = '${message.author.id}'`);
          NorthClient.storage.noLog.splice(NorthClient.storage.noLog.indexOf(message.author.id), 1);
          await message.channel.send("We will message you whenever someone joins the server with your invites.");
        }
      } catch(err) {
        NorthClient.storage.error(err);
        await message.reply("there was an error trying to remember your decision!");
      }
      con.release()
    } else await message.channel.send(`That is not a subcommand! Subcommands: **${this.subcommands.join(", ")}**`);
  }
};
