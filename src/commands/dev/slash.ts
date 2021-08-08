import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";

class DevSlashCommand implements SlashCommand {
    name = "slash";
    description = "N0rthWestW1nd's Slash Command Manager.";
    usage = "<subcommand>";
    aliases = ["scm"];
    category = 10;
    args = 1;
    subcommands = ["register"];
    subdesc = ["Register all Slash Commands."];
    options = [
        {
            name: "register",
            description: "Register all Slash Commands.",
            type: "SUB_COMMAND"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply();
        if (sub === "register") return await this.register(interaction);
    }
    
    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "register") return await this.register(message);
    }
    
    async register(message: NorthMessage | NorthInteraction) {
        const client = message.client;
        for (const command of NorthClient.storage.commands.values()) {
            await client.application?.commands.create({
                name: command.name,
                description: command.description,
                options: command.options
            });
        }
        await msgOrRes(message, "Registered all Slash Commands.", true);
    }
}