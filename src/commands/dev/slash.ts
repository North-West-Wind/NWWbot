import Collection from "@discordjs/collection";
import { Snowflake } from "discord-api-types";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { msgOrRes } from "../../function";

const cachedSnowflakeCommand = new Collection<Snowflake, string>();

class DevSlashCommand implements SlashCommand {
    name = "slash";
    description = "N0rthWestW1nd's Slash Command Manager.";
    usage = "<subcommand>";
    aliases = ["scm"];
    category = 10;
    args = 1;
    subcommands = ["register", "refresh"];
    subdesc = ["Register all Slash Commands.", "Refresh all Slash Commands."];
    options = [
        {
            name: "register",
            description: "Register all Slash Commands.",
            type: "SUB_COMMAND"
        },
        {
            name: "refresh",
            description: "Refresh all Slash Commands.",
            type: "SUB_COMMAND"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "register") return await this.register(interaction);
    }
    
    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "register") return await this.register(message);
    }
    
    async register(message: NorthMessage | NorthInteraction) {
        const msg = await msgOrRes(message, `Registering Slash Commands...`);
        const client = message.client;
        for (const command of NorthClient.storage.commands.values()) {
            try {
                const options = {
                    name: command.name,
                    description: command.description,
                    options: command.options
                };
                await client.application?.commands.create(options);
            } catch (err: any) {
                console.log("Failed to create slash command " + command.name);
                console.error(err);
            }
        }
        await msg.edit(`Registered all Slash Commands.`);
    }

    async refresh(message: NorthMessage | NorthInteraction) {
        const msg = await msgOrRes(message, `Refreshing Slash Commands...`);
        const client = message.client;
        const commands = await client.application.commands.fetch();
        for (const command of commands.values()) {
            const cmd = NorthClient.storage.commands.get(command.name);
            try {
                const options = {
                    name: cmd.name,
                    description: cmd.description,
                    options: cmd.options
                };
                await client.application?.commands.edit(command.id, options);
            } catch (err: any) {
                console.log("Failed to create slash command " + command.name);
                console.error(err);
            }
        }
        await msg.edit(`Refreshed all Slash Commands.`);
    }
}

const cmd = new DevSlashCommand();
export default cmd;