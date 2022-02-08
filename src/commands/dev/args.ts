
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";

class ArgsCommand implements SlashCommand {
  name = "args"
  description = "Check args of messages."
  category = 10
  args = 1
  options = [{
    name: "arguments",
    description: "The texts to log.",
    required: true,
    type: "STRING"
  }]

  async execute(interaction: NorthInteraction) {
    console.log(interaction.options.getString("arguments"));
    await interaction.reply("Done");
  }

  async run(message: NorthMessage) {
    console.log(message.content);
  }
}

const cmd = new ArgsCommand();
export default cmd;