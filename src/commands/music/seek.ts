import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, ServerQueue, SlashCommand } from "../../classes/NorthClient";
import { ms, msgOrRes } from "../../function";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
import { getQueues, setQueue } from "../../helpers/music";
formatSetup(moment);
import { play } from "./play";

class SeekCommand implements SlashCommand {
    name = "seek"
    description = "Skip to the time specified for the current playing soundtrack."
    usage = "<time>"
    aliases = ["skipto"]
    category = 8
    options = [{
        name: "time",
        description: "The position to skip to.",
        required: true,
        type: 3
    }]

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        var serverQueue = getQueues().get(obj.interaction.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(obj.interaction.guild.id, [], false, false);
        var parsed = ms(obj.args[0].value);
        if (obj.args[0].value.endsWith("%")) {
            const percentage = Number(obj.args[0].value.slice(0, -1));
            if (isNaN(percentage) || percentage > 100 || percentage < 0) return await obj.interaction.reply("The given percentage is not valid!");
            parsed = ms(serverQueue.songs[0].time) * (percentage / 100);
        }
        await this.seek(obj.interaction, serverQueue, parsed);
    }

    async run(message: NorthMessage, args: string[]) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (args.length < 1) return await message.channel.send("You didn't provide the time to skip to!");
        var parsed = ms(args.join(" "));
        if (args.join(" ").endsWith("%")) {
            const percentage = Number(args.join(" ").slice(0, -1));
            if (isNaN(percentage) || percentage > 100 || percentage < 0) return await message.channel.send("The given percentage is not valid!");
            parsed = ms(serverQueue.songs[0].time) * (percentage / 100);
        }
        await this.seek(message, serverQueue, parsed);
    }

    async seek(message: Message | Interaction, serverQueue: ServerQueue, seek: number) {
        if (serverQueue.songs.length < 1 || !serverQueue.connection || !serverQueue.connection.dispatcher || !serverQueue.playing) return await msgOrRes(message, "There is nothing in the queue.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to change the time of the soundtrack begins when the bot is playing!");
        if (serverQueue.songs[0].time === "∞") return await msgOrRes(message, "This command does not work for live videos.");
        if (!seek) return await msgOrRes(message, "The given time is not valid!");
        if (Math.round(seek / 1000) > Math.floor(ms(serverQueue.songs[0].time) / 1000)) return await msgOrRes(message, "The time specified should not be larger than the maximum length of the soudtrack!");
        serverQueue.connection?.dispatcher?.destroy();
        await play(message.guild, serverQueue.songs[0], 0, Math.round(seek / 1000));
        await msgOrRes(message, `Seeked to **${seek == 0 ? "0:00" : moment.duration(Math.round(seek / 1000), "seconds").format()}**`);
    }
}

const cmd = new SeekCommand();
export default cmd;