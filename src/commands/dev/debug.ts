
import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as functions from "../../function.js";
import * as Discord from "discord.js";

class DebugCommand implements FullCommand {
    name = "debug"
    description = "Developer debugging command."
    category = 9
    args = 1
    options = [{
        name: "function",
        description: "The stringified function.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        console.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "functions", "Discord", "storage", interaction.options.getString("function")))(interaction, functions, Discord, NorthClient.storage));
    }

    async run(message: NorthMessage, args: string[]) {
        console.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "functions", "Discord", "storage", args.join(" ")))(message, functions, Discord, NorthClient.storage));
    }
}

const cmd = new DebugCommand();
export default cmd;