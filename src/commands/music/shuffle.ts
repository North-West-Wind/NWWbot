import { GuildMember, Message } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes, shuffleArray } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class ShuffleCommand implements SlashCommand {
    name = "shuffle"
    description = "Shuffle the queue."
    category = 8

    async execute(interaction: NorthInteraction) {
        await this.shuffle(interaction);
    }

    async run(message: NorthMessage) {
        await this.shuffle(message);
    }

    async shuffle(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!Array.isArray(serverQueue?.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (!serverQueue || serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue.");
        if (((<GuildMember> message.member).voice.channelId !== message.guild.me.voice.channelId) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to shuffle the queue when the bot is playing!");
        if (serverQueue.playing) serverQueue.songs = shuffleArray(serverQueue.songs, 1);
        else serverQueue.songs = shuffleArray(serverQueue.songs, 0);
        await updateQueue(message.guild.id, serverQueue);
        await msgOrRes(message, "The queue has been shuffled.");
    }
}

const cmd = new ShuffleCommand();
export default cmd;