import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { SlashCommand } from "../../classes/NorthClient";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { globalClient as client } from "../../common";
import { msgOrRes } from "../../function";

class RepeatCommand implements SlashCommand {
    name = "repeat"
    description = "Toggle repeat of a soundtrack."
    aliases = ["rep", "rp"]
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.repeat(obj.interaction);
    }

    async run(message) {
        await this.repeat(message);
    }

    async repeat(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, client.pool);
        serverQueue.repeating = !serverQueue.repeating;
        if (serverQueue.repeating && serverQueue.looping) {
            serverQueue.looping = false;
            await msgOrRes(message, "Disabled looping to prevent conflict.");
        }
        try {
            await updateQueue(message.guild.id, serverQueue, client.pool);
            if (serverQueue.repeating) await msgOrRes(message, "The queue is now being repeated.");
            else await msgOrRes(message, "The queue is no longer being repeated.");
        } catch (err) {
            await msgOrRes(message, "There was an error trying to update the status!");
        }
    }
}

const cmd = new RepeatCommand();
export default cmd;