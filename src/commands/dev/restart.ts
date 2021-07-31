import { Interaction } from "slashcord/dist/Index";
import { SlashCommand } from "../../classes/NorthClient";

class RestartCommand implements SlashCommand {
    name = "restart"
    description = "Restart the bot"
    aliases = ["re"]
    category = 10

    async execute(obj: { interaction: Interaction }) {
        if (obj.interaction.member.id != process.env.DC) return await obj.interaction.reply("You can't use this!");
        await obj.interaction.reply("Restarted.");
        process.exit(0);
    }

    async run(message) {
        if (message.author.id != process.env.DC) return;
        await message.channel.send("Restarted.");
        process.exit(0);
    }
};

const cmd = new RestartCommand();
export default cmd;