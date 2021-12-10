import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";

class AllowCommand implements SlashCommand {
    name = "allow"
    description = "Allows a user or role to alter the queue."
    aliases = ["al"]
    usage = "<user | role>"
    category = 8;

    async execute(interaction: NorthInteraction) {
        await interaction.reply("This feature requires [TradeW1nd](https://top.gg/bot/895321877109690419)!")
    }

    async run(message: NorthMessage) {
        await message.channel.send("This feature requires TradeW1nd!\nhttps://top.gg/bot/895321877109690419");
    }
}

const cmd = new AllowCommand();
export default cmd;