import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";

class ArgsCommand implements SlashCommand {
  name = "args"
  description = "Check args of messages."
  category = 10
  args = 1
  options = [{
    name: "arguments",
    description: "The texts to log.",
    required: true,
    type: 3
  }]

  async execute(obj: { interaction: Interaction, args: any[] }) {
    NorthClient.storage.log(obj.args);
    await obj.interaction.reply("Done");
  }

  async run(message: NorthMessage) {
    NorthClient.storage.log(message.content);
  }
}

const cmd = new ArgsCommand();
export default cmd;