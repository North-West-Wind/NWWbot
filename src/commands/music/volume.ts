import { Message } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, ServerQueue, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class VolumeCommand implements SlashCommand {
    name = "volume"
    description = "Turn the volume of music up or down by percentage."
    usage = "[percentage]"
    aliases = ["vol"]
    category = 8
    options = [
        {
            name: "percentage",
            description: "The percentage change of the volume.",
            required: false,
            type: 4
        },
        {
            name: "nowplaying",
            description: "Whether or not to perform soundtrack-specific action.",
            required: false,
            type: 5
        }
    ]

    async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        var serverQueue = getQueues().get(obj.interaction.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(obj.interaction.guild.id, [], false, false);
        if (obj.args && !obj.args[0]?.value) return await obj.interaction.reply(`The current volume is **${Math.round(serverQueue.volume * 100)}%** and the current volume of the soundtrack is **${Math.round(serverQueue.volume * (serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.songs[0].volume : 1) * 100)}%**`);
        await this.volume(obj.interaction, serverQueue, obj.args[0].value, obj.args[1]?.value);
    }

    async run(message: NorthMessage, args: string[]) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (!args[0]) return await message.channel.send(`The current volume is **${Math.round(serverQueue.volume * 100)}%** and the current volume of the soundtrack is **${Math.round(serverQueue.volume * (serverQueue.songs[0] && serverQueue.songs[0].volume ? serverQueue.songs[0].volume : 1) * 100)}%**`);
        if (isNaN(Number(args[0]))) return await message.channel.send("The percentage change you gave is not a number!");
        await this.volume(message, serverQueue, Number(args[0]), !!(args[1]?.toLowerCase() === "np"));
    }

    async volume(message: Message | Interaction, serverQueue: ServerQueue, change: number, specific: boolean) {
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to alter the volume when the bot is playing!");
        if (specific) {
            if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue. You cannot change the volume of current soundtrack.");
            if (!isNaN(serverQueue.songs[0].volume)) serverQueue.songs[0].volume += change / 100;
            else serverQueue.songs[0].volume = 1 + (change / 100);
            if (serverQueue.songs[0].volume > 10) serverQueue.songs[0].volume = 10;
            if (serverQueue.songs[0].volume < 0) serverQueue.songs[0].volume = 0;
            await msgOrRes(message, "Volume of the current soundtrack has been changed to **" + (serverQueue.volume * serverQueue.songs[0].volume * 100) + "%**.");
        } else {
            serverQueue.volume += change / 100;
            if (serverQueue.volume > 10) serverQueue.volume = 10;
            if (serverQueue.volume < 0) serverQueue.volume = 0;
            await msgOrRes(message, "Volume has been changed to **" + (serverQueue.volume * 100) + "%**.");
        }
        serverQueue.connection?.dispatcher?.setVolumeLogarithmic(serverQueue.songs[0]?.volume ? serverQueue.volume * serverQueue.songs[0].volume : serverQueue.volume);
        await updateQueue(message.guild.id, serverQueue, false);
    }
}

const cmd = new VolumeCommand();
export default cmd;