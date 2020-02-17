const querystring = require("querystring");
const Discord = require("discord.js");
const fetch = require("node-fetch");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "urban",
  description: "Search in the Urban Dictionary.",
  args: true,
  async execute(message, args) {
    if (!args.length) {
      return message.channel.send("You need to supply a search term!");
    }

    const query = querystring.stringify({ term: args.join(" ") });

    const { list } = await fetch(
      `https://api.urbandictionary.com/v0/define?${query}`
    ).then(response => response.json());
    if (!list.length) {
      return message.channel.send(
        `No results found for **${args.join(" ")}**.`
      );
    }
    const trim = (str, max) =>
      str.length > max ? `${str.slice(0, max - 3)}...` : str;
    var allEmbeds = [];
    for (var i = 0; i < list.length; i++) {
      var answer = list[i];
      const embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(answer.word)
        .setURL(answer.permalink)
        .addField("Definition", trim(answer.definition, 1024))
        .addField("Example", trim(answer.example, 1024))
        .setTimestamp()
        .setFooter(
          `👍 ${answer.thumbs_up} | 👎 ${answer.thumbs_down}`,
          message.client.user.displayAvatarURL()
        );
      allEmbeds.push(embed);
    }

    var msg = await message.channel.send(allEmbeds[0]);
    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    var s = 0;

    try {
      await msg.react("⏮");
      await msg.react("◀");
      await msg.react("▶");
      await msg.react("⏭");
      await msg.react("⏹");
      await msg
        .awaitReactions(filter, {
          max: 1,
          time: 60000,
          errors: ["time"]
        })
        .then(async collected => {
          const reaction = collected.first();

          if (reaction.emoji.name === "◀") {
            s -= 1;
            if (s < 0) {
              s = list.length - 1;
            }
            reaction.users.remove(message.author.id);

            edit(msg, s);
          } else if (reaction.emoji.name === "▶") {
            s += 1;
            if (s > list.length - 1) {
              s = 0;
            }
            reaction.users.remove(message.author.id);
            edit(msg, s);
          } else if (reaction.emoji.name === "⏮") {
            s = 0;
            reaction.users.remove(message.author.id);

            edit(msg, s);
          } else if (reaction.emoji.name === "⏭") {
            s = list.length - 1;
            reaction.users.remove(message.author.id);

            edit(msg, s);
          } else {
            msg.reactions.removeAll().catch(err => {
              console.log(err);
            });
          }
        })
        .catch(collected => {
          msg.reactions.removeAll().catch(err => {
            console.log(err);
          });
        });
    } catch {
      err => {
        console.log(err);
      };
    }
    function edit(mesg, s) {
      mesg.edit(allEmbeds[s]).then(async msg => {
        try {
          await msg.react("⏮");
          await msg.react("◀");
          await msg.react("▶");
          await msg.react("⏭");
          await msg.react("⏹");
          await msg
            .awaitReactions(filter, {
              max: 1,
              time: 60000,
              errors: ["time"]
            })
            .then(async collected => {
              const reaction = collected.first();

              if (reaction.emoji.name === "◀") {
                s -= 1;
                if (s < 0) {
                  s = list.length - 1;
                }
                reaction.users.remove(message.author.id);

                edit(msg, s);
              } else if (reaction.emoji.name === "▶") {
                s += 1;
                if (s > list.length - 1) {
                  s = 0;
                }
                reaction.users.remove(message.author.id);

                edit(msg, s);
              } else if (reaction.emoji.name === "⏮") {
                s = 0;
                reaction.users.remove(message.author.id);

                edit(msg, s);
              } else if (reaction.emoji.name === "⏭") {
                s = list.length - 1;
                reaction.users.remove(message.author.id);

                edit(msg, s);
              } else {
                msg.reactions.removeAll().catch(err => {
                  console.log(err);
                });
              }
            })
            .catch(collected => {
              msg.reactions.removeAll().catch(err => {
                console.log(err);
              });
            });
        } catch {
          err => {
            console.log(err);
          };
        }
      });
    }
  }
};
