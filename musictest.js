const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const Discord = require("discord.js");
const  YouTube  = require("simple-youtube-api");
const youtube = new YouTube(process.env.YT);
function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}
var loop = false;

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
        return __awaiter(this, void 0, void 0, function* () {
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
                    element1 ? list.push(element1) : console.log("Empty element");
                    element1 ? list.push(element2) : console.log("Empty element");
                    element1 ? list.push(element3) : console.log("Empty element");
                    element1 ? list.push(element4) : console.log("Empty element");
                    if (i < 25) {
                        embed.setTitle(`Song queue for ${message.guild.name}`);
                        embed.setDescription(`There are ${serverQueue.songs.length} songs in total.`);
                        embed.setAuthor(message.author.username, message.author.avatarURL);
                    }
                    embed.setTimestamp();
                    embed.setFooter(`Now playing : ${serverQueue.songs[0].title}`);
                    embed.addField("** **", list.join("\n"));
                    embed.setColor(color);
                }
                toSendEmbed.push(embed);
            }
            return toSendEmbed;
        });
    },
    handleVideo(queueList, video, message, voiceChannel, musicVolume = 20, loopQueue = false, top = false, playlist = false) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    musicFunctions.playMusic(message.guild, queueConstruct.songs[0], queueList);
                }
                catch (error) {
                    console.error(`I could not join the voice channel: ${error}`);
                    queueList.delete(message.guild.id);
                    return message.channel.send(`I could not join the voice channel: ${error}`).then((m) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`);
                        });
                    });
                }
            }
            else if (top) {
                serverQueue.songs.splice(1, 0, song);
                if (playlist)
                    return undefined;
                else
                    return message.channel.send(`✅ **${song.title}** has been added to the top of the queue!`).then((m) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`);
                        });
                    });
            }
            else {
                serverQueue.songs.push(song);
                if (playlist)
                    return undefined;
                else
                    return message.channel.send(`✅ **${song.title}** has been added to the queue!`).then((m) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`);
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
        }
        catch (error) {
            console.log(error);
        }
        const dispatcher = serverQueue.connection.playStream(ytdl(song.url, {
            filter: "audioonly",
            quality: "highestaudio"
        })).on('end', (reason) => {
            if (serverQueue.loop === true) {
                console.log("Song ended, but looped");
                var toPush = serverQueue.songs[0];
                serverQueue.songs.push(toPush);
                serverQueue.songs.shift();
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            }
            else if (serverQueue.repeat === true) {
                console.log("Song ended, but repeated");
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            }
            else {
                if (reason === 'Stream is not generating quickly enough.')
                    console.log('Song ended.');
                else
                    console.log(`${reason}`);
                serverQueue.songs.shift();
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            }
        }).on('error', (error) => { return console.error(error); });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
        serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`).then((m) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`);
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

   async function search(message) {
     const filter = m => m.author.id === message.author.id;
     const args = message.content.split(" ");
     const Embed = new Discord.RichEmbed()
     .setTitle("Search result of " + args.slice(1).join(" "))
     .setColor(color)
     .setFooter("Choose your song.");
     const results = [];
     var saved = [];
     var info = [];
     const video = await youtube.search(args.slice(1).join(" "), 10);
     var num = 0;
     for(let i = 0; i < video.length; i++) {
       try {
          saved.push(video[i]);
       results.push(++num + " - " + video[i].title);
       console.log(video[i].title);
       } catch {
         console.log("ooofed")
       }
     }
     Embed.setDescription(results.join("\n"));
    message.channel.send(Embed)
    .then(() => {
      message.channel.awaitMessages(filter, { max: 1, time: 30000, error: ["time"] })
      .then(async (collected) => {
        var s = Math.floor(parseInt(collected.first().content) - 1);
        message.channel.send("Music chosen: " + saved[s].title);
        var chosen = await ytdl.getInfo(saved[s].url);
        info.push(chosen);
      });
  
    });
     
   }

function isUrl(s) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}



async function execute(message, serverQueue) {
       const filter = m => m.author.id === message.author.id;
  const args = message.content.split(" ");

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
  
  
  if(checkURL === true) {
    var songInfo = await ytdl.getInfo(args[1]);
  
  }
  else {
    const video = await youtube.search(args.slice(1).join(" "), 10);
    
    var songInfo =  await ytdl.getInfo(video[0].url);
    
  }
  let song = {
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
      const Embed = new Discord.RichEmbed()
      .setColor(color)
        .setTitle("Now playing:")
        .setDescription(song.title)
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
    console.log(serverQueue.songs);
    const Embed = new Discord.RichEmbed()
    .setColor(color)
      .setTitle("New song added:")
      .setDescription(song.title)
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    return message.channel.send(Embed);
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
  loop = false;
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.channel.send(":wave:")
}

async function play(guild, song) {
  const serverQueue = queue.get(guild.id);
if (!song) {
  if(!loop || loop === false) {
  serverQueue.voiceChannel.leave();
  queue.delete(guild.id);
  return;
  } else {
    try{
    serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    serverQueue.songs.push(song);
    } catch(err) {
      console.log(err)
    }
  }
 }

  const dispatcher = serverQueue.connection
    .playStream(ytdl(song.url))
    .on("end", () => {
      if(!loop || loop === false) {
      console.log("Music ended!");
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
      } else {
        console.log("Music ended!");
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
        serverQueue.songs.push(song);
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
    .setTimestamp()
    .setThumbnail(serverQueue.songs[0].icon)
    .addField(
      `Now playing in ${message.guild.name}:`,
      `[**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url})`
    )
    .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
  return message.channel.send(embed);
}


function lp(message, serverQueue) {
  if (!message.member.voiceChannel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  if (loop === false) {
    loop = true;
    message.channel.send("The song queue is now being looped.");
   
    return loop;
  } else {
    loop = false;
    message.channel.send("The song queue is no longer being looped.");
    return loop
  }
}

function remove(message, queueIndex) {
  if (!message.member.voiceChannel)
    return message.channel.send("You are not in a voice channel!");
  if (typeof queueIndex !== "number")
    return console.log("The query provided is not a number.");
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
}

function pause(message, serverQueue) {
        if (!message.member.voiceChannel)
            return message.channel.send('You are not in a voice channel!')

        if (serverQueue.playing === true) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send("The song playback has been stopped.");
        }
        else {
            return message.channel.send("The song playback is already stopped.");
        }
    }

function resume(message, serverQueue) {
        if (!message.member.voiceChannel)
            return message.channel.send('You are not in a voice channel!')

        if (serverQueue.playing === false) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send("The song playback has been resumed.");
        }
        else {
            return message.channel.send("The song playback is not stopped.");
        }
    }

function shuffle(message, serverQueue) {
        if (!message.member.voiceChannel)
            return message.channel.send('You are not in a voice channel!')

        if (!serverQueue)
            return message.channel.send('There is nothing playing.')
        musicFunctions.shuffleArray(serverQueue.songs);
        var index = 0;
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})`; });
        musicFunctions.addMusicQueueField(message, songArray, queue).then((results) => __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < results.length; i++) {
                yield new Promise((r) => { return setTimeout(r, 500); });
                const element = results[i];
                message.channel.send(element)
            }
        }));
        message.channel.send("Song queue has been shuffled.")
    }



module.exports = {
  checkAdminCmd: function(message) {
    if (message.author.bot) return;
    if (message.channel instanceof Discord.DMChannel) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    
    let command = message.content,
      found = false;
    const serverQueue = queue.get(message.guild.id);
    if (command.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}altp`)) {
      console.log(search(message).then(result => {
        return result.info[0];
      }));
      execute(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}queue`) || command.startsWith(`${prefix}q`)) {
      showQueue(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}nowplaying`) || command.startsWith(`${prefix}np`)) {
      nowPlaying(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}loop`) || command.startsWith(`${prefix}lp`)) {
      lp(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}remove`)) {
      var queueIndex = parseInt(args[1]);
      remove(message, queueIndex);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}pause`)) {
      pause(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}resume`)) {
      resume(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}shuffle`)) {
      shuffle(message, serverQueue);
      found = true;
      return found;
    }
  } 
};
