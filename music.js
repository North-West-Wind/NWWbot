const { prefix } = require("./config.json");
const ytdl = require("ytdl-core-discord");
const Discord = require("discord.js");
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}
function validYTURL(str) {
  var pattern = new RegExp("^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+"
  ); // fragment locator
  return !!pattern.test(str);
}
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
const musicFunctions = {
  addMusicQueueField(message, content, queue) {
    return __awaiter(this, void 0, void 0, function*() {
      const serverQueue = queue.get(message.guild.id);
      var toSendEmbed = [];
      var color = Math.floor(Math.random() * 16777214) + 1;
      let i = 0;
      while (i < content.length) {
        var embed = new discord_js_1.RichEmbed();
        let index = 0;
        while (i < content.length && index < 25) {
          var list = [];
          const element0 = content[i];
          index++;
          i++;
          const element1 = content[i];
          index++;
          i++;
          const element2 = content[i];
          index++;
          i++;
          const element3 = content[i];
          index++;
          i++;
          const element4 = content[i];
          index++;
          i++;
          list.push(element0);
          element1 ? list.push(element1) : console.log();
          element1 ? list.push(element2) : console.log();
          element1 ? list.push(element3) : console.log();
          element1 ? list.push(element4) : console.log();
          if (i < 25) {
            embed.setTitle(`Song queue for ${message.guild.name}`);
            embed.setDescription(
              `There are ${serverQueue.songs.length} songs in total.`
            );
            
          }
          embed.setTimestamp();
          embed.setFooter(`Now playing : ${serverQueue.songs[0].title}`, "https://i.imgur.com/hxbaDUY.png");
          embed.addField("** **", list.join("\n"));
          embed.setColor(color);
        }
        toSendEmbed.push(embed);
      }
      return toSendEmbed;
    });
  },
  handleVideo(
    queueList,
    video,
    message,
    voiceChannel,
    musicVolume = 20,
    loopQueue = false,
    top = false,
    playlist = false
  ) {
    return __awaiter(this, void 0, void 0, function*() {
      const serverQueue = queueList.get(message.guild.id);
      const song = {
        guild: message.guild.name,
        icon: video.thumbnails.default.url,
        id: video.id,
        length: {
          hrs: video.duration.hours,
          mins: video.duration.minutes,
          secs: video.duration.seconds
        },
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`
      };
      if (!serverQueue) {
        var queueConstruct = {
          connection: null,
          loop: loopQueue,
          repeat: false,
          playing: true,
          songs: [],
          textChannel: message.channel,
          voiceChannel,
          volume: musicVolume
        };
        queueList.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);
        console.log("Song added to queue.");
        try {
          var connection = yield voiceChannel.join();
          queueConstruct.connection = connection;
          musicFunctions.playMusic(
            message.guild,
            queueConstruct.songs[0],
            queueList
          );
        } catch (error) {
          console.error(`I could not join the voice channel: ${error}`);
          queueList.delete(message.guild.id);
          return message.channel
            .send(`I could not join the voice channel: ${error}`)
            .then(m => {
              return m.delete(10000).catch(reason => {
                console.log(
                  `Attempting to delete a deleted message (Which is impossible)`
                );
              });
            });
        }
      } else if (top) {
        serverQueue.songs.splice(1, 0, song);
        if (playlist) return undefined;
        else
          return message.channel
            .send(
              `✅ **${song.title}** has been added to the top of the queue!`
            )
            .then(m => {
              return m.delete(10000).catch(reason => {
                console.log(
                  `Attempting to delete a deleted message (Which is impossible)`
                );
              });
            });
      } else {
        serverQueue.songs.push(song);
        if (playlist) return undefined;
        else
          return message.channel
            .send(`✅ **${song.title}** has been added to the queue!`)
            .then(m => {
              return m.delete(10000).catch(reason => {
                console.log(
                  `Attempting to delete a deleted message (Which is impossible)`
                );
              });
            });
      }
      return undefined;
    });
  },
  playMusic(guild, song, queueList) {
    const serverQueue = queueList.get(guild.id);
    try {
      if (!song) {
        serverQueue.voiceChannel.leave();
        queueList.delete(guild.id);
        return;
      }
    } catch (error) {
      console.log(error);
    }
    const dispatcher = serverQueue.connection
      .playStream(
        ytdl(song.url, {
          filter: "audioonly",
          quality: "highestaudio"
        })
      )
      .on("end", reason => {
        if (serverQueue.loop === true) {
          console.log("Song ended, but looped");
          var toPush = serverQueue.songs[0];
          serverQueue.songs.push(toPush);
          serverQueue.songs.shift();
          musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
        } else if (serverQueue.repeat === true) {
          console.log("Song ended, but repeated");
          musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
        } else {
          if (reason === "Stream is not generating quickly enough.")
            console.log("Song ended.");
          else console.log(`${reason}`);
          serverQueue.songs.shift();
          musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
        }
      })
      .on("error", error => {
        return console.error(error);
      });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
    serverQueue.textChannel
      .send(`🎶 Start playing: **${song.title}**`)
      .then(m => {
        return m.delete(10000).catch(reason => {
          console.log(
            `Attempting to delete a deleted message (Which is impossible)`
          );
        });
      });
  },
  shuffleArray(array) {
    let temp = array[0];
    array.splice(0, 1);
    var i;
    var j;
    var x;
    for (i = array.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = array[i];
      array[i] = array[j];
      array[j] = x;
    }
    array.unshift(temp);
    temp = [];
    return array;
  }
};

var decodeHtmlEntity = function(str) {
  return str
    .replace(/&#(\d+);/g, function(match, dec) {
      return String.fromCharCode(dec);
    })
    .replace(/&quot;/g, `"`)
    .replace(/&amp;/g, `&`);
};

var encodeHtmlEntity = function(str) {
  var buf = [];
  for (var i = str.length - 1; i >= 0; i--) {
    buf.unshift(["&#", str[i].charCodeAt(), ";"].join(""));
  }
  return buf.join("");
};


async function execute(message, serverQueue, pool) {
  const args = message.content.split(" ");
  
  if(!args[1]) {
    return message.channel.send("Please provide a link or keywords to get a music played!")
  }

  const voiceChannel = message.member.voiceChannel;
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
        
        play(message.guild, queueContruct.songs[0], pool);
        const Embed = new Discord.RichEmbed()
          .setColor(color)
          .setTitle("Now playing:")
        .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
          .setDescription(`**[${song.title}](${song.url})**`)
          .setTimestamp()
          .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
        message.channel.send(Embed);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      
      const Embed = new Discord.RichEmbed()
        .setColor(color)
        .setTitle("New song added:")
      .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
        .setDescription(`**[${song.title}](${song.url})**`)
        .setTimestamp()
        .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
      return message.channel.send(Embed);
    }
  } else {
    const Embed = new Discord.RichEmbed()
      .setTitle("Search result of " + args.slice(1).join(" "))
      .setColor(color)
      .setTimestamp()
      .setFooter(
        "Choose your song, or ⏹ to cancel.",
        "https://i.imgur.com/hxbaDUY.png"
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
            msg.clearReactions().catch(err => {
              console.log(err);
            });
            const cancelled = new Discord.RichEmbed()
              .setColor(color)
              .setTitle("Action cancelled.")
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                "https://i.imgur.com/hxbaDUY.png"
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

          const chosenEmbed = new Discord.RichEmbed()
            .setColor(color)
            .setTitle("Music chosen:")
          .setThumbnail(`https://img.youtube.com/vi/${saved[s].id}/maxresdefault.jpg`)
            .setDescription(
              `**[${decodeHtmlEntity(saved[s].title)}](${saved[s].url})**`
            )
            .setTimestamp()
            .setFooter("Have a nice day :)", "https://i.imgur.com/hxbaDUY.png");

          msg.edit(chosenEmbed);
          msg.clearReactions().catch(err => {
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
              
              play(message.guild, queueContruct.songs[0], pool);
              const Embed = new Discord.RichEmbed()
                .setColor(color)
                .setTitle("Now playing:")
              .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
                .setDescription(`**[${song.title}](${song.url})**`)
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  "https://i.imgur.com/hxbaDUY.png"
                );
              msg.edit(Embed);
            } catch (err) {
              console.log(err);
              queue.delete(message.guild.id);
              return console.error(err);
            }
          } else {
            serverQueue.songs.push(song);
          
            const Embed = new Discord.RichEmbed()
              .setColor(color)
              .setTitle("New song added:")
            .setThumbnail(`https://img.youtube.com/vi/${song.id}/maxresdefault.jpg`)
              .setDescription(`**[${song.title}](${song.url})**`)
              .setTimestamp()
              .setFooter(
                "Have a nice day! :)",
                "https://i.imgur.com/hxbaDUY.png"
              );
            return msg.edit(Embed);
          }
        })
        .catch(err => {
          const Ended = new Discord.RichEmbed()
            .setColor(color)
            .setTitle("Action cancelled.")
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              "https://i.imgur.com/hxbaDUY.png"
            );
          msg.edit(Ended);
          msg.clearReactions().catch(err => {
            console.log(err);
          });
        });
    });
  }
}

