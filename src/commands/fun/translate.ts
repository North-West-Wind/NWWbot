import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import config from "../../../config.json";
import { msgOrRes, shuffleArray } from "../../function.js";
import translate from "translate-google";
const langs = config.languages;

class TranslateCommand implements SlashCommand {
    name = "translate";
    description = "Poorly translates some text.";
    category = 3;
    usage = "<text>";

    options = [{
        name: "text",
        description: "The text to mess with.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        await this.repeat(interaction, interaction.options.getString("text"));
    }

    async run(message: NorthMessage, args: string[]) {
        const msg = await message.channel.send("Translating! (Iterating through 25 languages!)")
        await this.repeat(message, args.join(" "));
        await msg.delete();
    }

    async repeat(message: NorthMessage | NorthInteraction, text: string) {
        const langCopy = shuffleArray(langs);
        for (let i = 0; i < 25; i++) text = await translate(text, { to: langCopy[i] });
        await msgOrRes(message, await translate(text, { to: "en" }));
    }
}

const cmd = new TranslateCommand();
export default cmd;