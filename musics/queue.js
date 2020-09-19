const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "queue",
  description: "Display the current song queue.",
  aliases: ["q"],
  usage: " ",
  subcommands: ["save", "load", "delete", "list"],
  subaliases: ["s", "l", "d", "li"],
  async music(message, serverQueue, looping, queue, pool) {
    const args = message.content.split(" ");
    if (args[1] !== undefined && (args[1].toLowerCase() === "save" || args[1].toLowerCase() === "s")) {
      return await this.save(message, serverQueue, pool, args);
    }
    if (args[1] !== undefined && (args[1].toLowerCase() === "load" || args[1].toLowerCase() === "l")) {
      return await this.load(message, serverQueue, pool, args, queue);
    }
    if (
      args[1] !== undefined &&
      (args[1].toLowerCase() === "delete" || args[1].toLowerCase() === "d")
    ) {
      return await this.delete(message, serverQueue, pool, args);
    }
    if (args[1] !== undefined && (args[1].toLowerCase() === "list" || args[1].toLowerCase() === "li")) {
      return await this.list(message, pool);
    }
    if (!serverQueue || serverQueue.songs.length < 1) return message.channel.send("There is nothing playing.");
    var index = 0;
    var songArray = serverQueue.songs.map(song => {
      var str;
      if (song.type === 0 || song.type === 2 || song.type === 3 || !song.type)
        str = `**${++index} - ** **[${song.title}](${song.url})** : **${
          song.time
        }**`;
      else if (song.type === 1)
        str = `**${++index} - ** **[${song.title}](${song.spot})** : **${
          song.time
        }**`;

      return str;
    });

    var allEmbeds = [];

    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

      for (let i = 0; i < Math.ceil(songArray.length / 10); i++) {
        var pageArray = songArray.slice(i * 10, i * 10 + 10);
        var queueEmbed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle(
            `Song queue for ${message.guild.name} [${i + 1}/${Math.ceil(
              songArray.length / 10
            )}]`
          )
          .setDescription(
            "There are " +
              songArray.length +
              " tracks in total.\n\n" +
              pageArray.join("\n")
          )
          .setTimestamp()
          .setFooter(
            "Now playing: " +
              (serverQueue.songs[0] ? serverQueue.songs[0].title : "Nothing"),
            message.client.user.displayAvatarURL()
          );

        allEmbeds.push(queueEmbed);
      }

    if (allEmbeds.length == 1) {
      message.channel.send(allEmbeds[0]).then(msg => {
        setTimeout(() => {
          msg.edit({ embed: null, content: "**[Insert Queue Information Here]**" })
        }, 60000);
      });
    } else {
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
        setTimeout(() => {
          msg.edit({ embed: null, content: "**[Insert Queue Information Here]**" })
        }, 60000);
      });
    }
  },
  save(message, serverQueue, pool, args) {
    if (!serverQueue)
      return message.channel.send(
        "There is no queue playing in this server right now!"
      );
    pool.getConnection(function(err, con) {
      if (err)
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      con.query(
        "SELECT * FROM queue WHERE user = '" + message.author.id + "'",
        async function(err, results) {
          if (err)
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          if (results.length >= 10) {
            return message.channel.send(
              "You have already stored 10 queues! Delete some of them to save this queue."
            );
          }
          if (!args[2]) {
            return message.channel.send(
              "Please provide the name of the queue."
            );
          }
          for (const result of results) {
            if (
              result.name.toLowerCase() ===
              args
                .slice(2)
                .join(" ")
                .toLowerCase()
            ) {
              var em = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle("Warning")
              .setDescription(`There is already a queue named **${args.slice(2).join(" ")}** stored. Do you want to override it?\n✅ Yes\n❌ No`)
              .setTimestamp()
              .setFooter("Please answer in 30 seconds.", message.client.user.displayAvatarURL());
              var msg = await message.channel.send(em);
              await msg.react("✅");
              await msg.react("❌");
              var collected = await msg.awaitReactions((r, u) => (["✅", "❌"].includes(r.emoji.name) && u.id === message.author.id), { time: 30000, max: 1, errors: ["time"] });
              await msg.reactions.removeAll().catch(console.error);
              if(!collected || !collected.first()) return msg.edit({ content: "I cannot receive your answer! I'll take that as a NO.", embed: null });
              if(collected.first().emoji.name === "✅") {
                await msg.edit({ content: `The queue ${args.slice(2).join(" ")} will be overrided.`, embed: null });
                continue;
              } else return await msg.edit({ content: `Action cancelled. The queue ${args.slice(2).join(" ")} will not be overrided.`, embed: null });
            }
          }
          con.query(
            "INSERT INTO queue(user, name, queue) " +
              `VALUES('${message.author.id}', '${args
                .slice(2)
                .join(" ")}', '${escape(JSON.stringify(serverQueue.songs))}')`,
            function(err) {
              if (err)
                return message.reply(
                  "there was an error trying to store the queue!"
                );
              message.channel.send(
                "The song queue has been stored with the name **" +
                  args.slice(2).join(" ") +
                  "**!" +
                  `\nSlots used: **${results.length + 1}/10**`
              );
            }
          );
        }
      );
      con.release();
    });
  },
  load(message, serverQueue, pool, args, queue) {
    if(serverQueue && serverQueue.playing) {
      return message.channel.send("Someone is listening to the music. Don't ruin their day.");
    }
    if (!args[2]) {
      return message.channel.send("Please provide the name of the queue.");
    }
    pool.getConnection(function(err, con) {
      if (err)
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      con.query(
        "SELECT * FROM queue WHERE LOWER(name) = '" +
          args
            .slice(2)
            .join(" ")
            .toLowerCase() +
          "' AND user = '" +
          message.author.id +
          "'",
        function(err, results) {
          if (err)
            return message.reply(
              "there was an error trying to fetch queues from the database!"
            );
          if (results.length == 0) {
            return message.channel.send("No queue was found!");
          }
          if (!serverQueue) {
            if (message.member.voice && message.member.voice.channel) {
              var voiceChannel = message.member.voice.channel;
            } else {
              var voiceChannel = null;
            }
            var queueContruct = {
              textChannel: message.channel,
              voiceChannel: voiceChannel,
              connection: null,
              songs: JSON.parse(unescape(results[0].queue)),
              volume: 1,
              playing: true,
              paused: false,
              startTime: 0
            };
            queue.set(message.guild.id, queueContruct);
          } else serverQueue.songs = JSON.parse(unescape(results[0].queue));
          con.query(
            `UPDATE servers SET queue = '${results[0].queue}' WHERE id = '${message.guild.id}'`,
            function(err) {
              if (err)
                return message.reply(
                  "there was an error trying to update the queue!"
                );
              message.channel.send(
                `The queue **${results[0].name}** has been loaded.`
              );
            }
          );
        }
      );
      con.release();
    });
  },
  delete(message, serverQueue, pool, args) {
    if (!args[2]) {
      return message.channel.send("Please provide the name of the queue.");
    }
    pool.getConnection(function(err, con) {
      if (err)
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      con.query(
        "SELECT * FROM queue WHERE LOWER(name) = '" +
          args
            .slice(2)
            .join(" ")
            .toLowerCase() +
          "' AND user = '" +
          message.author.id +
          "'",
        function(err, results) {
          if (err)
            return message.reply(
              "there was an error trying to fetch queues from the database!"
            );
          if (results.length == 0) {
            return message.channel.send("No queue was found!");
          }
          con.query(`DELETE FROM queue WHERE id = ${results[0].id}`, function(
            err
          ) {
            if (err)
              return message.reply(
                "there was an error trying to delete the queue!"
              );
            message.channel.send(
              `The stored queue **${results[0].name}** has been deleted.`
            );
          });
        }
      );
      con.release();
    });
  },
  list(message, pool) {
    pool.getConnection(function(err, con) {
      if (err)
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      con.query(
        "SELECT * FROM queue WHERE user = '" + message.author.id + "'",
        async function(err, results) {
          if (err)
            return message.reply(
              "there was an error trying to fetch the queues from the database!"
            );
          var queues = [];
          var num = 0;
          var allEmbeds = [];
          for (const result of results) {
            var queue = JSON.parse(unescape(result.queue));
            queues.push(
              `${++num}. **${result.name}** : **${queue.length} tracks**`
            );
            var pageArray = queue.map(song => {
              var str;
              if (song.type === 0 || song.type === 2 || song.type === 3 || !song.type)
                str = `**${++index} - ** **[${song.title}](${song.url})** : **${
                  song.time
                }**`;
              else if (song.type === 1)
                str = `**${++index} - ** **[${song.title}](${song.spot})** : **${
                  song.time
                }**`;
        
              return str;
            }).slice(0, 10);
            var queueEmbed = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle(`Queue - ${result.name}`)
              .setDescription(`There are ${queue.length} tracks in total.\n\n${pageArray.join("\n")}`)
              .setTimestamp()
              .setFooter(queue.length > pageArray.length ? "Cannot show all soundtracks here..." : "Here are all the soundtracks in this queue.", message.client.user.displayAvatarURL());
            allEmbeds.push(queueEmbed);
          }
          var emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
          var available = ["⬅", "⏹️"];
          const em = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`Stored queues of **${message.author.tag}**`)
            .setDescription(
              `Slots used: **${results.length}/10**\n\n${queues.join("\n")}`
            )
            .setTimestamp()
            .setFooter(
              "React to the numbers to view your queue.",
              message.client.user.displayAvatarURL()
            );
          allEmbeds.unshift(em);
          var msg = await message.channel.send(em);
          for(let i = 0; i < Math.min(num, 10); i++) {
            await msg.react(emojis[i]);
            available.push(emojis[i]);
          }
          await msg.react(available[1]);
          var collector = msg.createReactionCollector((r, u) => available.includes(r.emoji.name) && u.id === message.author.id, { idle: 30000 });
          collector.on("collect", async function(reaction, user) {
            reaction.users.remove(user.id);
            let index = available.indexOf(reaction.emoji.name);
            if(index < 0 || index > num + 2 || index == 1) return collector.emit("end");
            else if(index == 0) {
              let back = await msg.reactions.cache.get(available[0]);
              await back.remove().catch(console.error);
              msg.edit(allEmbeds[0]);
            } else {
              msg.edit(allEmbeds[index]);
              let stop = await msg.reactions.cache.get(available[1]);
              await stop.remove().catch(console.error);
              await msg.react(available[0]);
              await msg.react(available[1]);
            }
          });
          collector.on("end", function() {
            msg.reactions.removeAll().catch(console.error);
            msg.edit(allEmbeds[0]);
            setTimeout(() => {
              msg.edit({ embed: null, content: "**[Insert Queue Information Here]**" })
            }, 60000);
          });

        }
      );
      con.release();
    });
  }
};
