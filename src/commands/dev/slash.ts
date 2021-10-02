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
        const registered = cachedSnowflakeCommand.size ? cachedSnowflakeCommand : (await client.application.commands.fetch()).mapValues(appcmd => appcmd.name);
        cachedSnowflakeCommand.clear();
        for (const command of NorthClient.storage.commands.values()) {
            try {
                const options = {
                    name: command.name,
                    description: command.description,
                    options: command.options
                };
                var key: Snowflake;
                if (key = registered.findKey(appcmd => appcmd === command.name)) await client.application.commands.edit(key, options);
                else key = (await client.application?.commands.create(options)).id;
                cachedSnowflakeCommand.set(key, command.name);
            } catch (err: any) {
                console.log("Failed to create slash command " + command.name);
                console.error(err);
            }
        }
        await msgOrRes(message, "Registered all Slash Commands.");
    }
}

const cmd = new DevSlashCommand();
export default cmd;