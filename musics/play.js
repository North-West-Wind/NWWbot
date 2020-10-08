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
  validMSURL
} = require("../function.js");
const { parseBody } = require("../commands/musescore.js");
const { migrate } = require("./migrate.js");
const ytdl = require("ytdl-core");
var color = Math.floor(Math.random() * 16777214) + 1;
var SpotifyWebApi = require("spotify-web-api-node");
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTID,
  clientSecret: process.env.SPOTSECRET,
  redirectUri: "https://nwws.ml"
});
const fetch = require("node-fetch");
const request = require("request-stream");
const mm = require("music-metadata");
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);
const scdl = require("soundcloud-downloader");
const rp = require("request-promise-native");
const cheerio = require("cheerio");
const StreamConcat = require('stream-concat');

const requestStream = url => {
  return new Promise((resolve, reject) => {
    request(url, (err, res) => err ? reject(err) : resolve(res));
  });
};

async function play(guild, song, queue, pool, skipped = 0) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    guild.me.voice.channel.leave();
    queue.delete(guild.id);
    pool.getConnection(function (err, con) {
      if (err) return console.error(err);
      con.query(
        "UPDATE servers SET queue = NULL WHERE id = " + guild.id,
        function (err) {
          if (err) return console.error(err);
          console.log("Updated song queue of " + guild.name);
        }
      );
      con.release();
    });
    return;
  }

  if (serverQueue.connection === null) return;
  if (serverQueue.connection.dispatcher)
    serverQueue.startTime = serverQueue.connection.dispatcher.streamTime;

  var dispatcher;
  async function skip() {
    skipped += 1;
    if (serverQueue.textChannel)
      serverQueue.textChannel.send("An error occured while trying to play the track! Skipping the track..." + `${skipped < 2 ? "" : `(${skipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
    if (skipped >= 3) {
      serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
      if (serverQueue.connection != null && serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.destroy();
      serverQueue.playing = false;
      serverQueue.connection = null;
      serverQueue.voiceChannel = null;
      serverQueue.textChannel = null;
      if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
    }
    const guildLoopStatus = serverQueue.looping;
    const guildRepeatStatus = serverQueue.repeating;

    if (guildLoopStatus) {
      await serverQueue.songs.push(song);
    }
    if (!guildRepeatStatus) {
      await serverQueue.songs.shift();
    }

    pool.getConnection(function (err, con) {
      if (err) return console.error(err);
      con.query(
        "UPDATE servers SET queue = '" +
        escape(JSON.stringify(serverQueue.songs)) +
        "' WHERE id = " +
        guild.id,
        function (err) {
          if (err) console.error(err);
          console.log("Updated song queue of " + guild.name);
        }
      );
      con.release();
    });
    return await play(guild, serverQueue.songs[0], queue, pool, skipped);
  }
  if (song.type === 2 || song.type === 4) {
    try {
      var requestedStream = await requestStream(song.url);
      var silence = await requestStream("https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3");
      var stream = new StreamConcat([silence, requestedStream], { highWaterMark: 1 << 25});
    } catch (err) {
      console.error(err);
      return await skip();
    }
    dispatcher = serverQueue.connection.play(stream);
  } else if (song.type === 3) {
    try {
      var stream = await scdl.download(song.url);
    } catch (err) {
      console.error(err);
      return await skip();
    }
    dispatcher = serverQueue.connection.play(stream);
  } else if (song.type === 5) {
    try {
      var requestedStream = await requestStream(song.mp3);
      var silence = await requestStream("https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3");
      var stream = new StreamConcat([silence, requestedStream], { highWaterMark: 1 << 25});
    } catch(err) {
      console.error(err);
      return await skip();
    }
    dispatcher = serverQueue.connection.play(stream);
  } else {
    try {
      var stream = await ytdl(song.url, {
        highWaterMark: 1 << 28, requestOptions: { headers: { cookie: process.env.COOKIE} }
      });
    } catch (err) {
      console.error(err);
      return await skip();
    }
    dispatcher = serverQueue.connection.play(stream);
  }
  const now = Date.now();
  if (serverQueue.textChannel) {
    const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Now playing:")
      .setThumbnail(song.type === 2 ? undefined : song.thumbnail)
      .setDescription(
        `**[${song.title}](${song.type === 1 ? song.spot : song.url})**\nLength: **${song.time}**`
      )
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    serverQueue.textChannel.send(Embed).then(msg => msg.delete({ timeout: 30000 }));
  }
  var oldSkipped = skipped;
  skipped = 0;
  dispatcher
    .on("finish", async () => {
      dispatcher = null;
      const guildLoopStatus = serverQueue.looping;
      const guildRepeatStatus = serverQueue.repeating;
      console.log("Music ended! In " + guild.name);

      if (guildLoopStatus) {
        await serverQueue.songs.push(song);
      }
      if (!guildRepeatStatus) {
        await serverQueue.songs.shift();
      }

      pool.getConnection(function (err, con) {
        if (err) return console.error(err);
        con.query(
          "UPDATE servers SET queue = '" +
          escape(JSON.stringify(serverQueue.songs)) +
          "' WHERE id = " +
          guild.id,
          function (err) {
            if (err) return console.error(err);
            console.log("Updated song queue of " + guild.name);
          }
        );
        con.release();
      });
      if(Date.now() - now < 1000 && serverQueue.textChannel) {
        serverQueue.textChannel.send(`There was probably an error playing the last track. (It played for less than a second!)\nPlease contact NorthWestWind#1885 if the problem persist. ${oldSkipped < 2 ? "" : `(${oldSkipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
        oldSkipped++;
        if(oldSkipped >= 3) {
          serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
          if (serverQueue.connection != null && serverQueue.connection.dispatcher)
            serverQueue.connection.dispatcher.destroy();
          serverQueue.playing = false;
          serverQueue.connection = null;
          serverQueue.voiceChannel = null;
          serverQueue.textChannel = null;
          if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
        }
      } else oldSkipped = 0;
      play(guild, serverQueue.songs[0], queue, pool, oldSkipped);
    })
    .on("error", error => {
      console.error(error);
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
  async music(message, serverQueue, queue, pool, exit, migrating) {
    const args = message.content.split(/ +/);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(3145728)) {
      return message.channel.send("I can't play in your voice channel!");
    }

    if (!args[1]) {
      if (message.attachments.size < 1) {
        if (!serverQueue || !serverQueue.songs || serverQueue.songs.length < 1)
          return message.channel.send(
            "No song queue found for this server! Please provide a link or keywords to get a music played!"
          );
        if (serverQueue.playing === true || migrating.find(x => x === message.guild.id)) {
          return await migrate(message, serverQueue, queue, pool, exit, migrating);
        }

        if (
          !message.guild.me.voice.channel ||
          message.guild.me.voice.channelID !== voiceChannel.id
        ) {
          try {
            var connection = await voiceChannel.join();
          } catch (err) {
            message.reply("there was an error trying to connect to the voice channel!");
            await message.guild.me.voice.channel.leave();
            return console.error(err);
          }
        } else {
          await message.guild.me.voice.channel.leave();
          try {
            var connection = await voiceChannel.join();
          } catch (err) {
            message.reply("there was an error trying to connect to the voice channel!");
            await message.guild.me.voice.channel.leave();
            return console.error(err);
          }
        }
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.connection = connection;
        serverQueue.playing = true;
        serverQueue.textChannel = message.channel;
        await queue.set(message.guild.id, serverQueue);
        play(message.guild, serverQueue.songs[0], queue, pool);
        return;
      } else {
        var files = message.attachments;
        var songs = [];
        for (const file of files.values()) {
          var stream = await requestStream(file.url);
          try {
            var metadata = await mm.parseStream(stream);
          } catch (err) {
            return message.channel.send("The audio format is not supported!");
          }
          if (!metadata)
            return message.channel.send(
              "An error occured while parsing the audio file into stream! Maybe it is not link to the file?"
            );
          var length = Math.round(metadata.format.duration);
          var songLength = moment.duration(length, "seconds").format();
          var song = {
            title: file.name.split(".")[0].replace(/_/g, " "),
            url: file.url,
            type: 2,
            time: songLength,
            volume: 1,
            thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg"
          };
          songs.push(song);
        }
      }
    }

    const checkURL = validURL(args.slice(1).join(" "));

    if (checkURL) {
      if (validYTURL(args.slice(1).join(" "))) {
        if (validYTPlaylistURL(args.slice(1).join(" "))) {
          try {
            var playlistInfo = await ytpl(args.slice(1).join(" "), { limit: Infinity });
          } catch (err) {
            if (err.message === "This playlist is private.") {
              return message.channel.send("The playlist is private!");
            } else {
              console.error(err);
              return message.reply(
                "there was an error trying to fetch your playlist!"
              );
            }
          }
          var videos = playlistInfo.items;
          var songs = [];
          var mesg = await message.channel.send(`Processing track: **0/${videos.length}**`);
          var interval = setInterval(async () => {
            if (songs.length < videos.length) await mesg.edit(`Processing track: **${songs.length - 1}/${videos.length}**`).catch(() => {});
          }, 1000);
          for (const video of videos) {
            var info = {
              title: video.title,
              url: video.url_simple,
              type: 0,
              time: video.duration,
              thumbnail: video.thumbnail,
              volume: 1
            };
            songs.push(info);
          }
          mesg.edit(`Track processing completed`).then(msg => msg.delete({ timeout: 10000 }).catch(() => {})).catch(() => {});
          clearInterval(interval);
        } else {
          try {
            var songInfo = await ytdl.getInfo(args.slice(1).join(" "), { requestOptions: { headers: { cookie: process.env.COOKIE } } });
          } catch (err) {
            return message.channel.send("No video was found!");
          }
          var length = parseInt(songInfo.videoDetails.lengthSeconds);
          var songLength = !songInfo.videoDetails.isLive && typeof songInfo.videoDetails.lengthSeconds === "string" ? moment.duration(length, "seconds").format() : "∞";
          var thumbnails = songInfo.videoDetails.thumbnail.thumbnails;
          var thumbUrl = thumbnails[thumbnails.length - 1].url;
          var maxWidth = 0;
          for(const thumbnail of thumbnails) {
            if(thumbnail.width > maxWidth) {
              maxWidth = thumbnail.width;
              thumbUrl = thumbnail.url;
            }
          }
          var songs = [
            {
              title: decodeHtmlEntity(songInfo.videoDetails.title),
              url: songInfo.videoDetails.video_url,
              type: 0,
              time: songLength,
              thumbnail: thumbUrl,
              volume: 1
            }
          ];
        }
      } else if (validSPURL(args.slice(1).join(" "))) {
        var d = await spotifyApi.clientCredentialsGrant();

        await spotifyApi.setAccessToken(d.body.access_token);
        await spotifyApi.setRefreshToken(process.env.SPOTREFRESH);

        var refreshed = await spotifyApi
          .refreshAccessToken()
          .catch(console.error);

        console.log("The access token has been refreshed!");

        // Save the access token so that it's used in future calls
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
              await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => {});
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
                return console.error(err);
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
                    volume: 1
                  };
                  songs.push(matched);
                  break;
                }
                if (s + 1 == results.length) {
                  var songLength = !results[s].live ? results[0].duration : "∞";
                  matched = {
                    title: tracks[i].track.name,
                    url: results[0].link,
                    type: 1,
                    spot:
                      tracks[i].track.external_urls.spotify,
                    thumbnail:
                      tracks[i].track.album.images[0].url,
                    time: songLength,
                    volume: 1
                  };
                  songs.push(matched);
                }
              }
            }
            mesg.edit("Process completed").then(msg => msg.delete({ timeout: 10000 }).catch(() => {})).catch(() => {});
            break;
          case "album":
            if (highlight === false) {
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
              await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`).catch(() => {});
              var matched;
              try {
                var searched = await ytsr(
                  tracks[i].artists[0].name + " - " + tracks[i].name,
                  { limit: 20 }
                );
                var results = searched.items.filter(
                  x => x.type === "video" && x.duration.split(":").length < 3
                );
              } catch (err) {
                return console.error(err);
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
                    volume: 1
                  };
                  songs.push(matched);
                  break;
                }
                if (s + 1 == results.length) {
                  var songLength = !results[s].live ? results[0].duration : "∞";
                  matched = {
                    title: tracks[i].name,
                    url: results[0].link,
                    type: 1,
                    spot: tracks[i].external_urls.spotify,
                    thumbnail: highlight
                      ? tracks[i].album.images[0].url
                      : image,
                    time: songLength,
                    volume: 1
                  };
                  songs.push(matched);
                }
              }
            }
            mesg.edit("Track processing completed").then(msg => msg.delete({ timeout: 10000 }).catch(() => {})).catch(() => {});
            break;
          case "track":
            var data = await spotifyApi.getTracks([musicID]);
            var tracks = data.body.tracks;

            for (var i = 0; i < tracks.length; i++) {
              var matched;
              try {
                var searched = await ytsr(
                  tracks[i].artists[0].name + " - " + tracks[i].name,
                  { limit: 20 }
                );
                var results = searched.items.filter(
                  x => x.type === "video" && x.duration.split(":").length < 3
                );
              } catch (err) {
                return console.error(err);
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
                    volume: 1
                  };
                  songs.push(matched);
                  break;
                }
                if (s + 1 == results.length) {
                  var songLength = !results[s].live ? results[0].duration : "∞";
                  matched = {
                    title: tracks[i].name,
                    url: results[0].link,
                    type: 1,
                    spot: tracks[i].external_urls.spotify,
                    thumbnail: tracks[i].album.images[0].url,
                    time: songLength,
                    volume: 1
                  };
                  songs.push(matched);
                }
              }
              break;
            }
        }
      } else if (validSCURL(args.slice(1).join(" "))) {
        var res = await fetch(
          `https://api.soundcloud.com/resolve?url=${args.slice(1).join(" ")}&client_id=${process.env.SCID
          }`
        );
        if (res.status !== 200) {
          return message.channel.send(
            "A problem occured while fetching the track information! Status Code: " +
            res.status
          );
        }
        var data = await res.json();
        if (data.kind == "user") {
          return message.channel.send(
            "What do you think you can do with a user?"
          );
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
              volume: 1
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
              volume: 1
            }
          ];
        }
      } else if (validGDURL(args.slice(1).join(" "))) {
        const formats = [/https:\/\/drive\.google\.com\/file\/d\/(?<id>.*?)\/(?:edit|view)\?usp=sharing/, /https:\/\/drive\.google\.com\/open\?id=(?<id>.*?)$/];
        const alphanumeric = /^[a-zA-Z0-9\-_]+$/;
        let id;
        formats.forEach((regex) => {
          const matches = args.slice(1).join(" ").match(regex)
          if (matches && matches.groups && matches.groups.id) id = matches.groups.id
        });
        if (!id) {
          if (alphanumeric.test(args.slice(1).join(" "))) id = args.slice(1).join(" ");
          else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
        }
        var link = "https://drive.google.com/uc?export=download&id=" + id;
        var stream = await requestStream(link);
        try {
          var metadata = await mm.parseStream(stream);
          var html = await rp(args.slice(1).join(" "));
          var $ = cheerio.load(html);
          var titleArr = $("title").text().split(" - ");
          titleArr.splice(-1, 1);
          var titleArr2 = titleArr.join(" - ").split(".");
          titleArr2.splice(-1, 1);
          var title = titleArr2.join(".");
        } catch (err) {
          return message.reply("there was an error trying to parse your link!");
        }
        if (!metadata) return message.channel.send("An error occured while parsing the audio file into stream! Maybe it is not link to the file?");
        var length = Math.round(metadata.format.duration);
        var songLength = moment.duration(length, "seconds").format();

        var song = {
          title: title,
          url: link,
          type: 4,
          time: songLength,
          volume: 1,
          thumbnail: "https://drive-thirdparty.googleusercontent.com/256/type/audio/mpeg"
        };
        var songs = [song];
      } else if (validMSURL(args.slice(1).join(" "))) {
        try {
            var response = await rp({ uri: args.slice(1).join(" "), resolveWithFullResponse: true });
            if (Math.floor(response.statusCode / 100) !== 2) return message.channel.send(`Received HTTP status code ${response.statusCode} when fetching data.`);
            var body = response.body;
        } catch (err) {
            return message.reply("there was an error trying to fetch data of the score!");
        }
        var data = parseBody(body);
        var stream = await requestStream(data.mp3);
        try {
          var metadata = await mm.parseStream(stream);
        } catch (err) {
          return message.channel.send(
            "The audio format is not supported!"
          );
        }
        if (!metadata)
          return message.channel.send(
            "An error occured while parsing the audio file into stream! Maybe it is not link to the file?"
          );
        var length = Math.round(metadata.format.duration);
        var songLength = moment.duration(length, "seconds").format();
        var song = {
          title: data.title,
          url: args.slice(1).join(" "),
          mp3: data.mp3,
          type: 5,
          time: songLength,
          volume: 1,
          thumbnail: "https://s3.amazonaws.com/s.musescore.org/about/images/design_MU3/musescore_sticker+11%403x.png"
        };
        var songs = [song];
      } else if (validURL(args.slice(1).join(" "))) {
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
        var stream = await requestStream(args.slice(1).join(" "));
        try {
          var metadata = await mm.parseStream(stream);
        } catch (err) {
          return message.channel.send(
            "The audio format is not supported!"
          );
        }
        if (metadata === undefined)
          return message.channel.send(
            "An error occured while parsing the audio file into stream! Maybe it is not link to the file?"
          );
        var length = Math.round(metadata.format.duration);
        var songLength = moment.duration(length, "seconds").format();
        var song = {
          title: title,
          url: args.slice(1).join(" "),
          type: 2,
          time: songLength,
          volume: 1,
          thumbnail: "https://www.flaticon.com/svg/static/icons/svg/2305/2305904.svg"
        };
        var songs = [song];
      } else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);

      if (!serverQueue) {
        const queueContruct = {
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

        queue.set(message.guild.id, queueContruct);

        try {
          pool.getConnection(function (err, con) {
            if (err) return message.reply("there was an error trying to connect to the database!");
            con.query(
              "UPDATE servers SET queue = '" +
              escape(JSON.stringify(queueContruct.songs)) +
              "' WHERE id = " +
              message.guild.id,
              function (err, result) {
                if (err)
                  return message.reply(
                    "there was an error trying to update the queue!"
                  );
                console.log("Updated song queue of " + message.guild.name);
              }
            );
            con.release();
          });
          try {
            var connection = await voiceChannel.join();
          } catch (err) {
            message.reply("there was an error trying to connect to the voice channel!");
            await message.guild.me.voice.channel.leave();
            return console.error(err);
          }
          queueContruct.connection = connection;

          play(
            message.guild,
            queueContruct.songs[0],
            queue,
            pool
          );
          const Embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("New track added:")
            .setThumbnail(songs[0].thumbnail)
            .setDescription(
              `**[${songs[0].title}](${songs[0].url})**\nLength: **${songs[0].time}**`
            )
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL()
            );
          if (songs.length > 1) {
            Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
          }
          return message.channel.send(Embed).then(msg => {
            setTimeout(() => {
              msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => {});
            }, 30000);
          }).catch(() => {});
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
        if (!message.guild.me.voice.channel || serverQueue.playing === false) {
          serverQueue.songs = songs.concat(serverQueue.songs);
        } else {
          serverQueue.songs = serverQueue.songs.concat(songs);
        }

        pool.getConnection(function (err, con) {
          if (err) return message.reply("there was an error trying to connect to the database!");
          con.query(
            "UPDATE servers SET queue = '" +
            escape(JSON.stringify(serverQueue.songs)) +
            "' WHERE id = " +
            message.guild.id,
            function (err) {
              if (err)
                return message.reply(
                  "there was an error trying to update the queue!"
                );
              console.log("Updated song queue of " + message.guild.name);
            }
          );
          con.release();
        });

        if (!message.guild.me.voice.channel) {
          try {
            var connection = await voiceChannel.join();
          } catch (err) {
            message.reply("there was an error trying to connect to the voice channel!");
            await message.guild.me.voice.channel.leave();
            return console.error(err);
          }
          serverQueue.voiceChannel = voiceChannel;
          serverQueue.connection = connection;
          serverQueue.playing = true;
          serverQueue.textChannel = message.channel;
          play(
            message.guild,
            serverQueue.songs[0],
            queue,
            pool
          );
        } else if (serverQueue.playing === false) {
          play(
            message.guild,
            serverQueue.songs[0],
            queue,
            pool
          );
        }
        const Embed = new Discord.MessageEmbed()
          .setColor(color)
          .setTitle("New track added:")
          .setThumbnail(songs[0].thumbnail)
          .setDescription(
            `**[${songs[0].title}](${songs[0].url})**\nLength: **${songs[0].time}**`
          )
          .setTimestamp()
          .setFooter(
            "Have a nice day! :)",
            message.client.user.displayAvatarURL()
          );
        if (songs.length > 1) {
          Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
        }
        return message.channel.send(Embed).then(msg => {
          setTimeout(() => {
            msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => {});
          }, 30000);
        }).catch(() => {});
      }
    } else {
      const Embed = new Discord.MessageEmbed()
        .setTitle("Search result of " + args.slice(1).join(" "))
        .setColor(color)
        .setTimestamp()
        .setFooter(
          "Choose your song by typing the number, or type anything else to cancel.",
          message.client.user.displayAvatarURL()
        );
      const results = [];
      var saved = [];
      try {
        var searched = await ytsr(args.slice(1).join(" "), { limit: 10 });
        var video = searched.items.filter(x => x.type === "video");
      } catch (err) {
        console.error(err);
      }
      var num = 0;
      for (let i = 0; i < video.length; i++) {
        try {
          saved.push(video[i]);
          results.push(
            ++num +
            " - **[" +
            decodeHtmlEntity(video[i].title) +
            "](" +
            video[i].link +
            ")** : **" +
            video[i].duration +
            "**"
          );
        } catch {
          --num;
        }
      }
      Embed.setDescription(results.join("\n"));
      message.channel
        .send(Embed)
        .then(async msg => {

          var filter = x => x.author.id === message.author.id;

          msg.channel
            .awaitMessages(filter, { max: 1, time: 30000, error: ["time"] })
            .then(async collected => {
              const content = collected.first().content;
              collected.first().delete();
              if (
                isNaN(parseInt(content)) ||
                (parseInt(content) < 1 && parseInt(content) > results.length)
              ) {
                const cancelled = new Discord.MessageEmbed()
                  .setColor(color)
                  .setTitle("Action cancelled.")
                  .setTimestamp()
                  .setFooter(
                    "Have a nice day! :)",
                    message.client.user.displayAvatarURL()
                  );

                return msg.edit(cancelled).then(msg => msg.delete({ timeout: 10000 }).catch(() => {})).catch(() => {});
              }

              var s = parseInt(content) - 1;

              const chosenEmbed = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("Music chosen:")
                .setThumbnail(saved[s].thumbnail)
                .setDescription(
                  `**[${decodeHtmlEntity(saved[s].title)}](${saved[s].link
                  })** : **${saved[s].duration}**`
                )
                .setTimestamp()
                .setFooter(
                  "Have a nice day :)",
                  message.client.user.displayAvatarURL()
                );

              msg.edit(chosenEmbed).catch(() => {});
              var length = !saved[s].live ? saved[s].duration : "∞";
              var song = {
                title: decodeHtmlEntity(saved[s].title),
                url: saved[s].link,
                type: 0,
                time: length,
                thumbnail: saved[s].thumbnail,
                volume: 1
              };

              if (!serverQueue) {
                const queueContruct = {
                  textChannel: message.channel,
                  voiceChannel: voiceChannel,
                  connection: null,
                  songs: [],
                  volume: 1,
                  playing: true,
                  paused: false,
                  startTime: 0,
                  looping: false,
                  repeating: false
                };

                queue.set(message.guild.id, queueContruct);

                await queueContruct.songs.push(song);
                pool.getConnection(function (err, con) {
                  if (err) return console.error(err);
                  con.query(
                    "UPDATE servers SET queue = '" +
                    escape(JSON.stringify(queueContruct.songs)) +
                    "' WHERE id = " +
                    message.guild.id,
                    function (err, result) {
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
                  try {
                    var connection = await voiceChannel.join();
                  } catch (err) {
                    message.reply("there was an error trying to connect to the voice channel!");
                    await message.guild.me.voice.channel.leave();
                    return console.error(err);
                  }
                  queueContruct.connection = connection;

                  play(
                    message.guild,
                    queueContruct.songs[0],
                    queue,
                    pool
                  );
                  msg.edit(Embed).then(msg => {
                    setTimeout(() => {
                      msg.edit({ embed: null, content: `**[Track: ${song.title}]**` }).catch(() => {});
                    }, 30000);
                  }).catch(() => {});
                } catch (err) {
                  console.log(err);
                  queue.delete(message.guild.id);
                  return console.error(err);
                }
              } else {
                if (
                  !message.guild.me.voice.channel ||
                  serverQueue.playing === false
                ) {
                  serverQueue.songs.unshift(song);
                } else {
                  serverQueue.songs.push(song);
                }
                pool.getConnection(function (err, con) {
                  if (err) return message.reply("there was an error trying to connect to the database!");
                  con.query(
                    "UPDATE servers SET queue = '" +
                    escape(JSON.stringify(serverQueue.songs)) +
                    "' WHERE id = " +
                    message.guild.id,
                    function (err) {
                      if (err)
                        return message.reply(
                          "there was an error trying to update the queue!"
                        );
                      console.log(
                        "Updated song queue of " + message.guild.name
                      );
                    }
                  );
                  con.release();
                });
                if (!message.guild.me.voice.channel) {
                  try {
                    var connection = await voiceChannel.join();
                  } catch (err) {
                    message.reply("there was an error trying to connect to the voice channel!");
                    await message.guild.me.voice.channel.leave();
                    return console.error(err);
                  }
                  serverQueue.voiceChannel = voiceChannel;
                  serverQueue.connection = connection;
                  serverQueue.playing = true;
                  serverQueue.textChannel = message.channel;
                  play(
                    message.guild,
                    serverQueue.songs[0],
                    queue,
                    pool
                  );
                } else if (serverQueue.playing === false) {
                  play(
                    message.guild,
                    serverQueue.songs[0],
                    queue,
                    pool
                  );
                }
                const Embed = new Discord.MessageEmbed()
                  .setColor(color)
                  .setTitle("New track added:")
                  .setThumbnail(song.thumbnail)
                  .setDescription(
                    `**[${song.title}](${song.url})**\nLength: **${song.time}**`
                  )
                  .setTimestamp()
                  .setFooter(
                    "Have a nice day! :)",
                    message.client.user.displayAvatarURL()
                  );
                return msg.edit(Embed).then(msg => {
                  setTimeout(() => {
                    msg.edit({ embed: null, content: `**[Track: ${song.title}]**` }).catch(() => {});
                  }, 30000);
                }).catch(() => {});
              }
            })
            .catch(err => {
              const Ended = new Discord.MessageEmbed()
                .setColor(color)
                .setTitle("Timed out.")
                .setTimestamp()
                .setFooter(
                  "Have a nice day! :)",
                  message.client.user.displayAvatarURL()
                );
              msg.edit(Ended).then(msg => msg.delete({ timeout: 10000 }).catch(() => {})).catch(() => {});
            });
        })
        .catch(err => {
          console.log("Failed to send Embed.");
          if (err.message === "Missing Permissions") {
            message.author.send("I cannot send my search results!");
          }
          console.error(err);
        });
    }
  },
  play: play
};
