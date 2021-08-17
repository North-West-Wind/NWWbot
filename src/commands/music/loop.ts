import { Message } from "discord.js";

import { NorthInteraction, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class LoopCommand implements SlashCommand {
    name = "loop"
    description = "Toggle loop of the queue."
    category = 8
    aliases = ["lp"]

    async execute(interaction: NorthInteraction) {
        await this.loop(interaction);
    }

    async run(message: Message) {
        await this.loop(message);
    }

    async loop(message: Message | NorthInteraction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        serverQueue.looping = !serverQueue.looping;
        var useEdit = false;
        if (serverQueue.repeating && serverQueue.looping) {
            serverQueue.repeating = false;
            await msgOrRes(message, "Disabled repeating to prevent conflict.");
            useEdit = true;
        }
        try {
            updateQueue(message.guild.id, serverQueue, true);
            if (serverQueue.looping) await msgOrRes(message, "The queue is now being looped.", useEdit ? "followUp" : false);
            else await msgOrRes(message, "The queue is no longer being looped.", useEdit ? "followUp" : false);
        } catch (err) {
            await msgOrRes(message, "There was an error trying to update the status!", useEdit ? "followUp" : false);
        }
    }
}

const cmd = new LoopCommand();
export default cmd;