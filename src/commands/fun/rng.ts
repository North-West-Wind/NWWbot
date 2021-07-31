import { Interaction } from "slashcord/dist/Index";
import { SlashCommand } from "../../classes/NorthClient";
import { getRandomNumber } from "../../function";

class RNGCommand implements SlashCommand {
    name = "rng"
    description = "Random number generator. Generate a random number between range."
    usage = "<min> <max> [count] [decimal place]"
    aliases = ["randomnumber", "randomnumbergenerator"]
    category = 3
    args = 2
    options = [
        {
            name: "min",
            description: "The minimum of the random number.",
            required: true,
            type: 3
        },
        {
            name: "max",
            description: "The maximum of the random number.",
            required: true,
            type: 3
        },
        {
            name: "count",
            description: "How many numbers to generate.",
            required: true,
            type: 4
        },
        {
            name: "decimal",
            description: "The maximum decimal place.",
            required: true,
            type: 4
        }
    ];

    async execute(obj: { interaction: Interaction, args: any[] }) {
        let count = 1;
        let decimal = -1;
        const min = Number(obj.args[0].value);
        const max = Number(obj.args[1].value);
        if (isNaN(min)) return await obj.interaction.reply("The minimum must be a number!");
        if (isNaN(max)) return await obj.interaction.reply("The maximum must be a number!");
        if (obj.args[2]?.value && !isNaN(Number(obj.args[2].value))) count = parseInt(obj.args[2].value);
        if (obj.args[3]?.value !== undefined && !isNaN(parseInt(obj.args[3].value))) decimal = parseInt(obj.args[3].value);
        let msg = "";
        for (let i = 0; i < count; i++) {
            var number = decimal < 0 ? getRandomNumber(min, max) : Math.round((getRandomNumber(Number(obj.args[0]), Number(obj.args[1])) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
            if (decimal >= 0) number = Math.round((number + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
            msg += number + "\n";
        }
        await obj.interaction.reply(msg);
    }
    async run(message, args) {
        let count = 1;
        let decimal = -1;
        const min = Number(args[0]);
        const max = Number(args[1]);
        if (isNaN(min) || isNaN(max)) return message.channel.send("Discovered non-number objects!");

        if (args[2] && !isNaN(Number(args[2]))) count = parseInt(args[2]);
        if (args[3] !== undefined && !isNaN(parseInt(args[3]))) decimal = parseInt(args[3]);
        let msg = "";
        for (let i = 0; i < count; i++) {
            var number = decimal < 0 ? getRandomNumber(min, max) : Math.round((getRandomNumber(Number(args[0]), Number(args[1])) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
            if (decimal >= 0) number = Math.round((number + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
            msg += number + "\n";
        }
        await message.channel.send(msg);
    }
}

const cmd = new RNGCommand();
export default cmd;