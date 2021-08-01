import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { wait } from "../../function";
const attachment = new Discord.MessageAttachment("https://cdn.discordapp.com/attachments/763034826931699730/871224206325596161/Sike.mp4", "sike.mp4");

class SikeCommand implements SlashCommand {
    name = "sike"
    description = "Sends you a video that you will find interesting."
    category = 3
    async execute(obj: { interaction: Interaction }) {
        await obj.interaction.reply("https://cdn.discordapp.com/attachments/763034826931699730/871224206325596161/Sike.mp4");
        await wait(10000);
        await obj.interaction.followUp.send("In case you didn't notice, please take a look at the duration of the video.");
    }

    async run(message: NorthMessage) {
        await message.channel.send(attachment);
        await wait(10000);
        await message.channel.send("In case you didn't notice, please take a look at the duration of the video.");
    }
}

const cmd = new SikeCommand();
export default cmd;