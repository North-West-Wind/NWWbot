import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";

class ArgsCommand implements SlashCommand {
  name = "args"
  description = "Check args of messages."
  category = 10
  args = 1

  async execute(obj: { interaction: Interaction }) {
      obj.interaction.reply("Please don't use this in slash.", {});
  }

  async run(message: NorthMessage) {
    NorthClient.storage.log(message.content);
  }
}

const cmd = new ArgsCommand();
export default cmd;