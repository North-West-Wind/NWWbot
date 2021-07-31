import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class ClearCommand implements SlashCommand {
    name = "clear"
    description = "Clear the queue and stop the playing soundtrack. Also resets the volume to 100%."
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.clear(obj.interaction);
    }

    async run(message: Message) {
        await this.clear(message);
    }

    async clear(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "The queue is already empty!");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to clear the queue when the bot is playing!");
        serverQueue?.connection?.dispatcher?.destroy();
        message.guild.me?.voice?.channel?.leave();
        await updateQueue(message.guild.id, null);
        await msgOrRes(message, "The queue has been cleared!");
    }
}

const cmd = new ClearCommand();
export default cmd;