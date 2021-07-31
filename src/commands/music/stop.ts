import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { msgOrRes } from "../../function";

class StopCommand implements SlashCommand {
    name = "stop"
    description = "Stop the music and disconnect the bot from the voice channel."
    aliases = ["end", "disconnect", "dis"]
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.stop(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.stop(message);
    }

    async stop(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue?.playing) return await msgOrRes(message, "You have to be in a voice channel to stop the music when the bot is playing!");
        if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        serverQueue.playing = false;
        serverQueue.connection = null;
        serverQueue.voiceChannel = null;
        serverQueue.textChannel = null;
        if (message.guild.me.voice.channel) {
            message.guild.me.voice.channel.leave();
            await msgOrRes(message, ":wave:");
        } else await msgOrRes(message, "Re-stopped");
        await updateQueue(message.guild.id, serverQueue, false);
    }
}

const cmd = new StopCommand();
export default cmd;