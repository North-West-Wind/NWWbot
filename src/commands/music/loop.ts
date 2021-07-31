import { Message } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class LoopCommand implements SlashCommand {
    name = "loop"
    description = "Toggle loop of the queue."
    category = 8
    aliases = ["lp"]

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.loop(obj.interaction);
    }

    async run(message: Message) {
        await this.loop(message);
    }

    async loop(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        serverQueue.looping = !serverQueue.looping;
        if (serverQueue.repeating && serverQueue.looping) {
            serverQueue.repeating = false;
            await msgOrRes(message, "Disabled repeating to prevent conflict.");
        }
        try {
            await updateQueue(message.guild.id, serverQueue, true);
            if (serverQueue.looping) await msgOrRes(message, "The queue is now being looped.");
            else await msgOrRes(message, "The queue is no longer being looped.");
        } catch (err) {
            await msgOrRes(message, "There was an error trying to update the status!");
        }
    }
}

const cmd = new LoopCommand();
export default cmd;