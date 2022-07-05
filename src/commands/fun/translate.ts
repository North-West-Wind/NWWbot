import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { msgOrRes, shuffleArray } from "../../function.js";
import translate from "@vitalets/google-translate-api";
const langs = ["af", "sq", "ar", "hy", "az", "eu", "be", "bn", "bs", "bg", "ca", "ceb", "ny", "zh-cn", "zh-tw", "co", "hr", "cs", "da", "nl", "en", "eo", "et", "tl", "fi", "fr", "fy", "gl", "ka", "de", "el", "gu", "ht", "ha", "haw", "iw", "hi", "hmn", "hu", "is", "ig", "id", "ga", "it", "ja", "jw", "kn", "kk", "km", "ko", "ku", "ky", "lo", "la", "lv", "lt", "lb", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mn", "my", "ne", "no", "ps", "fa", "pl", "pt", "ma", "ro", "ru", "sm", "gd", "sr", "st", "sn", "sd", "si", "sk", "sl", "so", "es", "su", "sw", "sv", "tg", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi", "cy", "xh", "yi", "yo", "zu"];

class TranslateCommand implements FullCommand {
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
        for (let i = 0; i < 25; i++) text = (await translate(text, { to: langCopy[i] })).text;
        await msgOrRes(message, (await translate(text, { to: "en" })).text);
    }
}

const cmd = new TranslateCommand();
export default cmd;