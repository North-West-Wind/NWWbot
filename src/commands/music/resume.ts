import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class ResumeCommand implements SlashCommand {
    name = "resume"
    description = "Resume the paused music."
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.resume(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.resume(message);
    }

    async resume(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, client.pool);
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to resume the music when the bot is playing!");
        if (!serverQueue || !serverQueue.connection || !serverQueue.connection.dispatcher) return await msgOrRes(message, "There is nothing playing.");
        if (serverQueue.paused) {
            serverQueue.paused = false;
            serverQueue.connection?.dispatcher?.resume();
            updateQueue(message.guild.id, serverQueue, null);
            return await msgOrRes(message, "The playback has been resumed.");
        } else {
            return await msgOrRes(message, "The playback is not stopped.");
        }
    }
}

const cmd = new ResumeCommand();
export default cmd;