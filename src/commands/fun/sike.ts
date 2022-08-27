
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { wait } from "../../function.js";

class SikeCommand implements FullCommand {
    name = "sike"
    description = "Sends you a video that you will find interesting."
    category = 3
    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        const attachment = new Discord.AttachmentBuilder("https://drive.google.com/uc?export=download&id=1FB3uTqJXt8r_WQrU8UU4_g1WbUm6S6xT").setName("sike.mp4");
        await interaction.editReply({files: [attachment]});
        await wait(10000);
        await interaction.followUp("In case you didn't notice, please take a look at the duration of the video.");
    }

    async run(message: NorthMessage) {
        const attachment = new Discord.AttachmentBuilder("https://drive.google.com/uc?export=download&id=1FB3uTqJXt8r_WQrU8UU4_g1WbUm6S6xT").setName("sike.mp4");
        await message.channel.send({files: [attachment]});
        await wait(10000);
        await message.channel.send("In case you didn't notice, please take a look at the duration of the video.");
    }
}

const cmd = new SikeCommand();
export default cmd;