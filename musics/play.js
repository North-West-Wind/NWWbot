const Discord = require("discord.js");
const { validURL, validYTURL, decodeHtmlEntity } = require("../function.js");
const ytdl = require("ytdl-core-discord");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "play",
  description: "Play some music!",
  aliases: ["add"],
  async music(message, serverQueue, looping, queue) {
    const args = message.content.split(/ +/);

    if (!args[1]) {
      return message.channel.send(
        "Please provide a link or keywords to get a music played!"
      );
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send("I can't play in your voice channel!");
    }

    const checkURL = validURL(args[1]);

    if (checkURL === true) {
      if (validYTURL(args[1]) === false) {
        return message.channel.send(
          "We only support YouTube video links, sorry!"
        );
      }
      try {
        var songInfo = await ytdl.getInfo(args[1]);
      } catch (err) {
        return message.channel.send("No video was found!");
      }
      let song = {
        id: songInfo.video_id,
        title: songInfo.title,
        url: songInfo.video_url
      };

      if (!serverQueue) {
        const queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
          var connection = await voiceChannel.join();
          queueContruct.connection = connection;

          this.play(message.guild, queueContruct.songs[0], looping, queue);
          const Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Now playing:")
            .setThumbnail(
              `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`
            )
            .setDescription(`**[${song.title}](${song.url})**`)
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL()
            );
          message.channel.send(Embed);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
        serverQueue.songs.push(song);

        const Embed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle("New song added:")
          .setThumbnail(
            `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`
          )
          .setDescription(`**[${song.title}](${song.url})**`)
          .setTimestamp()
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        return message.channel.send(Embed);
      }
    } else {
      const Embed = new Discord.MessageEmbed()
        .setTitle("Search result of " + args.slice(1).join(" "))
        .setColor(color)
        .setTimestamp()
        .setFooter(
          "Choose your song, or ⏹ to cancel.",
          message.client.user.displayAvatarURL()
        );
      const results = [];
      var saved = [];
      const video = await youtube.search(args.slice(1).join(" "), 10);
      var num = 0;
      for (let i = 0; i < video.length; i++) {
        try {
          saved.push(video[i]);
          results.push(
            ++num +
              " - [" +
              decodeHtmlEntity(video[i].title) +
              "](" +
              video[i].url +
              ")"
          );
        } catch {
          --num;
        }
      }
      Embed.setDescription(results.join("\n"));
      message.channel.send(Embed).then(async msg => {
        if (results[0]) {
          await msg.react("1️⃣");
        }
        if (results[1]) {
          await msg.react("2️⃣");
        }
        if (results[2]) {
          await msg.react("3️⃣");
        }
        if (results[3]) {
          await msg.react("4️⃣");
        }
        if (results[4]) {
          await msg.react("5️⃣");
        }
        if (results[5]) {
          await msg.react("6️⃣");
        }
        if (results[6]) {
          await msg.react("7️⃣");
        }
        if (results[7]) {
          await msg.react("8️⃣");
        }
        if (results[8]) {
          await msg.react("9️⃣");
        }
        if (results[9]) {
          await msg.react("🔟");
        }

        await msg.react("⏹");

        const filter = (reaction, user) => {
          return (
            [
              "1️⃣",
              "2️⃣",
              "3️⃣",
              "4️⃣",
              "5️⃣",
              "6️⃣",
              "7️⃣",
              "8️⃣",
              "9️⃣",
              "🔟",
              "⏹"
            ].includes(reaction.emoji.name) && user.id === message.author.id
          );
        };

        msg
          .awaitReactions(filter, { max: 1, time: 30000, error: ["time"] })
          .then(async collected => {
            const reaction = collected.first();
            if (reaction.emoji.name === "⏹") {
              msg.reactions.removeAll().catch(err => {
                console.log(err);
              });
              const cancelled = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("Action cancelled.")
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  message.client.user.displayAvatarURL()
                );

              return msg.edit(cancelled);
            }

            if (reaction.emoji.name === "1️⃣") {
              var s = 0;
            }

            if (reaction.emoji.name === "2️⃣") {
              var s = 1;
            }

            if (reaction.emoji.name === "3️⃣") {
              var s = 2;
            }

            if (reaction.emoji.name === "4️⃣") {
              var s = 3;
            }

            if (reaction.emoji.name === "5️⃣") {
              var s = 4;
            }

            if (reaction.emoji.name === "6️⃣") {
              var s = 5;
            }

            if (reaction.emoji.name === "7️⃣") {
              var s = 6;
            }

            if (reaction.emoji.name === "8️⃣") {
              var s = 7;
            }

            if (reaction.emoji.name === "9️⃣") {
              var s = 8;
            }

            if (reaction.emoji.name === "🔟") {
              var s = 9;
            }

            const chosenEmbed = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle("Music chosen:")
              .setThumbnail(
                `https://img.youtube.com/vi/${saved[s].id}/maxresdefault.jpg`
              )
              .setDescription(
                `**[${decodeHtmlEntity(saved[s].title)}](${saved[s].url})**`
              )
              .setTimestamp()
              .setFooter(
                "Have a nice day :)",
                message.client.user.displayAvatarURL()
              );

            msg.edit(chosenEmbed);
            msg.reactions.removeAll().catch(err => {
              console.log(err);
            });
            var songInfo = await ytdl.getInfo(saved[s].url);

            var song = {
              id: songInfo.video_id,
              title: songInfo.title,
              url: songInfo.video_url
            };

            if (!serverQueue) {
              const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
              };

              queue.set(message.guild.id, queueContruct);

              queueContruct.songs.push(song);

              try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;

                this.play(message.guild, queueContruct.songs[0], looping, queue);
                const Embed = new Discord.MessageEmbed()
                  .setColor(color)
                  .setTitle("Now playing:")
                  .setThumbnail(
                    `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`
                  )
                  .setDescription(`**[${song.title}](${song.url})**`)
                  .setTimestamp()
                  .setFooter(
                    "Have a nice day! :)",
                    message.client.user.displayAvatarURL()
                  );
                msg.edit(Embed);
              } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return console.error(err);
              }
            } else {
              serverQueue.songs.push(song);

              const Embed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("New song added:")
                .setThumbnail(
                  `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`
                )
                .setDescription(`**[${song.title}](${song.url})**`)
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  message.client.user.displayAvatarURL()
                );
              return msg.edit(Embed);
            }
          })
          .catch(err => {
            const Ended = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle("Action cancelled.")
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                message.client.user.displayAvatarURL()
              );
            msg.edit(Ended);
            msg.reactions.removeAll().catch(err => {
              console.log(err);
            });
          });
      });
    }
  },
  async play(guild, song, looping, queue) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
      guild.me.voice.channel.leave();
      queue.delete(guild.id);

      return;
    }


    const dispatcher = serverQueue.connection
      .play(await ytdl(song.url, { highWaterMark: 1 << 27 }), { type: "opus" })
      .on("finish", () => {
        const guildLoopStatus = looping.get(guild.id);
        if (
          guildLoopStatus === undefined ||
          guildLoopStatus === null ||
          !guildLoopStatus ||
          guildLoopStatus === false
        ) {
          console.log("Music ended! In " + guild.name);
          serverQueue.songs.shift();
          this.play(guild, serverQueue.songs[0], looping, queue);
        } else {
          console.log("Music ended! In " + guild.name);
          serverQueue.songs.push(song);
          serverQueue.songs.shift();

          this.play(guild, serverQueue.songs[0], looping, queue);
        }
      })
      .on("error", error => {
        console.error(error);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  }
};
