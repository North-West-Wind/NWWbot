
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as functions from "../../function";
import * as Discord from "discord.js";

class DebugCommand implements SlashCommand {
    name = "debug"
    description = "Developer debugging command."
    category = 10
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