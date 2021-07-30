import { Message } from "discord.js";
import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

class RandomCommand implements SlashCommand {
    name = "random"
    description = "Play the queue randomly."
    aliases = ["rnd"]
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await this.random(obj.interaction);
    }

    async run(message: NorthMessage) {
        await this.random(message);
    }

    async random(message: Message | Interaction) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        serverQueue.random = !serverQueue.random;
        try {
            await updateQueue(message.guild.id, serverQueue);
            if (serverQueue.random) await msgOrRes(message, "The queue will be played randomly.");
            else await msgOrRes(message, "The queue will be played in order.");
        } catch (err) {
            await await msgOrRes(message, "There was an error trying to update the status!");
        }
    }
}

const cmd = new RandomCommand();
export default cmd;