import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";

import { findUser } from "../../function.js";

const GREETINGS = [
  "Hello there, <user>!",
  "How's your day, <user>?",
  "Hello! <user>!",
  "<user>! Hi!",
  "Nice to meet you, <user>.",
  "How are things, <user>?",
  "Howdy! <user>!"
];

class GreetCommand implements FullCommand {
  name = 'greet'
  description = 'Greet somebody.'
  usage = "<user>"
  category = 3
  args = 1
  options = [{
    name: "user",
    description: "The user to greet.",
    required: true,
    type: "USER"
  }];

  async execute(interaction: NorthInteraction) {
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    const user = interaction.options.getUser("user");
    interaction.reply(chosen.replace(/\<user\>/, `${user}`));
  }

  async run(message: NorthMessage, args: string[]) {
    var taggedUser = message.author;
    if (args[0]) try { taggedUser = await findUser(args[0]); } catch (err) { }
    if (!taggedUser) return;
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    await message.channel.send(chosen.replace(/\<user\>/, `<@${taggedUser.id}>`));
  }
};

const cmd = new GreetCommand();
export default cmd;