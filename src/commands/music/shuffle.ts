import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes, shuffleArray } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class ShuffleCommand implements SlashCommand {
    name = "shuffle"
    description = "Shuffle the queue."
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.shuffle(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.shuffle(message);
    }

    async shuffle(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (!serverQueue || serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to shuffle the queue when the bot is playing!");
        if (serverQueue.playing) await shuffleArray(serverQueue.songs, 1);
        else await shuffleArray(serverQueue.songs, 0);
        await updateQueue(message.guild.id, serverQueue);
        await msgOrRes(message, "The queue has been shuffled.");
    }
}

const cmd = new ShuffleCommand();
export default cmd;