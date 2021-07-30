import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { moveArray, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

const { play } = require("./play.js");

class SkipCommand implements SlashCommand {
    name = "skip"
    description = "Skip a music in the queue."
    usage = "[amount]"
    aliases = ["s"]
    category = 8
    options = [{
        name: "amount",
        description: "The amount of soundtrack to skip.",
        required: false,
        type: 4
    }]

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        var skipped = 1;
        if (obj.args[0]?.value >= 1) skipped = parseInt(obj.args[0].value);
        await this.skip(obj.interaction, skipped);
    }

    async run(message: NorthMessage, args: string[]) {
        var skipped = 1;
        if (args[0]) {
            const parsed = parseInt(args[0]);
            if (isNaN(parsed)) await message.channel.send(`**${args[0]}** is not a integer. Will skip 1 track instead.`);
            else if (parsed < 1) await message.channel.send(`**${args[0]}** is smaller than 1. Will skip 1 track instead.`);
            else skipped = parsed;
        }
        await this.skip(message, skipped);
    }

    async skip(message: Message | Interaction, skip: number) {
        var serverQueue = getQueues().get(message.guild.id);
        const guild = message.guild;
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, client.pool);
        if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to skip the music when the bot is playing!");
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue!");
        serverQueue.connection?.dispatcher?.destroy();
        if (serverQueue.repeating) skip = 0;
        for (var i = 0; i < skip; i++) {
            if (serverQueue.looping) serverQueue.songs.push(serverQueue.songs[0]);
            serverQueue.songs.shift();
        }
        updateQueue(message.guild.id, serverQueue, client.pool);
        await msgOrRes(message, `Skipped **${Math.max(1, skip)}** track${skip > 1 ? "s" : ""}!`);
        if (message.member.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
            if (!serverQueue.random) play(guild, serverQueue.songs[0]);
            else {
                const int = Math.floor(Math.random() * serverQueue.songs.length);
                const pending = serverQueue.songs[int];
                serverQueue.songs = moveArray(serverQueue.songs, int);
                updateQueue(message.guild.id, serverQueue, serverQueue.pool);
                play(message.guild, pending);
            }
        }
    }
}

const cmd = new SkipCommand();
export default cmd;