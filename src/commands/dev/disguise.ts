
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";

class DisguiseCommand implements SlashCommand {
    name = "disguise"
    description = "disguise"
    aliases = ["say"]
    category = 9

    async execute(interaction: NorthInteraction) {
        await interaction.reply("This command doesn't work in slash.");
    }

    async run(message: NorthMessage, args: string[]) {
        await message.delete();
        await message.channel.send(args.join(" "));
    }
}

const cmd = new DisguiseCommand();
export default cmd;