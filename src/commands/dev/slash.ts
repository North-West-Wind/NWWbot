import { NorthClient, NorthInteraction, NorthMessage, FullCommand, ISlash } from "../../classes/NorthClient.js";
import { msgOrRes } from "../../function.js";

class DevSlashCommand implements FullCommand {
    name = "slash";
    description = "N0rthWestW1nd's Slash Command Manager.";
    usage = "<subcommand>";
    aliases = ["scm"];
    category = 9;
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
        },
        {
            name: "delete",
            description: "Delete all Slash Commands.",
            type: "SUB_COMMAND"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const sub = interaction.options.getSubcommand();
        if (sub === "register") return await this.register(interaction);
        if (sub === "refresh") return await this.refresh(interaction);
        if (sub === "delete") return await this.delete(interaction);
    }
    
    async run(message: NorthMessage, args: string[]) {
        if (args[0] === "register") return await this.register(message);
        if (args[0] === "refresh") return await this.refresh(message);
        if (args[0] === "delete") return await this.delete(message);
    }
    
    async register(message: NorthMessage | NorthInteraction) {
        const msg = await msgOrRes(message, `Registering Slash Commands...`);
        const client = message.client;
        for (const command of NorthClient.storage.commands.values()) {
            if (command.category === 5 || (command.category < 0 && client.id === 0) || !(typeof command["execute"] === "function")) continue;
            try {
                const options = {
                    name: command.name,
                    description: command.description,
                    options: (<ISlash> <unknown> command).options
                };
                await client.application.commands.create(options);
                console.log("Registered", command.name);
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
            try {
                const cmd = NorthClient.storage.commands.get(command.name);
                if (!cmd || (cmd.category < 0 && client.id === 0) || !(typeof cmd["execute"] === "function")) {
                    await client.application.commands.delete(command.id);
                    continue;
                }
                const options = {
                    name: cmd.name,
                    description: cmd.description,
                    options: (<ISlash> <unknown> cmd).options
                };
                await client.application.commands.edit(command.id, options);
            } catch (err: any) {
                console.log("Failed to refresh slash command " + command.name);
                console.error(err);
            }
        }
        await msg.edit(`Refreshed all Slash Commands.`);
    }

    async delete(message: NorthMessage | NorthInteraction) {
        const msg = await msgOrRes(message, `Deleting Slash Commands...`);
        const client = message.client;
        const commands = await client.application.commands.fetch();
        for (const command of commands.values()) {
            try {
                await client.application.commands.delete(command.id);
            } catch (err: any) {
                console.log("Failed to delete slash command " + command.name);
                console.error(err);
            }
        }
        await msg.edit(`Deleted all Slash Commands.`);
    }
}

const cmd = new DevSlashCommand();
export default cmd;