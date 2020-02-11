const { prefix } = require("./config.json");
const ytdl = require("ytdl-core-discord");
const Discord = require("discord.js");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);

const { validURL, validYTURL, encodeHtmlEntity, decodeHtmlEntity, shuffleArray } = require("./function.js")

var looping = new Map();

const queue = new Map();
var color = Math.floor(Math.random() * 16777214) + 1;
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };

const discord_js_1 = require("discord.js");




async function execute(message, serverQueue, pool) {
  const args = message.content.split(" ");
  
  if(!args[1]) {
    return message.channel.send("Please provide a link or keywords to get a music played!")
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
    
    if(validYTURL(args[1]) === false) {
      return message.channel.send("We only support YouTube video links, sorry!")
    }
    try {
    var songInfo = await ytdl.getInfo(args[1]);
    } catch (err) {
      return message.channel.send("No video was found!")
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
        
        play(message.guild, queueContruct.songs[0]);
        const Embed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle("Now playing:")
        .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
          .setDescription(`**[${song.title}](${song.url})**`)
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
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
      .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
        .setDescription(`**[${song.title}](${song.url})**`)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
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
          .setThumbnail(`https://img.youtube.com/vi/${saved[s].id}/maxresdefault.jpg`)
            .setDescription(
              `**[${decodeHtmlEntity(saved[s].title)}](${saved[s].url})**`
            )
            .setTimestamp()
            .setFooter("Have a nice day :)", message.client.user.displayAvatarURL());

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
              
              play(message.guild, queueContruct.songs[0]);
              const Embed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("Now playing:")
              .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
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
            .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
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
}

function skip(message, serverQueue) {
  const guild = message.guild;
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  const guildLoopStatus = looping.get(message.guild.id);
  serverQueue.connection.dispatcher.destroy();
  if (
        guildLoopStatus === undefined ||
        guildLoopStatus === null ||
        !guildLoopStatus ||
        guildLoopStatus === false
      ) {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      } else {
        console.log("Music ended! In " + guild.name);
        var song = serverQueue.songs[0];
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
        
        play(guild, serverQueue.songs[0]);
      }
  message.channel.send("Skipped!");
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.destroy();
  message.guild.me.voice.channel.leave();
  queue.delete(message.guild.id)
  message.channel.send(":wave:");
}

async function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    guild.me.voice.channel.leave();
    queue.delete(guild.id);
    
    return;
  }
  
  const voiceChannel = guild.me.voice.channel;
  
  if(voiceChannel.members.size <= 1) {
    setTimeout(function() {
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.destroy();
    }, 30000)
  }

  const dispatcher = serverQueue.connection
    .play(await ytdl(song.url, { highWaterMark: 1<<27 }), { type: "opus"})
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
        play(guild, serverQueue.songs[0]);
      } else {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
        
        play(guild, serverQueue.songs[0]);
      }
    })
    .on("error", error => {
      console.error(error);
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
function showQueue(message, serverQueue) {
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    return `**${++index} - ** [**${song.title}**](${song.url})`;
  });
  var queueEmbed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle("Song queue for " + message.guild.name)
  .setDescription("There are " + songArray.length + " songs in total.\n\n" + songArray.join("\n"))
  .setTimestamp()
  .setFooter("Now playing: " + serverQueue.songs[0].title, message.client.user.displayAvatarURL());
  message.channel.send(queueEmbed);
}

function nowPlaying(message, serverQueue) {
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  var embed = new Discord.MessageEmbed()
    .setColor(Math.floor(Math.random() * 16777214) + 1)
    .setTitle("Now playing:")
    .setDescription(
      `[**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url})`
    )
    .setTimestamp()
    .setThumbnail(`https://img.youtube.com/vi/${serverQueue.songs[0].id}/maxresdefault.jpg`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
  return message.channel.send(embed);
}

function lp(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  const guildLoopStatus = looping.get(message.guild.id);
  if (guildLoopStatus === undefined || guildLoopStatus === null || !guildLoopStatus) {
    
    looping.set(message.guild.id, true);
    message.channel.send("The song queue is now being looped.");
    
  } else {
    if (guildLoopStatus === false) {
      looping.set(message.guild.id, true)
      message.channel.send("The song queue is now being looped.");

      return;
    } else {
      looping.set(message.guild.id, false);
      message.channel.send("The song queue is no longer being looped.");
      return;
    }
  }
}

function remove(message, queueIndex) {
  if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
  if (typeof queueIndex !== "number")
    return message.channel.send("The query provided is not a number.");
  const serverQueue = queue.get(message.guild.id);
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  var deleteIndex = queueIndex - 1;
  if (deleteIndex === 0)
    return message.channel.send(
      `You cannot remove the song that is now playing. To remove it, use skip command instead.`
    );
  var removed = serverQueue.songs.splice(deleteIndex, 1);
  message.channel.send(
    `**${removed[0].title}** has been removed from the queue.`
  );
  
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");

  if (serverQueue.playing === true) {
    serverQueue.playing = false;
    serverQueue.connection.dispatcher.pause(true);
    return message.channel.send("The song playback has been stopped.");
  } else {
    return message.channel.send("The song playback is already stopped.");
  }
}

function resume(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");

  if (serverQueue.playing === false) {
    serverQueue.playing = true;
    serverQueue.connection.dispatcher.resume();
    return message.channel.send("The song playback has been resumed.");
  } else {
    return message.channel.send("The song playback is not stopped.");
  }
}

function shuffle(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");

  if (!serverQueue) return message.channel.send("There is nothing playing.");
  shuffleArray(serverQueue.songs);
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    return `**${++index}-** [${song.title}](${song.url})`;
  });
  var queueEmbed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle("Song queue for " + message.guild.name)
  .setDescription("There are " + songArray.length + " songs in total.\n\n" + songArray.join("\n"))
  .setTimestamp()
  .setFooter("Now playing: " + serverQueue.songs[0].title, message.client.user.displayAvatarURL());
  message.channel.send("Song queue has been shuffled.", queueEmbed);
}

module.exports = {
  checkAdminCmd: function(message, pool) {
    if (message.author.bot) return;
    if (message.channel instanceof Discord.DMChannel) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(/ +/);

    let command = message.content,
      found = false;
    const serverQueue = queue.get(message.guild.id);
    if (command.toLowerCase().startsWith(`${prefix}play`)) {
      execute(message, serverQueue, pool);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}altp`)) {
      execute(message, serverQueue, pool);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      found = true;
      return found;
    } else if (
      command.toLowerCase().startsWith(`${prefix}queue`) ||
      command.toLowerCase().startsWith(`${prefix}q`)
    ) {
      showQueue(message, serverQueue);
      found = true;
      return found;
    } else if (
      command.toLowerCase().startsWith(`${prefix}nowplaying`) ||
      command.toLowerCase().startsWith(`${prefix}np`)
    ) {
      nowPlaying(message, serverQueue);
      found = true;
      return found;
    } else if (
      command.toLowerCase().startsWith(`${prefix}loop`) ||
      command.toLowerCase().startsWith(`${prefix}lp`)
    ) {
      lp(message, serverQueue);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}remove`)) {
      var queueIndex = parseInt(args[1]);
      remove(message, queueIndex);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}pause`)) {
      pause(message, serverQueue);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}resume`)) {
      resume(message, serverQueue);
      found = true;
      return found;
    } else if (command.toLowerCase().startsWith(`${prefix}shuffle`)) {
      shuffle(message, serverQueue);
      found = true;
      return found;
    }
  }
};
