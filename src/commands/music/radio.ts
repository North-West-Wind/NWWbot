import { CommandInteraction, Message } from "discord.js";
import { SlashCommand } from "../../classes/NorthClient.js";

class RadioCommand implements SlashCommand {
    name = "radio";
    description = "Play music in a channel 24/7! (Requires TradeW1nd)";
    usage = "<subcommand>";
    subcommands = ["tune", "off", "add"];
    subdesc = ["Connects to one of the radio channels.", "Disconnects from a radio channel and the voice channel.", "Adds a soundtrack to the radio channel queue."]
    subusage = ["<subcommand> <channel>", null, "<subcommand> <track>"];
    category = 8;

    async execute(interaction: CommandInteraction) {
        await interaction.reply("This feature requires [TradeW1nd](https://top.gg/bot/895321877109690419)!")
    }

    async run(message: Message) {
        await message.channel.send("This feature requires TradeW1nd!\nhttps://top.gg/bot/895321877109690419");
    }
}

const cmd = new RadioCommand();
export default cmd;