
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";

class RestartCommand implements SlashCommand {
    name = "restart"
    description = "Restart the bot"
    aliases = ["re"]
    category = 10

    async execute(interaction: NorthInteraction) {
        if (interaction.user.id != process.env.DC) return await interaction.reply("You can't use this!");
        await interaction.reply("Restarted.");
        process.exit(0);
    }

    async run(message: NorthMessage) {
        if (message.author.id != process.env.DC) return;
        await message.channel.send("Restarted.");
        process.exit(0);
    }
};

const cmd = new RestartCommand();
export default cmd;