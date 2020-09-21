const Discord = require("discord.js");
const {
    validURL,
    validYTURL,
    validSPURL,
    validGDURL,
    isGoodMusicVideoContent,
    decodeHtmlEntity,
    validYTPlaylistURL,
    validSCURL
} = require("../function.js");
const ytdl = require("ytdl-core-discord");
var color = Math.floor(Math.random() * 16777214) + 1;
var SpotifyWebApi = require("spotify-web-api-node");
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTID,
    clientSecret: process.env.SPOTSECRET,
    redirectUri: "https://nwws.ml"
});
const fetch = require("node-fetch");
const mm = require("music-metadata");
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    async music(message, serverQueue, looping, queue, pool) {
        const args = message.content.split(/ +/);

        if (!args[1]) args[1] = "";

        const checkURL = message.attachments.size > 0 || validURL(args[1]);

        if (checkURL) {
            if (validYTURL(args[1])) {
                if (validYTPlaylistURL(args[1])) {
                    try {
                        var playlistInfo = await ytpl(args[1], { limit: Infinity });
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
                        if (songs.length < videos.length) await mesg.edit(`Processing track: **${songs.length - 1}/${videos.length}**`);
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
                    mesg.edit(`Track processing completed`).then(msg => msg.delete({ timeout: 10000 }));
                    clearInterval(interval);
                } else {
                    try {
                        var songInfo = await ytdl.getInfo(args[1]);
                    } catch (err) {
                        return message.channel.send("No video was found!");
                    }
                    var length = parseInt(songInfo.length_seconds);
                    var songLength = moment.duration(length, "seconds").format();
                    var songs = [
                        {
                            title: decodeHtmlEntity(songInfo.title),
                            url: songInfo.video_url,
                            type: 0,
                            time: songLength,
                            thumbnail: `https://img.youtube.com/vi/${songInfo.video_id}/maxresdefault.jpg`,
                            volume: 1
                        }
                    ];
                }
            } else if (validSPURL(args[1])) {
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
                            await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`);
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
                                    var songLength = results[s].duration;
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
                                    var songLength = results[0].duration;
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
                        mesg.edit("Process completed").then(msg => msg.delete({ timeout: 10000 }));
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
                            await mesg.edit(`Processing track: **${i + 1}/${tracks.length}**`)
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
                                    var songLength = results[s].duration;
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
                                    var songLength = results[0].duration;
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
                        mesg.edit("Track processing completed").then(msg => msg.delete({ timeout: 10000 }))
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
                                    var songLength = results[s].duration;
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
                                    var songLength = results[0].duration;
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
            } else if (validSCURL(args[1])) {
                var res = await fetch(
                    `https://api.soundcloud.com/resolve?url=${args[1]}&client_id=${process.env.SCID
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
            } else if(validGDURL(args[1])) {
                const formats = [/https:\/\/drive\.google\.com\/file\/d\/(?<id>.*?)\/(?:edit|view)\?usp=sharing/, /https:\/\/drive\.google\.com\/open\?id=(?<id>.*?)$/];
                formats.forEach((regex) => {
                    const matches = url.match(regex)
                    if (matches && matches.groups && matches.groups.id) id = matches.groups.id
                });
                if (!id) {
                    if (alphanumeric.test(url)) id = url
                    else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
                }
                var link = "https://drive.google.com/uc?export=download&id=" + id;
                var stream = await requestStream(link);
                try {
                    var metadata = await mm.parseStream(stream);
                } catch (err) {
                    return message.channel.send("The audio format is not supported!");
                }
                if (!metadata) return message.channel.send("An error occured while parsing the audio file into stream! Maybe it is not link to the file?");
                var length = Math.round(metadata.format.duration);
                var songLength = moment.duration(length, "seconds").format();
                var song = {
                    title: stream.data.name,
                    url: args[1],
                    type: 4,
                    time: songLength,
                    volume: 1
                };
                var songs = [song];
            } else if (message.attachments.size > 0) {
                var linkArr = args[1].split("/");
                if (linkArr[linkArr.length - 1].split("?").length == 1) {
                    var title = linkArr[linkArr.length - 1]
                        .split(".")[0]
                        .replace(/_/g, " ");
                } else {
                    linkArr = args[1].split("?");
                    var title = linkArr[linkArr.length - 1]
                        .split(".")[0]
                        .replace(/_/g, " ");
                }
                var stream = await requestStream(args[1]);
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
                    url: args[1],
                    type: 2,
                    time: songLength,
                    volume: 1
                };
                var songs = [song];
            } else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: null,
                    voiceChannel: null,
                    connection: null,
                    songs: songs,
                    volume: 1,
                    playing: false,
                    paused: false,
                    startTime: 0
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
                            msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` });
                        }, 30000);
                    });
                } catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.reply("there was an error adding your soundtrack!");
                }
            } else {
                serverQueue.songs = serverQueue.songs.concat(songs);

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
                        msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` });
                    }, 30000);
                });
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

                                return msg.edit(cancelled).then(msg => msg.delete({ timeout: 10000 }));
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

                            msg.edit(chosenEmbed);
                            var length = saved[s].duration;
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
                                    textChannel: null,
                                    voiceChannel: null,
                                    connection: null,
                                    songs: [],
                                    volume: 1,
                                    playing: false,
                                    paused: false,
                                    startTime: 0
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
                                        function (err) {
                                            if (err)
                                                return console.error(err);
                                            console.log(
                                                "Updated song queue of " + message.guild.name
                                            );
                                        }
                                    );
                                    con.release();
                                });
                                try {
                                    msg.edit(Embed).then(msg => {
                                        setTimeout(() => {
                                            msg.edit({ embed: null, content: `**[Track: ${song.title}]**` });
                                        }, 30000);
                                    });
                                } catch (err) {
                                    console.log(err);
                                    queue.delete(message.guild.id);
                                    return;
                                }
                            } else {
                                serverQueue.songs.push(song);
                                pool.getConnection(function (err, con) {
                                    if (err) return console.error(err);
                                    con.query(
                                        "UPDATE servers SET queue = '" +
                                        escape(JSON.stringify(serverQueue.songs)) +
                                        "' WHERE id = " +
                                        message.guild.id,
                                        function (err) {
                                            if (err)
                                                return console.error(err);
                                            console.log(
                                                "Updated song queue of " + message.guild.name
                                            );
                                        }
                                    );
                                    con.release();
                                });
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
                                        msg.edit({ embed: null, content: `**[Track: ${song.title}]**` });
                                    }, 30000);
                                });
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
                            msg.edit(Ended).then(msg => msg.delete({ timeout: 10000 }));
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
    }
}