import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { sCategories } from "../information/help.js";
import { __dirname, msgOrRes } from "../../function.js";

class ReloadCommand implements FullCommand {
    name = "reload";
    description = "Reload command(s).";
    usage = "<command>";
    aliases = ["rl"];
    category = 9;
    args = 1;

    options = [
        {
            name: "command",
            description: "The command(s) to reload.",
            type: "STRING",
            required: true
        }
    ];

    async execute(interaction: NorthInteraction) {
        const commands = interaction.options.getString("command").split(/ +/);
        await interaction.deferReply();
        await this.reload(interaction, commands);
    }

    async run(message: NorthMessage, args: string[]) {
        await this.reload(message, args);
    }

    async reload(message: NorthMessage | NorthInteraction, commands: string[]) {
        for (const command of commands) {
            const cmd = NorthClient.storage.commands.get(command);
            if (!cmd?.category === undefined) continue;
            const path = `${__dirname}/../${sCategories[cmd.category].toLowerCase()}.js`;
            delete require.cache[require.resolve(path)];
            const comd = <FullCommand> (await import(path)).default;
            if (comd.name) NorthClient.storage.commands.set(comd.name, comd);
        }
        await msgOrRes(message, `Reloaded \`${commands.join("`, `")}\``);
    }
}

const cmd = new ReloadCommand();
export default cmd;