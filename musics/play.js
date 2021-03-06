const Discord = require("discord.js");
const { validURL, validYTURL, validSPURL, validGDURL, validGDFolderURL, isGoodMusicVideoContent, decodeHtmlEntity, validYTPlaylistURL, validSCURL, validMSURL, validPHURL, isEquivalent, ID, requestStream, bufferToStream, moveArray, color } = require("../function.js");
const { getMP3 } = require("../commands/musescore.js");
const muse = require("musescore-metadata");
const { music } = require("./migrate.js");
const ytdl = require("ytdl-core");
const { NorthClient } = require("../classes/NorthClient.js");
var SpotifyWebApi = require("spotify-web-api-node");
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTID,
  clientSecret: process.env.SPOTSECRET,
  redirectUri: "https://nwws.ml"
});
const WebMscore = require("webmscore").default;
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const mm = require("music-metadata");
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const moment = require("moment");
require("moment-duration-format")(moment);
const scdl = require("soundcloud-downloader").default;
const rp = require("request-promise-native");
const cheerio = require("cheerio");
const StreamConcat = require('stream-concat');
const ph = require("@justalk/pornhub-api");
const { setQueue, updateQueue, getQueues } = require("./main.js");
var cookie = { cookie: process.env.COOKIE, id: 0 };
function createEmbed(message, songs) {
  const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("New track added:")
    .setThumbnail(songs[0].thumbnail)
    .setDescription(`**[${songs[0].title}](${songs[0].url})**\nLength: **${songs[0].time}**`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
  if (songs.length > 1) Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
  return Embed;
}

async function play(guild, song, skipped = 0, seek = 0) {
  const queue = getQueues();
  const serverQueue = queue.get(guild.id);
  const message = { guild: { id: guild.id, name: guild.name }, dummy: true };
  if (!serverQueue.voiceChannel && guild.me.voice && guild.me.voice.channel) serverQueue.voiceChannel = guild.me.voice.channel;
  serverQueue.playing = true;
  if (!song && serverQueue.songs.length > 0) {
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(message, serverQueue, message.pool);
      if (serverQueue.songs[0]) song = serverQueue.songs[0];
    }
  }
  if (!song || !serverQueue.voiceChannel) {
    serverQueue.playing = false;
    if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
    return updateQueue(message, serverQueue, serverQueue.pool);
  }
  const args = ["0", song.url];
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
      return;
    }
    if (serverQueue.looping) serverQueue.songs.push(song);
    if (!serverQueue.repeating) serverQueue.songs.shift();
    updateQueue(message, serverQueue, serverQueue.pool);
    play(guild, serverQueue.songs[0], skipped);
  }
  if (!serverQueue.connection && skipped === 0) try {
    serverQueue.connection = await serverQueue.voiceChannel.join();
    if (serverQueue.voice && !serverQueue.voice.selfDeaf) serverQueue.voice.setSelfDeaf(true);
  } catch (err) {
    if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
    if (serverQueue.textChannel) return await serverQueue.textChannel.send("An error occured while trying to connect to the channel! Disconnecting the bot...").then(msg => msg.delete({ timeout: 30000 }));
  }
  if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.startTime = serverQueue.connection.dispatcher.streamTime - seek * 1000;
  else serverQueue.startTime = -seek * 1000;
  try {
    const silence = await requestStream("https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3");
    switch (song.type) {
      case 2:
      case 4:
        const a = await requestStream(song.url);
        dispatcher = serverQueue.connection.play(new StreamConcat([a, silence], { highWaterMark: 1 << 25 }), { seek: seek });
        break;
      case 3:
        dispatcher = serverQueue.connection.play(await scdl.download(song.url));
        break;
      case 5:
        const c = await getMP3(song.url);
        if (c.error) throw new Error(c.message);
        if (c.url.startsWith("https://www.youtube.com/embed/")) var d = ytdl(c.url);
        else var d = await requestStream(c.url);
        dispatcher = serverQueue.connection.play(new StreamConcat([d, silence], { highWaterMark: 1 << 25 }), { seek: seek });
        break;
      case 6:
        var f = await requestStream(song.download);
        if (f.statusCode != 200) {
          const g = await module.exports.addPHURL(message, args);
          if (g.error) throw "Failed to find video";
          song = g;
          serverQueue.songs[serverQueue.songs.indexOf(song)] = song;
          updateQueue(message, serverQueue, serverQueue.pool);
          f = await requestStream(song.download);
          if (f.statusCode != 200) throw new Error("Received HTTP Status Code: " + f.statusCode);
        }
        dispatcher = serverQueue.connection.play(new StreamConcat([f, silence], { highWaterMark: 1 << 25 }), { seek: seek });
        break;
      case 7:
        const h = await fetch(song.url);
        if (!h.ok) throw new Error("Received HTTP Status Code: " + h.status);
        await WebMscore.ready;
        const i = await WebMscore.load(song.url.split(".").slice(-1)[0], new Uint8Array(await h.arrayBuffer()));
        const sf3 = await fetch("https://www.dropbox.com/s/2pphk3a9llfiree/MuseScore_General.sf3?dl=1").then(res => res.arrayBuffer());
        await i.setSoundFont(new Uint8Array(sf3));
        const j = bufferToStream(Buffer.from((await i.saveAudio("wav")).buffer));
        dispatcher = serverQueue.connection.play(new StreamConcat([j, silence], { highWaterMark: 1 << 25 }), { seek: seek });
        break;
      default:
        if (song.isLive) {
          const k = await module.exports.addYTURL(message, args, song.type);
          if (k.error) throw "Failed to find video";
          if (!isEquivalent(k.songs[0], song)) {
            song = k.songs[0];
            serverQueue.songs[serverQueue.songs.indexOf(song)] = song;
            updateQueue(message, serverQueue, serverQueue.pool);
          }
        }
        if (!song.isLive && !song.isPastLive) dispatcher = serverQueue.connection.play(ytdl(song.url, { filter: "audioonly", dlChunkSize: 0, highWaterMark: 1 << 25, requestOptions: { headers: { cookie: cookie.cookie, 'x-youtube-identity-token': process.env.YT } } }), { seek: seek });
        else if (song.isPastLive) dispatcher = serverQueue.connection.play(ytdl(song.url, { highWaterMark: 1 << 25, requestOptions: { headers: { cookie: cookie.cookie, 'x-youtube-identity-token': process.env.YT } } }), { seek: seek });
        else dispatcher = serverQueue.connection.play(ytdl(song.url, { highWaterMark: 1 << 25, requestOptions: { headers: { cookie: cookie.cookie, 'x-youtube-identity-token': process.env.YT } } }));
        break;
    }
  } catch (err) {
    NorthClient.storage.error(err);
    return await skip();
  }
  const now = Date.now();
  if (serverQueue.textChannel) {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Now playing:")
      .setThumbnail(song.thumbnail)
      .setDescription(`**[${song.title}](${song.type === 1 ? song.spot : song.url})**\nLength: **${song.time}**${seek > 0 ? ` | Starts From: **${moment.duration(seek, "seconds").format()}**` : ""}`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    serverQueue.textChannel.send(Embed).then(msg => msg.delete({ timeout: 30000 }));
  }
  var oldSkipped = skipped;
  skipped = 0;
  dispatcher.on("finish", async () => {
    if (serverQueue.looping) serverQueue.songs.push(song);
    if (!serverQueue.repeating) serverQueue.songs.shift();
    updateQueue(message, serverQueue, serverQueue.pool);
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
    if (!serverQueue.random) play(guild, serverQueue.songs[0], oldSkipped);
    else {
      const int = Math.floor(Math.random() * serverQueue.songs.length);
      const pending = serverQueue.songs[int];
      serverQueue.songs = moveArray(serverQueue.songs, int);
      updateQueue(message, serverQueue, serverQueue.pool);
      play(guild, pending);
    }
  }).on("error", async error => {
    if (error.message.toLowerCase() == "input stream: Status code: 429".toLowerCase()) {
      NorthClient.storage.error("Received 429 error. Changing ytdl-core cookie...");
      cookie.id++;
      if (!process.env[`COOKIE${cookie.id}`]) {
        cookie.cookie = process.env.COOKIE;
        cookie.id = 0;
      }
      else cookie.cookie = process.env[`COOKIE${cookie.id}`];
    } else NorthClient.storage.error(error);
    skipped = oldSkipped;
    await skip();
  });
  dispatcher.setVolume(song && song.volume ? serverQueue.volume * song.volume : serverQueue.volume);
}

