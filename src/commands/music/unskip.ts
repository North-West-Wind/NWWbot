import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { moveArray } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { play } from "./play";

class UnSkipCommand implements SlashCommand {
    name = "unskip"
    description = "Go to the previous music in the queue."
    usage = "[amount]"
    aliases = ["us"]
    category = 8
    options = [{
        name: "amount",
        description: "The amount of soundtrack to go back.",
        required: false,
        type: 4
    }]

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        var skipped = 1;
        if (obj.args[0]?.value) {
            if (obj.args[0].value < 1) await obj.interaction.reply(`**${obj.args[0].value}** is smaller than 1. Will skip 1 track instead.`);
            else skipped = obj.args[0].value;
        }
        await this.unskip(obj.interaction, skipped);
    }

    async run(message: NorthMessage, args: string[]) {
        var skipped = 1;
        if (args[0]) {
            const parsed = parseInt(args[0]);
            if (isNaN(parsed)) await message.channel.send(`**${args[0]}** is not a integer. Will skip 1 track instead.`);
            else if (parsed < 1) await message.channel.send(`**${args[0]}** is smaller than 1. Will skip 1 track instead.`);
            else skipped = parsed;
        }
        await this.unskip(message, skipped);
    }

    async unskip(message: Message | Interaction, unskip: number) {
        var serverQueue = getQueues().get(message.guild.id);
        const guild = message.guild;
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to unskip the music when the bot is playing!");
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue!");
        if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        if (serverQueue.repeating) unskip = 0;
        for (var i = 0; i < unskip; i++) {
            var song = serverQueue.songs.pop();
            serverQueue.songs.unshift(song);
        }
        await updateQueue(message.guild.id, serverQueue);
        message.channel.send(`Unskipped **${Math.max(1, unskip)}** track${unskip > 1 ? "s" : ""}!`);
        if (message.member.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
            if (!serverQueue.random) await play(guild, serverQueue.songs[0]);
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

const cmd = new UnSkipCommand();
export default cmd;