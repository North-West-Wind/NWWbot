import { GuildMember, Message } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { moveArray, msgOrRes } from "../../function.js";
import { getQueues, setQueue, updateQueue } from "../../helpers/music.js";
import { play } from "./play.js";

class ReverseCommand implements SlashCommand {
    name = "reverse"
    description = "Reverses the order of the server queue."
    aliases = ["rev"]
    category = 8

    async execute(interaction: NorthInteraction) {
        await this.reverse(interaction);
    }

    async run(message: NorthMessage) {
        await this.reverse(message);
    }

    async reverse(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "Nothing is in the queue now.");
        if (((<GuildMember> message.member).voice.channelId !== message.guild.me.voice.channelId) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to alter the queue when the bot is playing!");
        var oldSong = serverQueue.songs[0];
        serverQueue.songs.reverse();
        await msgOrRes(message, "The queue has been reversed!");
        updateQueue(message.guild.id, serverQueue);
        if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
            serverQueue.stop();
            if (!serverQueue.random) await play(message.guild, serverQueue.songs[0]);
            else {
                const int = Math.floor(Math.random() * serverQueue.songs.length);
                const pending = serverQueue.songs[int];
                serverQueue.songs = moveArray(serverQueue.songs, int);
                updateQueue(message.guild.id, serverQueue);
                await play(message.guild, pending);
            }
        }
    }
}

const cmd = new ReverseCommand();
export default cmd;