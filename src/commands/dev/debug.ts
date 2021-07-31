import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
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
        type: 3
    }];

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (obj.interaction.member.id != process.env.DC) return await obj.interaction.reply("You can't use this!");
        const args = obj.args?.map(x => x?.value).filter(x => !!x);
        NorthClient.storage.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "args", "functions", "Discord", args.join(" ")))(obj.interaction, functions, Discord));
    }

    async run(message: NorthMessage, args: string[]) {
        NorthClient.storage.log(await (Object.getPrototypeOf(async function () { }).constructor("message", "functions", "Discord", args.join(" ")))(message, functions, Discord));
    }
}

const cmd = new DebugCommand();
export default cmd;