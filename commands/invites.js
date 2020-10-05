const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "invites",
  description: "Display information about users invited on the server.",
  usage: "[subcommand]",
  subcommands: ["me", "toggle"],
  aliases: ["inv"],
  category: 6,
  async execute(message, args, pool) {
    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };
    if (!args[0]) {
      const guild = message.guild;
      if(!guild.me.hasPermission(32)) return message.channel.send("I don't have the permission to fetch all server invites!");
      let members = Array.from(guild.members.cache.values());
      let invitedStr = [];
      let guildInvites = await guild.fetchInvites();
      for (const member of members) {
        let invites = await guildInvites.filter(
          i => i.inviter.id === member.id && i.guild.id === guild.id
        );
        let reducer = (a, b) => a + b;
        let uses = 0;
        if (invites.size > 0)
          uses = invites.map(i => (i.uses ? i.uses : 0)).reduce(reducer);
        if(uses == 0) continue;
        invitedStr.push({ text:`**${uses} users** from **${member.user.tag}**`, uses: uses });
      }
      const compare = (a, b) => {
        return -(a.uses - b.uses);
      }
      invitedStr.sort(compare);
      if (invitedStr.length <= 10) {
        let em = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle("Number of users invited")
          .setDescription(invitedStr.map(x => x.text).join("\n"))
          .setTimestamp()
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        return message.channel.send(em);
      } else {
        let pages = Math.ceil(invitedStr.length / 10);
        let allEmbeds = [];
        for (let i = 0; i < pages; i++) {
          let em = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`Number of users invited (Page ${i + 1}/${pages})`)
            .setDescription(invitedStr.slice(i * 10, (i * 10) + 10).map(x => x.text).join("\n"))
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL()
            );
          allEmbeds.push(em);
        }
        var s = 0;
        var msg = await message.channel.send(allEmbeds[0]);

        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(filter, {
          idle: 60000,
          errors: ["time"]
        });

        collector.on("collect", function(reaction, user) {
          reaction.users.remove(user.id);
          switch (reaction.emoji.name) {
            case "⏮":
              s = 0;
              msg.edit(allEmbeds[s]);
              break;
            case "◀":
              s -= 1;
              if (s < 0) {
                s = allEmbeds.length - 1;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "▶":
              s += 1;
              if (s > allEmbeds.length - 1) {
                s = 0;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "⏭":
              s = allEmbeds.length - 1;
              msg.edit(allEmbeds[s]);
              break;
            case "⏹":
              collector.emit("end");
              break;
          }
        });
        collector.on("end", function() {
          msg.reactions.removeAll().catch(console.error);
        });
      }
    } else if (args[0].toLowerCase() === "me") {
      const guild = message.guild;
      if(!guild.me.hasPermission(32)) return message.channel.send("I don't have the permission to fetch all server invites!");
      let guildInvites = await guild.fetchInvites();
      let invites = guildInvites.filter(i => i.inviter.id === message.author.id && i.guild.id === guild.id);
      let reducer = (a,b) => a+b;
      let uses = invites.map(i => i.uses ? i.uses : 0).reduce(reducer);
      let em = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(`Number of users invited (${message.author.tag})`)
      .setDescription(`In server **${guild.name}**`)
      .addField("Invited Users", uses, true)
      .addField("Links Created", invites.size, true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      message.channel.send(em);
    } else if (args[0].toLowerCase() === "toggle") {
      pool.getConnection((err, con) => {
        if(err) return message.reply("there was an error trying to remember your decision. Please try again later.");
        con.query(`SELECT * FROM nolog WHERE id = '${message.author.id}'`, (err, result) => {
          if(err) return message.reply("there was an error trying to get your previous decision!");
          if(result.length < 1) {
            con.query(`INSERT INTO nolog VALUES('${message.author.id}')`, err => {
              if(err) return message.reply("I cannot remember your decision right now! Please try again later.");
              console.noLog.push(message.author.id);
              message.channel.send("You will no longer receive message from me when someone joins the server with your links.");
            });
          } else {
            con.query(`DELETE FROM nolog WHERE id = '${message.author.id}'`, err => {
              if(err) return message.reply("I cannot remember your decision right now! Please try again later.");
              message.client.noLog.splice(message.client.noLog.indexOf(message.author.id), 1);
              message.channel.send("We will message you whenever someone joins the server with your links.");
            });
          }
        });
        con.release()
      });
    } else
      return message.channel.send(
        "That is not a subcommand! " +
          `Subcommands: **${this.subcommands.join(", ")}**`
      );
  }
};
