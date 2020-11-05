const Discord = require("discord.js");
const {
  validURL,
  validYTURL,
  validSPURL,
  validGDURL,
  isGoodMusicVideoContent,
  decodeHtmlEntity,
  validYTPlaylistURL,
  validSCURL,
  validMSURL,
  validPHURL,
  isEquivalent
} = require("../function.js");
const { parseBody } = require("../commands/musescore.js");
const { migrate } = require("./migrate.js");
const ytdl = require("ytdl-core");
var SpotifyWebApi = require("spotify-web-api-node");
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTID,
  clientSecret: process.env.SPOTSECRET,
  redirectUri: "https://nwws.ml"
});
const nodefetch = require("node-fetch");
const fetch = require("fetch-retry")(nodefetch, { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const request = require("request-stream");
const mm = require("music-metadata");
const ytsr = require("ytsr");
const ytsr2 = require("youtube-sr");
const ytpl = require("ytpl");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
const scdl = require("soundcloud-downloader");
const rp = require("request-promise-native");
const cheerio = require("cheerio");
const StreamConcat = require('stream-concat');
const ph = require("@justalk/pornhub-api");
var cookie = { cookie: process.env.COOKIE, id: 0 };

const requestStream = url => {
  return new Promise((resolve, reject) => {
    request.get(url, (err, res) => err ? reject(err) : resolve(res));
  });
};

function createEmbed(message, songs) {
  const Embed = new Discord.MessageEmbed()
    .setColor(console.color())
    .setTitle("New track added:")
    .setThumbnail(songs[0].thumbnail)
    .setDescription(`**[${songs[0].title}](${songs[0].url})**\nLength: **${songs[0].time}**`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
  if (songs.length > 1) Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
  return Embed;
}

function updateQueue(message, serverQueue, queue, pool) {
  if (!serverQueue) queue.delete(message.guild.id);
  else queue.set(message.guild.id, serverQueue);
  if (pool) pool.getConnection(function (err, con) {
    if (err && !message.dummy) message.reply("there was an error trying to connect to the database!");
    else if (err) return;
    const query = `UPDATE servers SET queue = ${!serverQueue ? "NULL" : `'${escape(JSON.stringify(serverQueue.songs))}'`} WHERE id = '${message.guild.id}'`;
    con.query(query, (err) => {
      if (err && !message.dummy) message.reply("there was an error trying to update the queue!");
      else if (err) return;
      console.log("Updated song queue of " + message.guild.name);
    });
    con.release();
  });
}

async function play(guild, song, queue, pool, skipped = 0, seek = 0) {
  const serverQueue = queue.get(guild.id);
  const args = ["0", song.url];
  const message = { guild: { id: guild.id, name: guild.name }, dummy: true };
  if(!serverQueue.voiceChannel && guild.me.voice && guild.me.voice.channel) serverQueue.voiceChannel = guild.me.voice.channel;
  if (!song || !serverQueue.voiceChannel) {
    if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
    return updateQueue(message, serverQueue, queue, pool);
  }
  var dispatcher;
  async function skip() {
    skipped++;
    if (serverQueue.textChannel) serverQueue.textChannel.send("An error occured while trying to play the track! Skipping the track..." + `${skipped < 2 ? "" : ` (${skipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
    if (skipped >= 3) {
      if (serverQueue.textChannel) serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
      if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
      serverQueue.playing = false;
      serverQueue.connection = null;
      serverQueue.voiceChannel = null;
      serverQueue.textChannel = null;
      if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
    }
    if (serverQueue.looping) serverQueue.songs.push(song);
    else if (!serverQueue.repeating) serverQueue.songs.shift();
    updateQueue(message, serverQueue, queue, pool);
    play(guild, serverQueue.songs[0], queue, pool, skipped);
  }
  if (!serverQueue.connection) serverQueue.connection = await serverQueue.voiceChannel.join();
  if (serverQueue.connection.dispatcher) serverQueue.startTime = serverQueue.connection.dispatcher.streamTime - seek * 1000;
  else serverQueue.startTime = -seek * 1000;
  try {
    const silence = await requestStream("https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3");
    switch(song.type) {
      case 2:
      case 4:
        const a = await requestStream(song.url);
        dispatcher = serverQueue.connection.play(new StreamConcat([a, silence], { highWaterMark: 1 << 25 }), { seek: seek });
      break;
      case 3:
        dispatcher = serverQueue.connection.play(await scdl.download(song.url));
      break;
      case 5:
        const c = await fetch(`https://north-utils.glitch.me/musescore/${encodeURIComponent(song.url)}`, { timeout: 30000 }).then(res => res.json());
        if (c.error) throw new Error(c.message);
        const d = await requestStream(c.url);
        dispatcher = serverQueue.connection.play(new StreamConcat([d, silence], { highWaterMark: 1 << 25 }), { seek: seek });
      break;
      case 6:
        var f = await requestStream(song.download);
        if(f.statusCode != 200) {
          const g = await module.exports.addPHURL(message, args);
          if(g.error) throw "Failed to find video";
          song = g;
          serverQueue.songs[0] = song;
          updateQueue(message, serverQueue, queue, pool);
          f = await requestStream(song.download);
          if(f.statusCode != 200) throw new Error("Received HTTP Status Code: " + f.statusCode);
        }
        dispatcher = serverQueue.connection.play(new StreamConcat([f, silence], { highWaterMark: 1 << 25 }), { seek: seek });
      break;
      default:
        const h = { highWaterMark: 1 << 28, dlChunkSize: 0, requestOptions: { headers: { cookie: cookie.cookie, 'x-youtube-identity-token': process.env.YT } } };
        if (song.isLive) {
          const j = await module.exports.addYTURL(message, args, song.type);
          if (j.error) throw "Failed to find video";
          if (!isEquivalent(j.songs[0], song)) {
            song = j.songs[0];
            serverQueue.songs[0] = song;
            updateQueue(message, serverQueue, queue, pool);
          }
        }
        if (!song.isLive) h.filter = "audioonly";
        dispatcher = serverQueue.connection.play(ytdl(song.url, h), { seek: seek });
      break;
    }
  } catch (err) {
    console.error(err);
    return await skip();
  }
  const now = Date.now();
  if (serverQueue.textChannel) {
    const Embed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Now playing:")
      .setThumbnail(song.type === 2 ? undefined : song.thumbnail)
      .setDescription(`**[${song.title}](${song.type === 1 ? song.spot : song.url})**\nLength: **${song.time}**${seek > 0 ? ` | Starts From: **${moment.duration(seek, "seconds").format()}**` : ""}`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    serverQueue.textChannel.send(Embed).then(msg => msg.delete({ timeout: 30000 }));
  }
  var oldSkipped = skipped;
  skipped = 0;
  dispatcher.on("finish", async () => {
    dispatcher = null;
    console.log("Music ended! In " + guild.name);
    if (serverQueue.looping) serverQueue.songs.push(song);
    else if (!serverQueue.repeating) serverQueue.songs.shift();
    updateQueue(message, serverQueue, queue, pool);
    if (Date.now() - now < 1000 && serverQueue.textChannel) {
      serverQueue.textChannel.send(`There was probably an error playing the last track. (It played for less than a second!)\nPlease contact NorthWestWind#1885 if the problem persist. ${oldSkipped < 2 ? "" : `(${oldSkipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
      if (++oldSkipped >= 3) {
        serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
        if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        serverQueue.playing = false;
        serverQueue.connection = null;
        serverQueue.voiceChannel = null;
        serverQueue.textChannel = null;
        if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
      }
    } else oldSkipped = 0;
    play(guild, serverQueue.songs[0], queue, pool, oldSkipped);
  }).on("error", async error => {
    if (error.message.toLowerCase() == "input stream: Status code: 429".toLowerCase()) {
      console.error("Received 429 error. Changing ytdl-core cookie...");
      cookie.id++;
      if (!process.env[`COOKIE${cookie.id}`]) {
        cookie.cookie = process.env.COOKIE;
        cookie.id = 0;
      }
      else cookie.cookie = process.env[`COOKIE${cookie.id}`];
    } else console.error(error);
    skipped = oldSkipped;
    await skip();
  });
  dispatcher.setVolume(serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.volume * serverQueue.songs[0].volume : serverQueue.volume);
}

module.exports = {
  name: "play",
  description:
    "Play music with the link or keywords provided. Only support YouTube videos currently.",
  aliases: ["p"],
  usage: "[link | keywords | attachment]",
  category: 8,
  async music(message, serverQueue, queue, pool) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send("You need to be in a voice channel to play music!");
    if (!voiceChannel.permissionsFor(message.client.user).has(3145728)) return message.channel.send("I can't play in your voice channel!");
    if (!args[1] && message.attachments.size < 1) {
      if (!serverQueue || !serverQueue.songs || serverQueue.songs.length < 1) return message.channel.send("No song queue was found for this server! Please provide a link or keywords to get a music played!");
      if (serverQueue.playing || console.migrating.find(x => x === message.guild.id)) return await migrate(message, serverQueue, queue, pool);
      try {
        if (message.guild.me.voice.channel && message.guild.me.voice.channelID === voiceChannel.id) serverQueue.connection = message.guild.me.voice.connection;
        else {
          await message.guild.me.voice.channel.leave();
          serverQueue.connection = await voiceChannel.join();
        }
      } catch (err) {
        message.reply("there was an error trying to connect to the voice channel!");
        if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
        return console.error(err);
      }
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = message.channel;
      updateQueue(message, serverQueue, queue, pool);
      play(message.guild, serverQueue.songs[0], queue, pool);
      return;
    }
    var songs = [];
    var result = { error: true };
    if (validYTURL(args.slice(1).join(" "))) {
      if (validYTPlaylistURL(args.slice(1).join(" "))) result = await this.addYTPlaylist(message, args);
      else result = await this.addYTURL(message, args);
    } else if (validSPURL(args.slice(1).join(" "))) result = await this.addSPURL(message, args);
    else if (validSCURL(args.slice(1).join(" "))) result = await this.addSCURL(message, args);
    else if (validGDURL(args.slice(1).join(" "))) result = await this.addGDURL(message, args);
    else if (validMSURL(args.slice(1).join(" "))) result = await this.addMSURL(message, args);
    else if (validPHURL(args.slice(1).join(" "))) result = await this.addPHURL(message, args);
    else if (validURL(args.slice(1).join(" "))) result = await this.addURL(message, args);
    else if (message.attachments.size > 0) result = await this.addAttachment(message);
    else result = await this.search(message, args);
    if (result.error) return;
    songs = result.songs;
    if (!songs || songs.length < 1) return message.reply("there was an error trying to add the soundtrack!");
    const Embed = createEmbed(message, songs);
    try {
      if (!serverQueue) {
        serverQueue = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: songs,
          volume: 1,
          playing: true,
          paused: false,
          startTime: 0,
          looping: false,
          repeating: false
        };
      } else {
        if (!message.guild.me.voice.channel || !serverQueue.playing) serverQueue.songs = songs.concat(serverQueue.songs);
        else serverQueue.songs = serverQueue.songs.concat(songs);
      }
      updateQueue(message, serverQueue, queue, pool);
      if (!message.guild.me.voice.channel) {
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.connection = await voiceChannel.join();
        serverQueue.playing = true;
        serverQueue.textChannel = message.channel;
      }
      play(message.guild, serverQueue.songs[0], queue, pool);
      if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
      else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
    } catch (err) {
      message.reply("there was an error trying to connect to the voice channel!");
      await message.guild.me.voice.channel.leave();
      return console.error(err);
    }
  },
  play: play,
  async addAttachment(message) {
    var files = message.attachments;
    var songs = [];
    for (const file of files.values()) {
      var stream = await requestStream(file.url);
      try {
        var metadata = await mm.parseStream(stream, {}, { duration: true });
      } catch (err) {
        message.channel.send("The audio format is not supported!");
        return { error: true };
      }
      if (!metadata) {
        message.channel.send(
          "An error occured while parsing the audio file into stream! Maybe it is not link to the file?"
        );
        return { error: true };
      }
      var length = Math.round(metadata.format.duration);
      var songLength = moment.duration(length, "seconds").format();
      var song = {
        title: file.name.split(".")[0].replace(/_/g, " "),
        url: file.url,
        type: 2,
        time: songLength,
        volume: 1,
        thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg",
        isLive: false
      };
      songs.push(song);
    }
    return { error: false, songs };
  },
  async addYTPlaylist(message, args) {
    try {
      var playlistInfo = await ytpl(args.slice(1).join(" "), { limit: Infinity });
    } catch (err) {
      if (err.message === "This playlist is private.") {
        message.channel.send("The playlist is private!");
        return { error: true };
      } else {
        console.error(err);
        message.reply(
          "there was an error trying to fetch your playlist!"
        );
        return { error: true };
      }
    }
    var videos = playlistInfo.items;
    var songs = [];
    var mesg = await message.channel.send(`Processing track: **0/${videos.length}**`);
    var interval = setInterval(async () => {
      if (songs.length < videos.length) await mesg.edit(`Processing track: **${songs.length - 1}/${videos.length}**`).catch(() => { });
    }, 1000);
    for (const video of videos) {
      var info = {
        title: video.title,
        url: video.url_simple,
        type: 0,
        time: video.duration,
        thumbnail: video.thumbnail,
        volume: 1,
        isLive: false
      };
      songs.push(info);
    }
    mesg.edit(`Track processing completed`).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
    clearInterval(interval);
    return { error: false, songs: songs };
  },
  async addYTURL(message, args, type = 0) {
    try {
      var songInfo = await ytdl.getInfo(args.slice(1).join(" "), { requestOptions: { headers: { cookie: process.env.COOKIE, 'x-youtube-identity-token': process.env.YT } } });
    } catch (err) {
      if (!message.dummy) message.channel.send("No video was found!");
      return { error: true };
    }
    var length = parseInt(songInfo.videoDetails.lengthSeconds);
    var songLength = songInfo.videoDetails.isLiveContent ? "∞" : moment.duration(length, "seconds").format();
    var thumbnails = songInfo.videoDetails.thumbnail.thumbnails;
    var thumbUrl = thumbnails[thumbnails.length - 1].url;
    var maxWidth = 0;
    for (const thumbnail of thumbnails) {
      if (thumbnail.width > maxWidth) {
        maxWidth = thumbnail.width;
        thumbUrl = thumbnail.url;
      }
    }
    var songs = [
      {
        title: decodeHtmlEntity(songInfo.videoDetails.title),
        url: songInfo.videoDetails.video_url,
        type: type,
        time: songLength,
        thumbnail: thumbUrl,
        volume: 1,
        isLive: songInfo.videoDetails.isLiveContent
      }
    ];
    return { error: false, songs: songs };
  },
  async addSPURL(message, args) {
    var d = await spotifyApi.clientCredentialsGrant();

    await spotifyApi.setAccessToken(d.body.access_token);
    await spotifyApi.setRefreshToken(process.env.SPOTREFRESH);

    var refreshed = await spotifyApi
      .refreshAccessToken()
      .catch(console.error);

    console.log("Refreshed Spotify Access Token");
    await spotifyApi.setAccessToken(refreshed.body.access_token);

    var url_array = args.slice(1).join(" ").replace("https://", "").split("/");
    var musicID = url_array[2].split("?")[0];

    if (url_array[2].split("?")[1] !== undefined)
      var highlight =
        url_array[2].split("?")[1].split("=")[0] === "highlight";
    else var highlight = false;

    if (highlight)
      musicID = url_array[2]
        .split("?")[1]
        .split("=")[1]
        .split(":")[2];
    var type = url_array[1];
    var songs = [];
    switch (type) {
      case "playlist":
        var musics = await spotifyApi.getPlaylist(musicID, { limit: 50 });
        var tracks = musics.body.tracks.items;
        async function checkAll() {
          if (musics.body.tracks.next) {
            var offset = musics.body.tracks.offset + 50;
            musics = await spotifyApi.getPlaylist(musicID, {
              limit: 50,
              offset: offset
            });
            tracks = tracks.concat(musics.body.tracks.items);
            return await checkAll();
          }
        }
        await checkAll();
        var mesg = await message.channel.send(`Processing track: **0/${tracks.length}**`);
        for (var i = 0; i < tracks.length; i++) {
          await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => { });
          var matched;
          try {
            var searched = await ytsr(
              tracks[i].track.artists[0].name +
              " - " +
              tracks[i].track.name,
              { limit: 20 }
            );
            var results = searched.items.filter(
              x => x.type === "video" && x.duration.split(":").length < 3
            );
          } catch (err) {
            try {
              var searched = await ytsr2.search(tracks[i].track.artists[0].name + " - " + tracks[i].track.name, { limit: 20 });
              var results = searched.map(x => {
                return {
                  live: false,
                  duration: x.durationFormatted,
                  link: `https://www.youtube.com/watch?v=${x.id}`
                }
              });
            } catch (err) {
              return console.error(err);
            }
          }
          for (var s = 0; s < results.length; s++) {
            if (results.length == 0) break;
            if (isGoodMusicVideoContent(results[s])) {
              var songLength = !results[s].live ? results[s].duration : "∞";
              matched = {
                title: tracks[i].track.name,
                url: results[s].link,
                type: 1,
                spot:
                  tracks[i].track.external_urls.spotify,
                thumbnail:
                  tracks[i].track.album.images[0].url,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
              break;
            }
            if (s + 1 == results.length) {
              var songLength = !results[0].live ? results[0].duration : "∞";
              matched = {
                title: tracks[i].track.name,
                url: results[0].link,
                type: 1,
                spot:
                  tracks[i].track.external_urls.spotify,
                thumbnail:
                  tracks[i].track.album.images[0].url,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
            }
          }
        }
        mesg.edit("Process completed").then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
        break;
      case "album":
        if (!highlight) {
          var album = await spotifyApi
            .getAlbums([musicID])
            .catch(err => console.log("Something went wrong!", err));
          var image = album.body.albums[0].images[0].url;
          var data = await spotifyApi
            .getAlbumTracks(musicID, {
              limit: 50
            })
            .catch(err => console.log("Something went wrong!", err));

          var tracks = data.body.items;
          async function checkAll() {
            if (data.body.next) {
              var offset = data.body.offset + 50;
              data = await spotifyApi.getAlbumTracks(musicID, {
                limit: 50,
                offset: offset
              });
              tracks = tracks.concat(data.body.items);
              return await checkAll();
            }
          }
          await checkAll();
        } else {
          var data = await spotifyApi
            .getTracks([musicID])
            .catch(err => console.log("Something went wrong!", err));

          var tracks = data.body.tracks;
        }
        var mesg = await message.channel.send(`Processing track: **0/${tracks.length}**`);
        for (var i = 0; i < tracks.length; i++) {
          await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => { });
          var matched;
          try {
            var searched = await ytsr(
              tracks[i].track.artists[0].name +
              " - " +
              tracks[i].track.name,
              { limit: 20 }
            );
            var results = searched.items.filter(
              x => x.type === "video" && x.duration.split(":").length < 3
            );
          } catch (err) {
            try {
              var searched = await ytsr2.search(tracks[i].track.artists[0].name + " - " + tracks[i].track.name, { limit: 20 });
              var results = searched.map(x => {
                return {
                  live: false,
                  duration: x.durationFormatted,
                  link: `https://www.youtube.com/watch?v=${x.id}`
                }
              });
            } catch (err) {
              return console.error(err);
            }
          }
          for (var s = 0; s < results.length; s++) {
            if (results.length == 0) break;
            if (isGoodMusicVideoContent(results[s])) {
              var songLength = !results[s].live ? results[s].duration : "∞";
              matched = {
                title: tracks[i].name,
                url: results[s].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: highlight
                  ? tracks[i].album.images[0].url
                  : image,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
              break;
            }
            if (s + 1 == results.length) {
              var songLength = !results[0].live ? results[0].duration : "∞";
              matched = {
                title: tracks[i].name,
                url: results[0].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: highlight
                  ? tracks[i].album.images[0].url
                  : image,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
            }
          }
        }
        mesg.edit("Track processing completed").then(msg => msg.delete({ timeout: 10000 })).catch(() => { });
        break;
      case "track":
        var data = await spotifyApi.getTracks([musicID]);
        var tracks = data.body.tracks;

        for (var i = 0; i < tracks.length; i++) {
          var matched;
          try {
            var searched = await ytsr(
              tracks[i].track.artists[0].name +
              " - " +
              tracks[i].track.name,
              { limit: 20 }
            );
            var results = searched.items.filter(
              x => x.type === "video" && x.duration.split(":").length < 3
            );
          } catch (err) {
            try {
              var searched = await ytsr2.search(tracks[i].track.artists[0].name + " - " + tracks[i].track.name, { limit: 20 });
              var results = searched.map(x => {
                return {
                  live: false,
                  duration: x.durationFormatted,
                  link: `https://www.youtube.com/watch?v=${x.id}`
                }
              });
            } catch (err) {
              return console.error(err);
            }
          }
          for (var s = 0; s < results.length; s++) {
            if (results.length == 0) break;
            if (isGoodMusicVideoContent(results[s])) {
              var songLength = !results[s].live ? results[s].duration : "∞";
              matched = {
                title: tracks[i].name,
                url: results[s].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: tracks[i].album.images[0].url,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
              break;
            }
            if (s + 1 == results.length) {
              var songLength = !results[0].live ? results[0].duration : "∞";
              matched = {
                title: tracks[i].name,
                url: results[0].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: tracks[i].album.images[0].url,
                time: songLength,
                volume: 1,
                isLive: results[s].live
              };
              songs.push(matched);
            }
          }
          break;
        }
        break;
    }
    return { error: false, songs: songs };
  },
  async addSCURL(message, args) {
    var res = await fetch(
      `https://api.soundcloud.com/resolve?url=${args.slice(1).join(" ")}&client_id=${process.env.SCID
      }`
    );
    if (res.status !== 200) {
      message.channel.send(
        "A problem occured while fetching the track information! Status Code: " +
        res.status
      );
      return { error: true };
    }
    var data = await res.json();
    if (data.kind == "user") {
      message.channel.send(
        "What do you think you can do with a user?"
      );
      return { error: true };
    }
    if (data.kind == "playlist") {
      var songs = [];
      for (const track of data.tracks) {
        var length = Math.round(track.duration / 1000);
        var songLength = moment.duration(length, "seconds").format();
        var song = {
          title: track.title,
          type: 3,
          id: track.id,
          time: songLength,
          thumbnail: track.artwork_url,
          url: track.permalink_url,
          volume: 1,
          isLive: false
        };
        songs.push(song);
      }
    } else {
      var length = Math.round(data.duration / 1000);
      var songLength = moment.duration(length, "seconds").format();
      var songs = [
        {
          title: data.title,
          type: 3,
          id: data.id,
          time: songLength,
          thumbnail: data.artwork_url,
          url: data.permalink_url,
          volume: 1,
          isLive: false
        }
      ];
    }
    return { error: false, songs: songs };
  },
  async addGDURL(message, args) {
    const formats = [/https:\/\/drive\.google\.com\/file\/d\/(?<id>.*?)\/(?:edit|view)\?usp=sharing/, /https:\/\/drive\.google\.com\/open\?id=(?<id>.*?)$/];
    const alphanumeric = /^[a-zA-Z0-9\-_]+$/;
    let id;
    formats.forEach((regex) => {
      const matches = args.slice(1).join(" ").match(regex)
      if (matches && matches.groups && matches.groups.id) id = matches.groups.id
    });
    if (!id) {
      if (alphanumeric.test(args.slice(1).join(" "))) id = args.slice(1).join(" ");
      else {
        message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.prefix}${this.name} ${this.usage}\``);
        return { error: true };
      }
    }
    var link = "https://drive.google.com/uc?export=download&id=" + id;
    var stream = await requestStream(link);
    try {
      var metadata = await mm.parseStream(stream, {}, { duration: true });
      var html = await rp(args.slice(1).join(" "));
      var $ = cheerio.load(html);
      var titleArr = $("title").text().split(" - ");
      titleArr.splice(-1, 1);
      var titleArr2 = titleArr.join(" - ").split(".");
      titleArr2.splice(-1, 1);
      var title = titleArr2.join(".");
    } catch (err) {
      message.reply("there was an error trying to parse your link!");
      return { error: true };
    }
    if (!metadata) {
      message.channel.send("An error occured while parsing the audio file into stream! Maybe it is not link to the file?");
      return { error: true };
    }
    var length = Math.round(metadata.format.duration);
    var songLength = moment.duration(length, "seconds").format();
    var song = {
      title: title,
      url: link,
      type: 4,
      time: songLength,
      volume: 1,
      thumbnail: "https://drive-thirdparty.googleusercontent.com/256/type/audio/mpeg",
      isLive: false
    };
    var songs = [song];
    return { error: false, songs: songs };
  },
  async addMSURL(message, args) {
    try {
      var response = await rp({ uri: args.slice(1).join(" "), resolveWithFullResponse: true });
      if (Math.floor(response.statusCode / 100) !== 2) {
        message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
        return { error: true };
      }
      var body = response.body;
    } catch (err) {
      message.reply("there was an error trying to fetch data of the score!");
      return { error: true };
    }
    var data = parseBody(body);
    var songLength = data.duration;
    var song = {
      title: data.title,
      url: args.slice(1).join(" "),
      type: 5,
      time: songLength,
      volume: 1,
      thumbnail: "https://pbs.twimg.com/profile_images/1155047958326517761/IUgssah__400x400.jpg",
      isLive: false
    };
    var songs = [song];
    return { error: false, songs: songs };
  },
  async addPHURL(message, args) {
    try {
      const video = await ph.page(args.slice(1).join(" "), ["title", "duration", "download_urls"]);
      if (video.error) throw new Error(video.error);
      var download = "-1";
      for (const property in video.download_urls) if (parseInt(property) < parseInt(download) || parseInt(download) < 0) download = property;
      if(parseInt(download) < 1) throw "Cannot get any video quality";
      var songLength = moment.duration(video.duration, "seconds").format();
      var song = {
        title: video.title,
        url: args.slice(1).join(" "),
        type: 6,
        time: songLength,
        volume: 1,
        thumbnail: "https://plasticmick.com/wp-content/uploads/2019/07/pornhub-logo.jpg",
        isLive: false,
        download: video.download_urls[download]
      };
      return { error: false, songs: [song] };
    } catch (err) {
      if(!message.dummy) message.reply("there was an error processing the link!");
      return { error: true };
    }
  },
  async addURL(message, args) {
    var linkArr = args.slice(1).join(" ").split("/");
    if (linkArr[linkArr.length - 1].split("?").length == 1) {
      var title = linkArr[linkArr.length - 1]
        .split(".")[0]
        .replace(/_/g, " ");
    } else {
      linkArr = args.slice(1).join(" ").split("?");
      var title = linkArr[linkArr.length - 1]
        .split(".")[0]
        .replace(/_/g, " ");
    }
    try {
      var stream = await requestStream(args.slice(1).join(" "));
      var metadata = await mm.parseStream(stream, {}, { duration: true });
    } catch (err) {
      message.channel.send("The audio format is not supported!");
      return { error: true };
    }
    if (!metadata || !stream) {
      message.reply("there was an error while parsing the audio file into stream! Maybe it is not link to the file?");
      return { error: true };
    }
    var length = Math.round(metadata.format.duration);
    var songLength = moment.duration(length, "seconds").format();
    var song = {
      title: title,
      url: args.slice(1).join(" "),
      type: 2,
      time: songLength,
      volume: 1,
      thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg",
      isLive: false
    };
    var songs = [song];
    return { error: false, songs: songs };
  },
  async search(message, args) {
    const Embed = new Discord.MessageEmbed()
      .setTitle("Search result of " + args.slice(1).join(" "))
      .setColor(console.color())
      .setTimestamp()
      .setFooter("Choose your song by typing the number, or type anything else to cancel.", message.client.user.displayAvatarURL());
    const results = [];
    try {
      var searched = await ytsr(args.slice(1).join(" "), { limit: 20 });
      var video = searched.items.filter(x => x.type === "video");
    } catch (err) {
      try {
        var searched = await ytsr2.search(args.slice(1).join(" "), { limit: 20 });
        var video = searched.map(x => {
          return {
            live: false,
            duration: x.durationFormatted,
            link: `https://www.youtube.com/watch?v=${x.id}`,
            title: x.title,
            thumbnail: x.thumbnail.url
          }
        });
      } catch (err) {
        console.error(err);
        message.reply("there was an error trying to search the videos!");
        return { error: true };
      }
    }
    var num = 0;
    for (let i = 0; i < Math.min(video.length, 10); i++) try {
      results.push(`${++num} - **[${decodeHtmlEntity(video[i].title)}](${video[i].link})** : **${video[i].duration}**`);
    } catch (err) {
      --num;
    }
    Embed.setDescription(results.join("\n"));
    var msg = await message.channel.send(Embed)
    var filter = x => x.author.id === message.author.id;

    var collected = await msg.channel.awaitMessages(filter, { max: 1, time: 30000, error: ["time"] });
    if (!collected || !collected.first() || !collected.first().content) {
      const Ended = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle("Cannot parse your choice.")
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      msg.edit(Ended).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
      return { error: true };
    }
    const content = collected.first().content;
    collected.first().delete();
    if (
      isNaN(parseInt(content)) ||
      (parseInt(content) < 1 && parseInt(content) > results.length)
    ) {
      const cancelled = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle("Action cancelled.")
        .setTimestamp()
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );

      await msg.edit(cancelled).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
      return { error: true };
    }

    var s = parseInt(content) - 1;

    const chosenEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("Music chosen:")
      .setThumbnail(video[s].thumbnail)
      .setDescription(
        `**[${decodeHtmlEntity(video[s].title)}](${video[s].link
        })** : **${video[s].duration}**`
      )
      .setTimestamp()
      .setFooter(
        "Have a nice day :)",
        message.client.user.displayAvatarURL()
      );

    await msg.edit(chosenEmbed).catch(() => { });
    var length = !video[s].live ? video[s].duration : "∞";
    var song = {
      title: decodeHtmlEntity(video[s].title),
      url: video[s].link,
      type: 0,
      time: length,
      thumbnail: video[s].thumbnail,
      volume: 1,
      isLive: video[s].live
    };
    return { error: false, songs: [song], msg, embed: Embed };
  },
  updateQueue: updateQueue,
  createEmbed: createEmbed
};
