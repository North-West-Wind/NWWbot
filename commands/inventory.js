const Discord = require("discord.js");
const fs = require("fs");

module.exports = {
  name: "inventory",
  description: "Display your inventory.",
  aliases: ["e"],
  category: 2,
  async execute(message, args, pool) {
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query(
        "SELECT * FROM inventory WHERE id = '" + message.author.id + "'",
        function(err, result) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          var itemObject;
          if (result.length == 0) {
            itemObject = {
              "1": 0,
              "2": 0
            };
          } else {
            itemObject = JSON.parse(unescape(result[0].items));
          }
          con.query("SELECT * FROM shop", async function(err, IResult) {
            if (err) {
              console.error(err);
              return message.reply(
                "there was an error trying to execute that command!"
              );
            }
            var item = [];
            for (var i = 0; i < IResult.length; i++) {
              item.push(
                `**${IResult[i].id}.** ${IResult[i].name} - **${
                  itemObject[IResult[i].id.toString()]
                }**`
              );
            }
            const em = new Discord.MessageEmbed()
              .setColor(console.color())
              .setTitle(message.author.tag + "'s Inventory")
              .setDescription(item.join("\n"))
              .setTimestamp()
              .setFooter(
                "Type the ID of the item you want to use or `0` to exit.",
                message.client.user.displayAvatarURL()
              );
            var backupEm = new Discord.MessageEmbed()
              .setColor(console.color())
              .setTitle(message.author.tag + "'s Inventory")
              .setDescription(item.join("\n"))
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                message.client.user.displayAvatarURL()
              );

            var msg = await message.channel.send(em);
            var collected = await message.channel
              .awaitMessages(x => x.author.id === message.author.id, {
                max: 1,
                time: 30000,
                errors: ["time"]
              })
              .catch(console.error);
            if (collected === undefined) {
              em.setFooter(
                "Have a nice day! :)",
                message.client.user.displayAvatarURL()
              );
              return msg.edit(em);
            }
            collected.first().delete().catch(() => {});
            if (isNaN(parseInt(collected.first().content))) {
              em.setFooter(
                "Have a nice day! :)",
                message.client.user.displayAvatarURL()
              );
              return msg.edit(em);
            }
            var wanted = IResult.find(
              x => x.id === parseInt(collected.first().content)
            );
            if (!wanted) return;

            em.setTitle(wanted.name)
              .setDescription(
                wanted.description +
                  `\nQuantity: **${
                    itemObject[wanted.id.toString()]
                  }**\n\n1️⃣ Use\n2️⃣ Return`
              )
              .setFooter("Use item?", message.client.user.displayAvatarURL());
            msg.edit(em);
            await msg.react("1️⃣");
            await msg.react("2️⃣");

            var collected2 = await msg
              .awaitReactions(
                (reaction, user) =>
                  ["1️⃣", "2️⃣"].includes(reaction.emoji.name) &&
                  user.id === message.author.id,
                { max: 1, time: 30000, errors: ["time"] }
              )
              .catch(console.error);
            msg.reactions.removeAll().catch(console.error);
            if (collected2 === undefined) {
              return msg.edit(backupEm);
            }
            var r = collected2.first();
            if (r.emoji.name === "1️⃣") {
              if (itemObject[wanted.id.toString()] < 1) {
                msg.reactions.removeAll().catch(console.error);
                em.setDescription(
                  "You cannot use this item because you don't have any."
                ).setFooter(
                  "You can't do this.",
                  message.client.user.displayAvatarURL()
                );
                return msg.edit(em);
              }
              const itemFiles = fs
                .readdirSync(__dirname + "/../items")
                .filter(file => file.endsWith(".js"));
              const itemFile = itemFiles.find(
                x => x.slice(0, -3) === wanted.name.replace(/ /g, "")
              );
              const { run } = require(`../items/${itemFile}`);
              await run(message, args, msg, con, em, itemObject);
            } else {
              return msg.edit(backupEm);
            }
          });
        }
      );
      con.release();
    });
  }
};
