const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const Discord = require("discord.js");

const queue = new Map();

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voiceChannel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I can't play in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
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
      .setTitle('Now playing:')
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
      .setTitle('New song added:')
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
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);

  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .playStream(ytdl(song.url))
    .on("end", () => {
      console.log("Music ended!");
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => {
      console.error(error);
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
function showQueue(msg) {
        const queue = this.queueList;
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue)
            return msg.channel.send('There is nothing playing.').then((m) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`);
                });
            });
        var index = 0;
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})`; });
        musicFunctions.addMusicQueueField(msg, songArray, queue).then((results) => __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < results.length; i++) {
                yield new Promise((r) => { return setTimeout(r, 500); });
                const element = results[i];
                msg.channel.send(element).then((m) => {
                    return m.delete(30000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`);
                    });
                });
            }
        }));
                                                                      }
                                                                                             
module.exports = {
  checkAdminCmd: function(message) {
    if (message.author.bot) return;
    if (message.channel instanceof Discord.DMChannel) return;
    if (!message.content.startsWith(prefix)) return;

    let command = message.content,
      found = false;
    const serverQueue = queue.get(message.guild.id);
    if (command.startsWith(`${prefix}play`)) {
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
    } else if (command.startsWith(`${prefix}p`)) {
      execute(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}s`)) {
      skip(message, serverQueue);
      found = true;
      return found;
    } else if (command.startsWith(`${prefix}dis`)) {
      stop(message, serverQueue);
      found = true;
      return found;
    }
  }
};
