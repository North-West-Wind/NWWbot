const Discord = require("discord.js");
const {
    validURL,
    validYTURL,
    validSPURL,
    validGDURL,
    decodeHtmlEntity,
    validYTPlaylistURL,
    validSCURL,
    validMSURL
} = require("../function.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addURL } = require("./play.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const ytsr = require("ytsr");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
formatSetup(moment);

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    async music(message, serverQueue, queue, pool) {
        const args = message.content.split(/ +/);

        if (!args[1]) args[1] = "";

        const checkURL = message.attachments.size > 0 || validURL(args.slice(1).join(" "));

        if (checkURL) {
            var songs = [];
            var result = { error: true };
            if (validYTURL(args.slice(1).join(" "))) {
                if (validYTPlaylistURL(args.slice(1).join(" "))) result = await addYTPlaylist(message, args);
                else result = await addYTURL(message, args);
            } else if (validSPURL(args.slice(1).join(" "))) result = await addSPURL(message, args);
            else if (validSCURL(args.slice(1).join(" "))) result = await addSCURL(message, args);
            else if (validGDURL(args.slice(1).join(" "))) result = await addGDURL(message, args);
            else if (validMSURL(args.slice(1).join(" "))) result = await addMSURL(message, args);
            else if (validURL(args.slice(1).join(" "))) result = await addURL(message, args);
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
            if(result.error) return;
            else songs = result.songs;
            if(songs.length < 1) return message.reply("there was an error trying to add the soundtrack!");

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: null,
                    voiceChannel: null,
                    connection: null,
                    songs: songs,
                    volume: 1,
                    playing: false,
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
                            msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { });
                        }, 30000);
                    }).catch(() => { });
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
                        msg.edit({ embed: null, content: `**[Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { });
                    }, 30000);
                }).catch(() => { });
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

                                return msg.edit(cancelled).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
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

                            msg.edit(chosenEmbed).catch(() => { });
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
                                            msg.edit({ embed: null, content: `**[Track: ${song.title}]**` }).catch(() => { });
                                        }, 30000);
                                    }).catch(() => { });
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
                                return await msg.edit(Embed).then(msg => {
                                    setTimeout(() => {
                                        msg.edit({ embed: null, content: `**[Track: ${song.title}]**` }).catch(() => { });
                                    }, 30000);
                                }).catch(() => { });
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
                            msg.edit(Ended).then(msg => msg.delete({ timeout: 10000 }).catch(() => { })).catch(() => { });
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