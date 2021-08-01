import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";

class DisguiseCommand implements SlashCommand {
    name = "disguise"
    description = "disguise"
    aliases = ["say"]
    category = 10

    async execute(obj: { interaction: Interaction }) {
        await obj.interaction.reply("This command doesn't work in slash.");
    }

    async run(message: NorthMessage, args: string[]) {
        if (message.author.id == process.env.DC) {
            await message.delete();
            await message.channel.send(args.join(" "))
        }
    }
}

const cmd = new DisguiseCommand();
export default cmd;