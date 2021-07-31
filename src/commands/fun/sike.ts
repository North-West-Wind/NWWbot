import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { wait } from "../../function";
const attachment = new Discord.MessageAttachment("https://drive.google.com/uc?export=download&id=1FB3uTqJXt8r_WQrU8UU4_g1WbUm6S6xT", "sike.mp4");

class SikeCommand implements SlashCommand {
    name = "sike"
    description = "Sends you a video that you will find interesting."
    category = 3
    async execute(obj: { interaction: Interaction }) {
        await obj.interaction.reply(attachment);
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