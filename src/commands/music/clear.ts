import { joinVoiceChannel } from "@discordjs/voice";
import { GuildMember, Message } from "discord.js";

import { NorthInteraction, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class ClearCommand implements SlashCommand {
    name = "clear"
    description = "Clear the queue and stop the playing soundtrack. Also resets the volume to 100%."
    category = 8

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        await this.clear(interaction);
    }

    async run(message: Message) {
        await this.clear(message);
    }

    async clear(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "The queue is already empty!");
        if (((<GuildMember> message.member).voice.channelId !== message.guild.me.voice.channelId) && serverQueue.playing) return await msgOrRes(message, "You have to be in a voice channel to clear the queue when the bot is playing!");
        serverQueue?.player?.stop();
        serverQueue?.destroy();
        updateQueue(message.guild.id, null);
        await msgOrRes(message, "The queue has been cleared!");
    }
}

const cmd = new ClearCommand();
export default cmd;