const Discord = require("discord.js");
const {
    validURL,
    validYTURL,
    validSPURL,
    validGDURL,
    validYTPlaylistURL,
    validSCURL,
    validMSURL
} = require("../function.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addPHURL, addURL, search, updateQueue } = require("./play.js");

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    args: 1,
    async music(message, serverQueue, queue, pool) {
        const args = message.content.split(/ +/);
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
            else if (validPHURL(args.slice(1).join(" "))) result = await addPHURL(message, args);
            else if (validURL(args.slice(1).join(" "))) result = await addURL(message, args);
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else return message.channel.send(`The link/keywords you provided is invalid! Usage: \`${message.prefix}${this.name} ${this.usage}\``);
            if (result.error) return;
            else songs = result.songs;
            if (songs.length < 1) return message.reply("there was an error trying to add the soundtrack!");

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
                updateQueue(message, queueContruct, queue, pool)
                try {
                    const Embed = new Discord.MessageEmbed()
                        .setColor(console.color())
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
                updateQueue(message, serverQueue, queue, pool);
                const Embed = new Discord.MessageEmbed()
                    .setColor(console.color())
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
            const result = await search(message, args);
            if(result.error) return;
            var song = result.song;
            var msg = result.msg;
            if (!serverQueue) {
                const queueContruct = {
                    textChannel: null,
                    voiceChannel: null,
                    connection: null,
                    songs: [song],
                    volume: 1,
                    playing: false,
                    paused: false,
                    startTime: 0,
                    looping: false,
                    repeating: false
                };
                updateQueue(message, queueContruct, queue, pool);
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
                updateQueue(message, serverQueue, queue, pool);
                const Embed = new Discord.MessageEmbed()
                    .setColor(console.color())
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
        }
    }
}