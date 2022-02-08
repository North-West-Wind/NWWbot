
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { getRandomNumber } from "../../function.js";

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
            type: "NUMBER"
        },
        {
            name: "max",
            description: "The maximum of the random number.",
            required: true,
            type: "NUMBER"
        },
        {
            name: "count",
            description: "How many numbers to generate.",
            required: false,
            type: "INTEGER"
        },
        {
            name: "decimal",
            description: "The maximum decimal place.",
            required: false,
            type: "INTEGER"
        }
    ];

    async execute(interaction: NorthInteraction) {
        const count = interaction.options.getInteger("count") || 1;
        const decimal = interaction.options.getInteger("decimal") || -1;
        const min = interaction.options.getNumber("min");
        const max = interaction.options.getNumber("max");
        let msg = "";
        for (let i = 0; i < count; i++) {
            var number = decimal < 0 ? getRandomNumber(min, max) : Math.round((getRandomNumber(min, max) + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
            msg += number + "\n";
        }
        await interaction.reply(msg);
    }
    async run(message: NorthMessage, args: string[]) {
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