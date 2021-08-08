import { GuildMember, Message } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { msgOrRes } from "../../function";

class PauseCommand implements SlashCommand {
    name = "pause"
    description = "Pause the current music."
    category = 8

    async execute(interaction: NorthInteraction) {
        await this.pause(interaction);
    }

    async run(message: NorthMessage) {
        await this.pause(message);
    }

    async pause(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (((<GuildMember> message.member).voice.channelId !== message.guild.me.voice.channelId) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to pause the music when the bot is playing!");
        if (!serverQueue?.player) return await msgOrRes(message, "There is nothing playing.");
        if (!serverQueue.paused) {
            serverQueue.paused = true;
            serverQueue.player?.pause(true);
            await updateQueue(message.guild.id, serverQueue);
            return await msgOrRes(message, "The playback has been stopped.");
        } else {
            return await msgOrRes(message, "The playback is already stopped.");
        }
    }
}

const cmd = new PauseCommand();
export default cmd;