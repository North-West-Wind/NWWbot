import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { Interaction } from "slashcord/dist/Index";
import { findUser } from "../../function";

const GREETINGS = [
  "Hello there, <user>!",
  "How's your day, <user>?",
  "Hello! <user>!",
  "<user>! Hi!",
  "Nice to meet you, <user>.",
  "How are things, <user>?",
  "Howdy! <user>!"
];

class GreetCommand implements SlashCommand {
  name = 'greet'
  description = 'Greet somebody.'
  usage = "<user | user ID>"
  category = 3
  args = 1
  options = [{
      name: "user",
      description: "The user to greet.",
      required: true,
      type: 6
  }];
  
  async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    const user = obj.args[0]?.value ? (await obj.client.users.fetch(obj.args[0].value)).id : (obj.interaction.member?.id ?? obj.interaction.channelID);
    obj.interaction.reply(chosen.replace(/\<user\>/, `<@${user}>`));
  }

  async run(message, args) {
    var taggedUser = message.author;
    if (args[0]) taggedUser = await findUser(message, args[0]);
    if (!taggedUser) return;
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    await message.channel.send(chosen.replace(/\<user\>/, `<@${taggedUser.id}>`));
  }
};

const cmd = new GreetCommand();
export default cmd;