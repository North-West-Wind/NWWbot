
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

class RestartCommand implements FullCommand {
    name = "restart"
    description = "Restart the bot"
    aliases = ["re"]
    category = 9

    async execute(interaction: NorthInteraction) {
        await interaction.reply("Restarted.");
        process.exit(-1);
    }

    async run(message: NorthMessage) {
        await message.channel.send("Restarted.");
        process.exit(-1);
    }
}

const cmd = new RestartCommand();
export default cmd;