function skip(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();

  message.channel.send("Skipped!");
}

function stop(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.channel.send(":wave:");
}

async function play(guild, song, pool) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    
    return;
  }

  const dispatcher = serverQueue.connection
    .playOpusStream(await ytdl(song.url, { highWaterMark: 1<<27 }))
    .on("end", () => {
      const guildLoopStatus = looping.get(guild.id);
      if (
        guildLoopStatus === undefined ||
        guildLoopStatus === null ||
        !guildLoopStatus ||
        guildLoopStatus === false
      ) {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.shift();
       
        play(guild, serverQueue.songs[0], pool);
      } else {
        console.log("Music ended! In " + guild.name);
        serverQueue.songs.push(song);
        serverQueue.songs.shift();
        
        play(guild, serverQueue.songs[0], pool);
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
    return `**${++index} - ** [${song.title}](${song.url})`;
  });
  musicFunctions.addMusicQueueField(message, songArray, queue).then(results =>
    __awaiter(this, void 0, void 0, function*() {
      for (let i = 0; i < results.length; i++) {
        const element = results[i];
        message.channel.send(element).then(m => {
          return;
        });
      }
    })
  );
}

function nowPlaying(message, serverQueue) {
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  var embed = new discord_js_1.RichEmbed()
    .setColor(Math.floor(Math.random() * 16777214) + 1)
    .setTitle("Now playing:")
    .setDescription(
      `[**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url})`
    )
    .setTimestamp()
    .setThumbnail(`https://img.youtube.com/vi/${serverQueue.songs[0].id}/maxresdefault.jpg`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
  return message.channel.send(embed);
}

function lp(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  const guildLoopStatus = looping.get(message.guild.id);
  if (guildLoopStatus === undefined || guildLoopStatus === null || guildLoopStatus) {
    
    looping.set(message.guild.id, true);
    message.channel.send("The song queue is now being looped.");
    
  } else {
    if (guildLoopStatus === false) {
      guildLoopStatus = true;
      message.channel.send("The song queue is now being looped.");

      return guildLoopStatus;
    } else {
      guildLoopStatus = false;
      message.channel.send("The song queue is no longer being looped.");
      return guildLoopStatus;
    }
  }
}

function remove(message, queueIndex) {
  if (!message.member.voiceChannel)
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
  if (!message.member.voiceChannel)
    return message.channel.send("You are not in a voice channel!");

  if (serverQueue.playing === true) {
    serverQueue.playing = false;
    serverQueue.connection.dispatcher.pause();
    return message.channel.send("The song playback has been stopped.");
  } else {
    return message.channel.send("The song playback is already stopped.");
  }
}

function resume(message, serverQueue) {
  if (!message.member.voiceChannel)
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
  if (!message.member.voiceChannel)
    return message.channel.send("You are not in a voice channel!");

  if (!serverQueue) return message.channel.send("There is nothing playing.");
  musicFunctions.shuffleArray(serverQueue.songs);
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    return `**${++index}-** [${song.title}](${song.url})`;
  });
  musicFunctions.addMusicQueueField(message, songArray, queue).then(results =>
    __awaiter(this, void 0, void 0, function*() {
      for (let i = 0; i < results.length; i++) {
        yield new Promise(r => {
          return setTimeout(r, 500);
        });
        const element = results[i];
        message.channel.send(element);
      }
    })
  );
  message.channel.send("Song queue has been shuffled.");
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
