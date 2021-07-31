import { Message } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { msgOrRes } from "../../function";

class PauseCommand implements SlashCommand {
    name = "pause"
    description = "Pause the current music."
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.pause(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.pause(message);
    }

    async pause(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to pause the music when the bot is playing!");
        if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return await msgOrRes(message, "There is nothing playing.");
        if (!serverQueue.paused) {
            serverQueue.paused = true;
            if (serverQueue.connection.dispatcher)
                serverQueue.connection.dispatcher.pause(true);
            await updateQueue(message.guild.id, serverQueue);
            return await msgOrRes(message, "The playback has been stopped.");
        } else {
            return await msgOrRes(message, "The playback is already stopped.");
        }
    }
}

const cmd = new PauseCommand();
export default cmd;