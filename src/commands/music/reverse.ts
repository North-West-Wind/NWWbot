import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { moveArray, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

const { play } = require("./play.js");

class ReverseCommand implements SlashCommand {
    name = "reverse"
    description = "Reverse the order of the server queue."
    aliases = ["rev"]
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.reverse(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.reverse(message);
    }

    async reverse(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, client.pool);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "Nothing is in the queue now.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to alter the queue when the bot is playing!");
        var oldSong = serverQueue.songs[0];
        serverQueue.songs.reverse();
        await msgOrRes(message, "The queue has been reversed!");
        updateQueue(message.guild.id, serverQueue, client.pool);
        if (oldSong != serverQueue.songs[0] && serverQueue.playing) {
            serverQueue.connection?.dispatcher?.destroy();
            if (!serverQueue.random) play(message.guild, serverQueue.songs[0]);
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

const cmd = new ReverseCommand();
export default cmd;