const Discord = require("discord.js");
const {
  validURL,
  validYTURL,
  validSPURL,
  isGoodMusicVideoContent,
  decodeHtmlEntity,
  encodeHtmlEntity
} = require("../function.js");
const ytdl = require("ytdl-core-discord");
const YouTube = require("simple-youtube-api");
var youtube = new YouTube(process.env.YT);
var color = Math.floor(Math.random() * 16777214) + 1;
var SpotifyWebApi = require("spotify-web-api-node");
// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTID,
  clientSecret: process.env.SPOTSECRET,
  redirectUri: "https://nwws.ml"
});

async function play(guild, song, looping, queue, pool) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    guild.me.voice.channel.leave();
    queue.delete(guild.id);
    pool.getConnection(function(err, con) {
      con.query(
        "UPDATE servers SET queue = NULL WHERE id = " + guild.id,
        function(err, result) {
          if (err) throw err;
          console.log("Updated song queue of " + guild.name);
        }
      );
      con.release();
    });
    return;
  }

  const dispatcher = serverQueue.connection
    .play(await ytdl(song.url, { highWaterMark: 1 << 28 }), { type: "opus" })
    .on("finish", async () => {
      const guildLoopStatus = looping.get(guild.id);
      if (
        guildLoopStatus === undefined ||
        guildLoopStatus === null ||
        !guildLoopStatus ||
        guildLoopStatus === false
      ) {
        console.log("Music ended! In " + guild.name);
        await serverQueue.songs.shift();
        pool.getConnection(function(err, con) {
          con.query(
            "UPDATE servers SET queue = '" +
              escape(JSON.stringify(serverQueue.songs)) +
              "' WHERE id = " +
              guild.id,
            function(err, result) {
              if (err) throw err;
              console.log("Updated song queue of " + guild.name);
            }
          );
          con.release();
        });
        play(guild, serverQueue.songs[0], looping, queue, pool);
      } else {
        console.log("Music ended! In " + guild.name);
        await serverQueue.songs.push(song);
        await serverQueue.songs.shift();
        pool.getConnection(function(err, con) {
          con.query(
            "UPDATE servers SET queue = '" +
              escape(JSON.stringify(serverQueue.songs)) +
              "' WHERE id = " +
              guild.id,
            function(err, result) {
              if (err) throw err;
              console.log("Updated song queue of " + guild.name);
            }
          );
          con.release();
        });
        play(guild, serverQueue.songs[0], looping, queue, pool);
      }
    })
    .on("error", error => {
      console.error(error);
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

module.exports = {
  name: "play",
  description:
    "Play music with the link or keywords provided. Only support YouTube videos currently.",
  aliases: ["add"],
  usage: "<link | keywords>",
  async music(message, serverQueue, looping, queue, pool) {
    const args = message.content.split(/ +/);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send("I can't play in your voice channel!");
    }

    if (!args[1]) {
      pool.getConnection(function(err, con) {
        if (err)
          return message.reply(
            "there was an error trying to execute that command!"
          );
        con.query(
          "SELECT queue FROM servers WHERE id = " + message.guild.id,
          async function(err, result, fields) {
            if (err)
              return message.reply(
                "there was an error trying to execute that command!"
              );
            if (
              result.length == 0 ||
              result[0] == undefined ||
              result[0].queue == null
            ) {
              return message.channel.send(
                "No song queue found for this server! Please provide a link or keywords to get a music played!"
              );
            }
            var storedQueue = JSON.parse(unescape(result[0].queue));
            if (!serverQueue) {
              var queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: storedQueue,
                volume: 5,
                playing: true
              };
              if (!message.guild.me.voice.channel) {
                var connection = await voiceChannel.join();
              } else {
                var connection = message.guild.me.voice.connection;
              }
              queueContruct.connection = connection;
              queue.set(message.guild.id, queueContruct);
              play(message.guild, queueContruct.songs[0], looping, queue, pool);
              var song = storedQueue[0];
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
            } else {
              return message.channel.send("Music is already playing.");
            }
          }
        );
        con.release();
      });
      return;
    }

    const checkURL = validURL(args[1]);

    if (checkURL === true) {
      if (validYTURL(args[1]) === false) {
        //if (validSPURL(args[1]) === false)
          return message.channel.send(
            "We only support YouTube video links, sorry!"
          );

        var d = await spotifyApi.clientCredentialsGrant();

        await spotifyApi.setAccessToken(d.body.access_token);
        await spotifyApi.setRefreshToken(process.env.SPOTREFRESH);

        var refreshed = await spotifyApi
          .refreshAccessToken()
          .catch(console.error);

        console.log("The access token has been refreshed!");

        // Save the access token so that it's used in future calls
        await spotifyApi.setAccessToken(refreshed.body.access_token);

        var url_array = args[1].replace("https://", "").split("/");
        var musicID = url_array[2].split("?")[0];
        var type = url_array[1];
        var songs = [];
        switch (type) {
          case "playlist":
            var musics = await spotifyApi.getPlaylist(musicID);
            for (var i = 0; i < musics.body.tracks.items.length; i++) {
              var matched;
              var success = false;

              while (success === false) {
                try {
                  success = true;
                var results = await youtube.search(
                musics.body.tracks.items[i].track.artists[0].name +
                  " - " +
                  musics.body.tracks.items[i].track.name,
                100
              );
                } catch(err) {
                  success = false;
                  youtube = new YouTube(process.env.YT2)
                }
              }
              
              for (var s = 0; s < results.length; s++) {
                if (isGoodMusicVideoContent(results[s])) {
                  matched = {
                    id: results[s].id,
                    title: musics.body.tracks.items[i].track.name,
                    url: `https://www.youtube.com/watch?v=${results[s].id}`,
                    type: 1,
                    spot:
                      musics.body.tracks.items[i].track.external_urls.spotify,
                    thumbnail:
                      musics.body.tracks.items[i].track.album.images[0].url
                  };
                  songs.push(matched);
                  return;
                }
                if (s + 1 == results.length) {
                  matched = {
                    id: results[0].id,
                    title: musics.body.tracks.items[i].track.name,
                    url: `https://www.youtube.com/watch?v=${results[0].id}`,
                    type: 1,
                    spot:
                      musics.body.tracks.items[i].track.external_urls.spotify,
                    thumbnail:
                      musics.body.tracks.items[i].track.album.images[0].url
                  };
                  songs.push(matched);
                }
              }
            }
            break;
          case "album":
            var data = await spotifyApi
              .getAlbumTracks(musicID, {
                limit: 50
              })
              .catch(err => console.log("Something went wrong!", err));
            var tracks = data.body.items;

            for (var i = 0; i < tracks.length; i++) {
              var matched;
              var success = false;

              while (success === false) {
                try {
                  success = true;
                var results = await youtube
                  .search(
                    tracks[i].artists[0].name + " - " + tracks[i].name,
                    100
                  );
                } catch(err) {
                  success = false;
                  youtube = new YouTube(process.env.YT2)
                }
              }
              for (var s = 0; s < results.length; s++) {
                if (isGoodMusicVideoContent(results[s])) {
                  matched = {
                    id: results[s].id,
                    title: tracks[i].name,
                    url: `https://www.youtube.com/watch?v=${results[s].id}`,
                    type: 1,
                    spot: tracks[i].external_urls.spotify,
                    thumbnail: undefined
                  };
                  songs.push(matched);
                  break;
                }
                if (s + 1 == results.length) {
                  matched = {
                    id: results[0].id,
                    title: tracks[i].name,
                    url: `https://www.youtube.com/watch?v=${results[0].id}`,
                    type: 1,
                    spot: tracks[i].external_urls.spotify,
                    thumbnail: undefined
                  };
                  songs.push(matched);
                }
              }
            }

            break;
        }
      } else {
        try {
          var songInfo = await ytdl.getInfo(args[1]);
        } catch (err) {
          return message.channel.send("No video was found!");
        }
        var songs = [
          {
            id: songInfo.video_id,
            title: songInfo.title,
            url: songInfo.video_url,
            type: 0
          }
        ];
      }

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

        queueContruct.songs = songs;

        try {
          pool.getConnection(function(err, con) {
            con.query(
              "UPDATE servers SET queue = '" +
                escape(JSON.stringify(queueContruct.songs)) +
                "' WHERE id = " +
                message.guild.id,
              function(err, result) {
                if (err)
                  return message.reply(
                    "there was an error trying to execute that command!"
                  );
                console.log("Updated song queue of " + message.guild.name);
              }
            );
            con.release();
          });
          var connection = await voiceChannel.join();
          queueContruct.connection = connection;

          play(message.guild, queueContruct.songs[0], looping, queue, pool);

          const Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Now playing:")
            .setThumbnail(
              `https://img.youtube.com/vi/${songs[0].id}/maxresdefault.jpg`
            )
            .setDescription(`**[${songs[0].title}](${songs[0].url})**`)
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL()
            );
          if (songs.length > 1)
            Embed.setDescription(
              `**${songs.length}** songs were added.`
            ).setThumbnail(undefined);
          else if (songs[0].type === 1)
            Embed.setDescription(
              `**[${songs[0].title}](${songs[0].spot})**`
            ).setThumbnail(songs[0].thumbnail);
          message.channel.send(Embed);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
        for (var i = 0; i < songs.length; i++) serverQueue.songs.push(songs[i]);

        pool.getConnection(function(err, con) {
          con.query(
            "UPDATE servers SET queue = '" +
              escape(JSON.stringify(serverQueue.songs)) +
              "' WHERE id = " +
              message.guild.id,
            function(err, result) {
              if (err)
                return message.reply(
                  "there was an error trying to execute that command!"
                );
              console.log("Updated song queue of " + message.guild.name);
            }
          );
          con.release();
        });

        var Embed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle("New song added:")
          .setThumbnail(
            `https://img.youtube.com/vi/${songs[0].id}/maxresdefault.jpg`
          )
          .setDescription(`**[${songs[0].title}](${songs[0].url})**`)
          .setTimestamp()
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        if (songs.length > 1)
          Embed.setDescription(
            `**${songs.length}** songs were added.`
          ).setThumbnail(undefined);
        else if (songs[0].type === 1)
          Embed.setDescription(
            `**[${songs[0].title}](${songs[0].spot})**`
          ).setThumbnail(songs[0].thumbnail);
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
      var success = false;

              while (success === false) {
                try {
                  success = true;
                var video = await youtube.search(args.slice(1).join(" "), 10);
                } catch(err) {
                  success = false;
                  youtube = new YouTube(process.env.YT2)
                }
              }
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
      message.channel
        .send(Embed)
        .then(async msg => {
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
                  if (err.message == "Missing Permissions") {
                    msg.channel.send(
                      "Failed to remove reaction of my message due to missing permission."
                    );
                  }
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
                if (err.message == "Missing Permissions") {
                  msg.channel.send(
                    "Failed to remove reaction of my message due to missing permission."
                  );
                }
              });

              var songInfo = await ytdl.getInfo(saved[s].url);

              var song = {
                id: songInfo.video_id,
                title: songInfo.title,
                url: songInfo.video_url,
                type: 0
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

                await queueContruct.songs.push(song);
                pool.getConnection(function(err, con) {
                  con.query(
                    "UPDATE servers SET queue = '" +
                      escape(JSON.stringify(queueContruct.songs)) +
                      "' WHERE id = " +
                      message.guild.id,
                    function(err, result) {
                      if (err)
                        return message.reply(
                          "there was an error trying to execute that command!"
                        );
                      console.log(
                        "Updated song queue of " + message.guild.name
                      );
                    }
                  );
                  con.release();
                });
                try {
                  var connection = await voiceChannel.join();
                  queueContruct.connection = connection;

                  play(
                    message.guild,
                    queueContruct.songs[0],
                    looping,
                    queue,
                    pool
                  );
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
                await serverQueue.songs.push(song);
                pool.getConnection(function(err, con) {
                  con.query(
                    "UPDATE servers SET queue = '" +
                      escape(JSON.stringify(serverQueue.songs)) +
                      "' WHERE id = " +
                      message.guild.id,
                    function(err, result) {
                      if (err)
                        return message.reply(
                          "there was an error trying to execute that command!"
                        );
                      console.log(
                        "Updated song queue of " + message.guild.name
                      );
                    }
                  );
                  con.release();
                });
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
                if (err.message == "Missing Permissions") {
                  msg.channel.send(
                    "Failed to remove reaction of my message due to missing permission."
                  );
                }
              });
            });
        })
        .catch(err => {
          console.log("Failed to send Embed.");
          console.error(err);
        });
    }
  },
  async play(guild, song, looping, queue, pool) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
      guild.me.voice.channel.leave();
      queue.delete(guild.id);
      pool.getConnection(function(err, con) {
        con.query(
          "UPDATE servers SET queue = NULL WHERE id = " + guild.id,
          function(err, result) {
            if (err) throw err;
            console.log("Updated song queue of " + guild.name);
          }
        );
        con.release();
      });
      return;
    }

    const dispatcher = serverQueue.connection
      .play(await ytdl(song.url, { highWaterMark: 1 << 28 }), { type: "opus" })
      .on("finish", async () => {
        const guildLoopStatus = looping.get(guild.id);
        if (
          guildLoopStatus === undefined ||
          guildLoopStatus === null ||
          !guildLoopStatus ||
          guildLoopStatus === false
        ) {
          console.log("Music ended! In " + guild.name);
          await serverQueue.songs.shift();
          pool.getConnection(function(err, con) {
            con.query(
              "UPDATE servers SET queue = '" +
                escape(JSON.stringify(serverQueue.songs)) +
                "' WHERE id = " +
                guild.id,
              function(err, result) {
                if (err) throw err;
                console.log("Updated song queue of " + guild.name);
              }
            );
            con.release();
          });
          play(guild, serverQueue.songs[0], looping, queue, pool);
        } else {
          console.log("Music ended! In " + guild.name);
          await serverQueue.songs.push(song);
          await serverQueue.songs.shift();
          pool.getConnection(function(err, con) {
            con.query(
              "UPDATE servers SET queue = '" +
                escape(JSON.stringify(serverQueue.songs)) +
                "' WHERE id = " +
                guild.id,
              function(err, result) {
                if (err) throw err;
                console.log("Updated song queue of " + guild.name);
              }
            );
            con.release();
          });
          play(guild, serverQueue.songs[0], looping, queue, pool);
        }
      })
      .on("error", error => {
        console.error(error);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  }
};
