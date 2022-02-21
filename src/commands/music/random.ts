import { Message } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { msgOrRes } from "../../function.js";
import { getQueue, setQueue, updateQueue } from "../../helpers/music.js";

class RandomCommand implements SlashCommand {
    name = "random"
    description = "Plays the queue randomly."
    aliases = ["rnd"]
    category = 8

    async execute(interaction: NorthInteraction) {
        if (!interaction.guild) return await interaction.reply("This command only works on server.");
        await this.random(interaction);
    }

    async run(message: NorthMessage) {
        await this.random(message);
    }

    async random(message: Message | NorthInteraction) {
        var serverQueue = getQueue(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        serverQueue.random = !serverQueue.random;
        if (serverQueue.repeating && serverQueue.random) {
            serverQueue.repeating = false;
            await msgOrRes(message, "Disabled repeating to prevent conflict.");
        }
        try {
            updateQueue(message.guild.id, serverQueue);
            if (serverQueue.random) await msgOrRes(message, "The queue will be played randomly.");
            else await msgOrRes(message, "The queue will be played in order.");
        } catch (err: any) {
            await msgOrRes(message, "There was an error trying to update the status!");
        }
    }
}

const cmd = new RandomCommand();
export default cmd;