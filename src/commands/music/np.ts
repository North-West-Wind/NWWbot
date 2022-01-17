
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
formatSetup(moment);
import * as Discord from "discord.js";
import ms from "ms";
import { color, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { globalClient as client } from "../../common";

const type = [
    "YouTube",
    "Spotify",
    "URL/Attachment",
    "SoundCloud",
    "Google Drive",
    "Musescore",
    "PornHub",
    "MSCZ/MSCX"
];

class NPCommand implements SlashCommand {
    name = "np"
    description = "Displays information about the soundtrack being played."
    aliases = ["nowplaying"]
    category = 8

    async execute(interaction: NorthInteraction) {
        await this.nowplaying(interaction);
    }

    async run(message: NorthMessage) {
        await this.nowplaying(message);
    }

    async nowplaying(message: Discord.Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue.");
        const filtered = serverQueue.songs.filter(song => !!song);
        if (serverQueue.songs.length !== filtered.length) {
            serverQueue.songs = filtered;
            updateQueue(message.guild.id, serverQueue);
        }
        var position = 0;
        const streamTime = serverQueue.getPlaybackDuration();
        if (streamTime && serverQueue.startTime) position = (streamTime - serverQueue.startTime);
        var processBar = [];
        for (let i = 0; i < 20; i++) processBar.push("═");
        var progress = 0;
        const isLive = !!serverQueue?.songs[0]?.isLive;
        const length = isLive ? 0 : (serverQueue.songs[0].time || 1);
        if (isLive) {
            processBar.splice(19, 1, "■");
            var positionTime = "∞";
        } else {
            var positionTime = moment.duration(Math.round(position / 1000), "seconds").format();
            if (position === 0 || isNaN(position))
                positionTime = "0:00";
            progress = Math.floor((position / length) * processBar.length);
            processBar.splice(progress, 1, "■");
        }
        var info = [];
        var embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Now playing:" + (serverQueue.playing ? "" : " (Not actually)"))
            .setTimestamp()
            .setFooter({ text: `Looping: ${serverQueue.looping ? "Enabled" : "Disabled"} | Repeating: ${serverQueue.repeating ? "Enabled" : "Disabled"} | Random: ${serverQueue.random ? "Enabled" : "Disabled"}`, iconURL: client.user.displayAvatarURL() });

        const songLength = !serverQueue.songs[0].time ? "∞" : moment.duration(serverQueue.songs[0].time, "seconds").format();
        if (serverQueue.songs[0].type === 1) info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].spot})**\nLength: **${songLength}**`, serverQueue.songs[0].thumbnail];
        else info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].url})**\nLive: **${isLive ? "Yes" : "No"}**\nVolume: **${serverQueue.songs[0].volume ? (`${serverQueue.volume * serverQueue.songs[0].volume * 100}% (Local) | ${serverQueue.volume * 100}% (Global)`) : `${serverQueue.volume * 100}%`}**\nType: **${type[serverQueue.songs[0].type]}**`, serverQueue.songs[0].thumbnail];
        embed.setDescription(`${info[0]}\n\n${positionTime} \`${processBar.join("")}\` ${songLength || "Unknown"}`).setThumbnail(info[1]);
        const msg = message instanceof Discord.Message ? await message.channel.send({embeds: [embed]}) : <Discord.Message>await message.reply({ embeds: [embed], fetchReply: true });;
        setTimeout(() => msg.edit({ content: "**[Outdated Now-Playing Information]**", embeds: [] }).catch(() => {}), 60000);
    }
}

const cmd = new NPCommand();
export default cmd;