module.exports = {
  name: "play",
  description: "Play music with the link or keywords provided. Only support YouTube videos currently.",
  aliases: ["p"],
  usage: "[link | keywords | attachment]",
  category: 8,
  async music(message, serverQueue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return await message.channel.send("You need to be in a voice channel to play music!");
    if (!voiceChannel.permissionsFor(message.client.user).has(3145728)) return await message.channel.send("I can't play in your voice channel!");
    if (!args[1] && message.attachments.size < 1) {
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
      if (serverQueue.songs.length < 1) return await message.channel.send("The queue is empty for this server! Please provide a link or keywords to get a music played!");
      if (serverQueue.playing || NorthClient.storage.migrating.find(x => x === message.guild.id)) return await music(message, serverQueue);
      try {
        if (message.guild.me.voice.channel && message.guild.me.voice.channelID === voiceChannel.id) serverQueue.connection = message.guild.me.voice.connection;
        else {
          if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
          serverQueue.connection = await voiceChannel.join();
        }
        if (serverQueue.voice && !serverQueue.voice.selfDeaf) serverQueue.voice.setSelfDeaf(true);
      } catch (err) {
        NorthClient.storage.error(err);
        if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
        return await message.reply("there was an error trying to connect to the voice channel!");
      }
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = message.channel;
      updateQueue(message, serverQueue, message.pool);
      if (!serverQueue.random) play(message.guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(message, serverQueue, serverQueue.pool);
        play(message.guild, pending);
      }
      return;
    }
    try {
      var songs = [];
      var result = { error: true };
      if (validYTPlaylistURL(args.slice(1).join(" "))) result = await this.addYTPlaylist(message, args);
      else if (validYTURL(args.slice(1).join(" "))) result = await this.addYTURL(message, args);
      else if (validSPURL(args.slice(1).join(" "))) result = await this.addSPURL(message, args);
      else if (validSCURL(args.slice(1).join(" "))) result = await this.addSCURL(message, args);
      else if (validGDFolderURL(args.slice(1).join(" "))) result = await this.addGDFolderURL(message, args);
      else if (validGDURL(args.slice(1).join(" "))) result = await this.addGDURL(message, args);
      else if (validMSURL(args.slice(1).join(" "))) result = await this.addMSURL(message, args);
      else if (validPHURL(args.slice(1).join(" "))) result = await this.addPHURL(message, args);
      else if (validURL(args.slice(1).join(" "))) result = await this.addURL(message, args);
      else if (message.attachments.size > 0) result = await this.addAttachment(message);
      else result = await this.search(message, args);
      if (result.error) return;
      songs = result.songs;
      if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
      const Embed = createEmbed(message, songs);
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false, message.pool);
      else serverQueue.songs = ((!message.guild.me.voice.channel || !serverQueue.playing) ? songs : serverQueue.songs).concat((!message.guild.me.voice.channel || !serverQueue.playing) ? serverQueue.songs : songs);
      if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0]?.title}]**` }).catch(() => { }), 30000)).catch(() => { });
      else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0]?.title}]**` }).catch(() => { }), 30000)).catch(() => { });
      updateQueue(message, serverQueue, message.pool);
      if (!message.guild.me.voice.channel) {
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.connection = await voiceChannel.join();
        serverQueue.textChannel = message.channel;
        if (serverQueue.voice && !serverQueue.voice.selfDeaf) serverQueue.voice.setSelfDeaf(true);
      }
      updateQueue(message, serverQueue, null);
      if (!serverQueue.playing) {
        if (!serverQueue.random) play(message.guild, serverQueue.songs[0]);
        else {
          const int = Math.floor(Math.random() * serverQueue.songs.length);
          const pending = serverQueue.songs[int];
          serverQueue.songs = moveArray(serverQueue.songs, int);
          updateQueue(message, serverQueue, serverQueue.pool);
          play(message.guild, pending);
        }
      }
    } catch (err) {
      await message.reply("there was an error trying to connect to the voice channel!");
      if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
      NorthClient.storage.error(err);
    }
  },
  play: play,
  async addAttachment(message) {
    const files = message.attachments;
    const songs = [];
    for (const file of files.values()) {
      if (file.url.endsWith("mscz") || file.url.endsWith("mscx")) {
        await message.channel.send("This feature is not finished :/. There might be bugs.");
        const buffer = await fetch(file.url).then(res => res.arrayBuffer());
        await WebMscore.ready;
        const score = await WebMscore.load(file.url.split(".").slice(-1)[0], new Uint8Array(buffer));
        const title = await score.title();
        const duration = moment.duration(Math.round((await score.metadata()).duration), "seconds").format();
        songs.push({
          title: title,
          url: file.url,
          type: 7,
          time: duration,
          volume: 1,
          thumbnail: "https://pbs.twimg.com/profile_images/1155047958326517761/IUgssah__400x400.jpg",
          isLive: false
        });
        continue;
      }
      const stream = await fetch(file.url).then(res => res.body);
      try {
        var metadata = await mm.parseStream(stream, {}, { duration: true });
      } catch (err) {
        message.channel.send("The audio format is not supported!");
        return { error: true };
      }
      if (!metadata) {
        message.channel.send("An error occured while parsing the audio file into stream! Maybe it is not link to the file?");
        return { error: true };
      }
      const length = Math.round(metadata.format.duration);
      const songLength = moment.duration(length, "seconds").format();
      songs.push({
        title: (file.name ? file.name.split(".").slice(0, -1).join(".") : file.url.split("/").slice(-1)[0].split(".").slice(0, -1).join(".")).replace(/_/g, " "),
        url: file.url,
        type: 2,
        time: songLength,
        volume: 1,
        thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg",
        isLive: false
      });
    }
    return { error: false, songs };
  },
  async addYTPlaylist(message, args) {
    try {
      var playlistInfo = await ytpl(args.slice(1).join(" "), { limit: Infinity });
    } catch (err) {
      if (err.message === "This playlist is private.") message.channel.send("The playlist is private!");
      else {
        NorthClient.storage.error(err);
        message.reply("there was an error trying to fetch your playlist!");
      }
      return { error: true };
    }
    const videos = playlistInfo.items;
    const songs = [];
    var mesg = await message.channel.send(`Processing track: **0/${videos.length}**`);
    var interval = setInterval(() => (songs.length < videos.length) ? mesg.edit(`Processing track: **${songs.length - 1}/${videos.length}**`).catch(() => { }) : undefined, 1000);
    for (const video of videos) songs.push({
      title: video.title,
      url: video.shortUrl,
      type: 0,
      time: video.duration,
      thumbnail: video.bestThumbnail.url,
      volume: 1,
      isLive: video.isLive
    });
    clearInterval(interval);
    mesg.edit(`Track processing completed`).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
    return { error: false, songs: songs };
  },
  async addYTURL(message, args, type = 0) {
    try {
      var songInfo = await ytdl.getInfo(args.slice(1).join(" "), { requestOptions: { headers: { cookie: cookie.cookie, 'x-youtube-identity-token': process.env.YT } } });
    } catch (err) {
      if (!message.dummy) message.channel.send("Failed to get video data!");
      if (err.message.toLowerCase() == "input stream: Status code: 429".toLowerCase()) {
        NorthClient.storage.error("Received 429 error. Changing ytdl-core cookie...");
        cookie.id++;
        if (!process.env[`COOKIE${cookie.id}`]) {
          cookie.cookie = process.env.COOKIE;
          cookie.id = 0;
        }
        else cookie.cookie = process.env[`COOKIE${cookie.id}`];
      } else NorthClient.storage.error(err);
      return { error: true };
    }
    var length = parseInt(songInfo.videoDetails.lengthSeconds);
    var songLength = length == 0 ? "∞" : moment.duration(length, "seconds").format();
    const thumbnails = songInfo.videoDetails.thumbnails;
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
        isLive: length == 0,
        isPastLive: songInfo.videoDetails.isLiveContent
      }
    ];
    return { error: false, songs: songs };
  },
  async addSPURL(message, args) {
    const d = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(d.body.access_token);
    spotifyApi.setRefreshToken(process.env.SPOTREFRESH);
    const refreshed = await spotifyApi.refreshAccessToken().catch(NorthClient.storage.error);
    spotifyApi.setAccessToken(refreshed.body.access_token);
    var url_array = args.slice(1).join(" ").replace("https://", "").split("/");
    var musicID = url_array[2].split("?")[0];
    var highlight = false;
    if (url_array[2].split("?")[1]) highlight = url_array[2].split("?")[1].split("=")[0] === "highlight";
    if (highlight) musicID = url_array[2].split("?")[1].split("=")[1].split(":")[2];
    var type = url_array[1];
    var songs = [];
    switch (type) {
      case "playlist":
        var musics = await spotifyApi.getPlaylist(musicID, { limit: 50 });
        var tracks = musics.body.tracks.items;
        async function checkAll() {
          if (musics.body.tracks.next) {
            var offset = musics.body.tracks.offset + 50;
            musics = await spotifyApi.getPlaylist(musicID, { limit: 50, offset: offset });
            tracks = tracks.concat(musics.body.tracks.items);
            return await checkAll();
          }
        }
        await checkAll();
        var mesg = await message.channel.send(`Processing track: **0/${tracks.length}**`);
        for (var i = 0; i < tracks.length; i++) {
          await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => { });
          var results = [];
          try {
            const searched = await ytsr(`${tracks[i].track.artists[0].name} - ${tracks[i].track.name}`, { limit: 20 });
            results = searched.items.filter(x => x.type === "video" && x.duration.split(":").length < 3);
          } catch (err) {
            return { error: true };
          }
          var o = 0;
          for (var s = 0; s < results.length; s++) {
            if (isGoodMusicVideoContent(results[s])) {
              o = s;
              s = results.length - 1;
            }
            if (s + 1 == results.length) {
              const songLength = !results[o].live ? results[o].duration : "∞";
              songs.push({
                title: tracks[i].track.name,
                url: results[o].link,
                type: 1,
                spot: tracks[i].track.external_urls.spotify,
                thumbnail: tracks[i].track.album.images[0]?.url,
                time: songLength,
                volume: 1,
                isLive: results[o].live
              });
            }
          }
        }
        mesg.edit("Process completed").then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
        break;
      case "album":
        var tracks;
        var image;
        if (!highlight) {
          const album = await spotifyApi.getAlbums([musicID]);
          image = album.body.albums[0].images[0]?.url;
          let data = await spotifyApi.getAlbumTracks(musicID, { limit: 50 });
          tracks = data.body.items;
          async function checkAll() {
            if (!data.body.next) return;
            var offset = data.body.offset + 50;
            data = await spotifyApi.getAlbumTracks(musicID, { limit: 50, offset: offset });
            tracks = tracks.concat(data.body.items);
            return await checkAll();
          }
          await checkAll();
        } else {
          const data = await spotifyApi.getTracks([musicID]);
          tracks = data.body.tracks;
        }
        var mesg = await message.channel.send(`Processing track: **0/${tracks.length}**`);
        for (var i = 0; i < tracks.length; i++) {
          await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => { });
          var results = [];
          try {
            const searched = await ytsr(`${tracks[i].track.artists[0].name} - ${tracks[i].track.name}`, { limit: 20 });
            results = searched.items.filter(x => x.type === "video" && x.duration.split(":").length < 3);
          } catch (err) {
            return { error: true };
          }
          var o = 0;
          for (var s = 0; s < results.length; s++) {
            if (isGoodMusicVideoContent(results[s])) {
              o = s;
              s = results.length - 1;
            }
            if (s + 1 == results.length) {
              const songLength = !results[o].live ? results[o].duration : "∞";
              songs.push({
                title: tracks[i].name,
                url: results[o].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: highlight ? tracks[i].album.images[o]?.url : image,
                time: songLength,
                volume: 1,
                isLive: results[o].live
              });
            }
          }
        }
        mesg.edit("Track processing completed").then(msg => msg.delete({ timeout: 10000 })).catch(() => { });
        break;
      case "track":
        var tracks = await spotifyApi.getTracks([musicID]).body.tracks;
        for (var i = 0; i < tracks.length; i++) {
          var results;
          try {
            const searched = await ytsr(`${tracks[i].track.artists[0].name} - ${tracks[i].track.name}`, { limit: 20 });
            results = searched.items.filter(x => x.type === "video" && x.duration.split(":").length < 3);
          } catch (err) {
            return { error: true };
          }
          var o = 0;
          for (var s = 0; s < results.length; s++) {
            if (isGoodMusicVideoContent(results[s])) {
              o = s;
              s = results.length - 1;
            }
            if (s + 1 == results.length) {
              const songLength = !results[o].live ? results[o].duration : "∞";
              songs.push({
                title: tracks[i].name,
                url: results[o].link,
                type: 1,
                spot: tracks[i].external_urls.spotify,
                thumbnail: tracks[i].album.images[o].url,
                time: songLength,
                volume: 1,
                isLive: results[o].live
              });
            }
          }
        }
        break;
    }
    return { error: false, songs: songs };
  },
  async addSCURL(message, args) {
    const res = await fetch(`https://api.soundcloud.com/resolve?url=${args.slice(1).join(" ")}&client_id=${process.env.SCID}`);
    if (res.status !== 200) {
      message.channel.send("A problem occured while fetching the track information! Status Code: " + res.status);
      return { error: true };
    }
    const data = await res.json();
    if (data.kind == "user") {
      message.channel.send("What do you think you can do with a user?");
      return { error: true };
    }
    const songs = [];
    if (data.kind == "playlist") {
      for (const track of data.tracks) {
        const length = Math.round(track.duration / 1000);
        const songLength = moment.duration(length, "seconds").format();
        songs.push({
          title: track.title,
          type: 3,
          id: track.id,
          time: songLength,
          thumbnail: track.artwork_url,
          url: track.permalink_url,
          volume: 1,
          isLive: false
        });
      }
    } else {
      const length = Math.round(data.duration / 1000);
      const songLength = moment.duration(length, "seconds").format();
      songs.push({
        title: data.title,
        type: 3,
        id: data.id,
        time: songLength,
        thumbnail: data.artwork_url,
        url: data.permalink_url,
        volume: 1,
        isLive: false
      });
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
    var stream = await fetch(link).then(res => res.body);
    var title = "No Title";
    try {
      var metadata = await mm.parseStream(stream, {}, { duration: true });
      var html = await rp(args.slice(1).join(" "));
      var $ = cheerio.load(html);
      title = $("title").text().split(" - ").slice(0, -1).join(" - ").split(".").slice(0, -1).join(".");
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
  async addGDFolderURL(message, args) {
    const songs = [];
    try {
      const body = await rp(args.slice(1).join(" "));
      const $ = cheerio.load(body);
      const elements = $("div[data-target='doc']");
      for (const el of elements.toArray()) {
        const id = el.attribs["data-id"];
        const link = "https://drive.google.com/uc?export=download&id=" + id;
        const stream = await fetch(link).then(res => res.body);
        var title = "No Title";
        try {
          const metadata = await mm.parseStream(stream, {}, { duration: true });
          if (!metadata) continue;
          const html = await rp("https://drive.google.com/file/d/" + id + "/view");
          const $1 = cheerio.load(html);
          title = $1("title").text().split(" - ").slice(0, -1).join(" - ").split(".").slice(0, -1).join(".");
          const songLength = moment.duration(Math.round(metadata.format.duration), "seconds").format();
          songs.push({
            title: title,
            url: link,
            type: 4,
            time: songLength,
            volume: 1,
            thumbnail: "https://drive-thirdparty.googleusercontent.com/256/type/audio/mpeg",
            isLive: false
          });
        } catch (err) { }
      }
    } catch (err) {
      await message.reply("there was an error trying to open your link!");
      return { error: true };
    }
    return { error: false, songs: songs };
  },
  async addMSURL(message, args) {
    try {
      var data = muse(args.slice(1).join(" "));
    } catch (err) {
      message.reply("there was an error trying to fetch data of the score!");
      return { error: true };
    }
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
      if (parseInt(download) < 1) throw "Cannot get any video quality";
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
      if (!message.dummy) message.reply("there was an error processing the link!");
      return { error: true };
    }
  },
  async addURL(message, args) {
    var title = args.slice(1).join(" ").split("/").slice(-1)[0].split(".").slice(0, -1).join(".").replace(/_/g, " ");
    try {
      var stream = await fetch(args.slice(1).join(" ")).then(res => res.body);
      var metadata = await mm.parseStream(stream, {}, { duration: true });
      if (metadata.trackInfo && metadata.trackInfo[0] && metadata.trackInfo[0].title) title = metadata.trackInfo[0].title;
    } catch (err) {
      message.channel.send("The audio format is not supported!");
      return { error: true };
    }
    if (!metadata || !stream) {
      message.reply("there was an error while parsing the audio file into stream! Maybe it is not link to the file?");
      return { error: true };
    }
    const length = Math.round(metadata.format.duration);
    const songLength = moment.duration(length, "seconds").format();
    const song = {
      title: title,
      url: args.slice(1).join(" "),
      type: 2,
      time: songLength,
      volume: 1,
      thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg",
      isLive: false
    };
    const songs = [song];
    return { error: false, songs: songs };
  },
  async search(message, args) {
    const allEmbeds = [];
    const Embed = new Discord.MessageEmbed()
      .setTitle(`Search result of ${args.slice(1).join(" ")} on YouTube`)
      .setColor(color())
      .setTimestamp()
      .setFooter("Please do so within 60 seconds.", message.client.user.displayAvatarURL());
    const results = [];
    try {
      const searched = await ytsr(args.slice(1).join(" "), { limit: 20 });
      var video = searched.items.map(x => {
        x.thumbnail = x.bestThumbnail?.url;
        x.live = !!x.live;
        return x;
      });
    } catch (err) {
      NorthClient.storage.error(err);
      message.reply("there was an error trying to search the videos!");
      return { error: true };
    }
    const ytResults = video.map(x => ({
      title: decodeHtmlEntity(x.title),
      url: x.url,
      type: 0,
      time: !x.live ? x.duration : "∞",
      thumbnail: x.thumbnail,
      volume: 1,
      isLive: x.live
    })).filter(x => !!x.url);
    var num = 0;
    if (ytResults.length > 0) {
      results.push(ytResults);
      Embed.setDescription("Type **soundcloud** / **sc** to show the search results from SoundCloud.\nType the index of the soundtrack to select, or type anything else to cancel.\n\n" + ytResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
      allEmbeds.push(Embed);
    }
    const scEm = new Discord.MessageEmbed()
      .setTitle(`Search result of ${args.slice(1).join(" ")} on SoundCloud`)
      .setColor(color())
      .setTimestamp()
      .setFooter("Please do so within 60 seconds.", message.client.user.displayAvatarURL());
    try {
      var scSearched = await scdl.search({
        limit: 20,
        query: args.slice(1).join(" "),
        resourceType: "tracks"
      });
      num = 0;
    } catch (err) {
      NorthClient.storage.error(err);
      await message.reply("there was an error trying to search the videos!");
      return { error: true };
    }
    const scResults = scSearched.collection.map(x => ({
      title: x.title,
      url: x.permalink_url,
      type: 3,
      time: moment.duration(Math.floor(x.duration / 1000), "seconds").format(),
      thumbnail: x.artwork_url,
      volume: 1,
      isLive: false
    })).filter(x => !!x.url);
    if (scResults.length > 0) {
      results.push(scResults);
      scEm.setDescription("Type **youtube** / **yt** to show the search results from Youtube.\nType the index of the soundtrack to select, or type anything else to cancel.\n\n" + scResults.map(x => `${++num} - **[${x.title}](${x.url})** : **${x.time}**`).slice(0, 10).join("\n"));
      allEmbeds.push(scEm);
    }
    if (allEmbeds.length < 1) {
      await message.channel.send("Cannot find any result with the given string.");
      return { error: true };
    }
    var val = { error: true };
    var s = 0;
    var msg = await message.channel.send(allEmbeds[0]);
    const filter = x => x.author.id === message.author.id;
    const collector = await msg.channel.createMessageCollector(filter, { idle: 60000 });
    collector.on("collect", async collected => {
      collected.delete().catch(() => { });
      if (isNaN(parseInt(collected.content))) {
        switch (collected.content) {
          case "youtube":
          case "yt":
            s = 0;
            await msg.edit(allEmbeds[s]);
            break;
          case "soundcloud":
          case "sc":
            s = 1;
            await msg.edit(allEmbeds[s]);
            break;
          default:
            collector.emit("end");
        }
      } else {
        const o = parseInt(collected.content) - 1;
        if (o < 0 || o > results[s].length - 1) return collector.emit("end");
        const chosenEmbed = new Discord.MessageEmbed()
          .setColor(color())
          .setTitle("Music chosen:")
          .setThumbnail(results[s][o].thumbnail)
          .setDescription(`**[${decodeHtmlEntity(results[s][o].title)}](${results[s][o].url})** : **${results[s][o].time}**`)
          .setTimestamp()
          .setFooter("Have a nice day :)", message.client.user.displayAvatarURL());
        await msg.edit(chosenEmbed).catch(() => { });
        val = { error: false, songs: [results[s][o]], msg, embed: Embed };
        collector.emit("end");
      }
    });
    return new Promise(resolve => {
      collector.on("end", async () => {
        if (val.error) {
          const cancelled = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Action cancelled.")
            .setTimestamp()
            .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
          await msg.edit(cancelled).then(msg => setTimeout(() => msg.edit({ content: "**[Added Track: No track added]**", embed: null }), 30000));
        }
        resolve(val);
      });
    });
  },
  createEmbed: createEmbed
};
