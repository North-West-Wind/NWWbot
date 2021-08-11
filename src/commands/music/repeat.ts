import { Message } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { msgOrRes } from "../../function";

class RepeatCommand implements SlashCommand {
    name = "repeat"
    description = "Toggle repeat of a soundtrack."
    aliases = ["rep", "rp"]
    category = 8

    async execute(interaction: NorthInteraction) {
        await this.repeat(interaction);
    }

    async run(message: NorthMessage) {
        await this.repeat(message);
    }

    async repeat(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        serverQueue.repeating = !serverQueue.repeating;
        var useEdit = false;
        if (serverQueue.repeating && serverQueue.looping) {
            serverQueue.looping = false;
            await msgOrRes(message, "Disabled looping to prevent conflict.");
            useEdit = true;
        }
        try {
            await updateQueue(message.guild.id, serverQueue);
            if (serverQueue.repeating) await msgOrRes(message, "The queue is now being repeated.", "followUp");
            else await msgOrRes(message, "The queue is no longer being repeated.", "followUp");
        } catch (err) {
            await msgOrRes(message, "There was an error trying to update the status!", useEdit);
        }
    }
}

const cmd = new RepeatCommand();
export default cmd;