import { Message } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { moveArray, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { play } from "./play";

class RemoveCommand implements SlashCommand {
    name = "remove"
    description = "Remove soundtrack(s) from the queue."
    usage = "<index | starting index> [delete count]"
    category = 8
    args = 1
    options = [
        {
            name: "index",
            description: "The index of the soundtrack to be removed.",
            required: true,
            type: 4
        },
        {
            name: "count",
            description: "The amount of soundtrack to delete after the index.",
            required: false,
            type: 4
        }
    ]

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        const queueIndex = obj.args[0].value;
        const amount = obj.args[1].value || 1;
        if (amount < 1) return await obj.interaction.reply("The delete count must be larger than 0!");
        await this.remove(obj.interaction, queueIndex, amount);
    }

    async run(message: NorthMessage, args: string[]) {
        const queueIndex = parseInt(args[0]);
        const amount = parseInt(args[1]) || 1;
        if (isNaN(queueIndex)) return await message.channel.send("The query provided is not a number.");
        if (amount < 1) return await message.channel.send("The delete count must be larger than 0!");
        await this.remove(message, queueIndex, amount);
    }

    async remove(message: Message | Interaction, queueIndex: number, amount: number) {
        var serverQueue = getQueues().get(message.guild.id);
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to alter the queue when the bot is playing!");
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue.");
        const deleteIndex = queueIndex < 0 ? serverQueue.songs.length + queueIndex : queueIndex - 1;
        if (deleteIndex > serverQueue.songs.length - 1 || queueIndex === 0) return await msgOrRes(message, `You cannot remove a soundtrack that doesn't exist.`);
        const song = serverQueue.songs[deleteIndex];
        const oldSong = serverQueue.songs[0];
        const title = song.title;
        const removed = serverQueue.songs.splice(deleteIndex, amount);
        await updateQueue(message.guild.id, serverQueue);
        await msgOrRes(message, `${removed.length > 1 ? `**${removed.length} tracks** have` : `**${title}** has`} been removed from the queue.`);
        if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
            if (serverQueue.connection && serverQueue.connection.dispatcher) {
                serverQueue.connection.dispatcher.destroy();
            }
            if (!serverQueue.random) await play(message.guild, serverQueue.songs[0]);
            else {
                const int = Math.floor(Math.random() * serverQueue.songs.length);
                const pending = serverQueue.songs[int];
                serverQueue.songs = moveArray(serverQueue.songs, int);
                await updateQueue(message.guild.id, serverQueue);
                await play(message.guild, pending);
            }
        }
    }
}

const cmd = new RemoveCommand();
export default cmd;