
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";

class RestartCommand implements SlashCommand {
    name = "restart"
    description = "Restart the bot"
    aliases = ["re"]
    category = 10

    async execute(interaction: NorthInteraction) {
        await interaction.reply("Restarted.");
        process.exit(-1);
    }

    async run(message: NorthMessage) {
        await message.channel.send("Restarted.");
        process.exit(-1);
    }
};

const cmd = new RestartCommand();
export default cmd;