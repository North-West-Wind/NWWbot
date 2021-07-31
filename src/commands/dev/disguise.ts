import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";

class DisguiseCommand implements SlashCommand {
    name = "disguise"
    description = "disguise"
    aliases = ["say"]
    category = 10

    execute(obj: { interaction: Interaction }) {
        obj.interaction.reply("This command doesn't work in slash.");
    }

    run(message: NorthMessage, args: string[]) {
        if (message.author.id == process.env.DC) {
            message.delete();
            message.channel.send(args.join(" "))
        }
    }
}

const cmd = new DisguiseCommand();
export default cmd;