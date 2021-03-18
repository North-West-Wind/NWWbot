const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { findUser } = require("../../function.js");
const GREETINGS = [
  "Hello there, <user>!",
  "How's your day, <user>?",
  "Hello! <user>!",
  "<user>! Hi!",
  "Nice to meet you, <user>.",
  "How are things, <user>?",
  "Howdy! <user>!"
];

module.exports = {
  name: 'greet',
  description: 'Greet somebody.',
  usage: "<user | user ID>",
  category: 3,
  args: 1,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to greet.")
  ]),
  async slash(client, interaction, args) {
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    var user;
    if (args[0]?.value) user = await client.users.fetch(args[0].value);
    else user = await client.users.fetch(interaction.user?.id || interaction.member?.user?.id);
    return InteractionResponse.sendMessage(chosen.replace(/\<user\>/, `<@${user.id}>`));
  },
  async execute(message, args) {
    var taggedUser = message.author;
    if (args[0]) taggedUser = await findUser(message, args[0]);
    if (!taggedUser) return;
    const chosen = GREETINGS[Math.floor(GREETINGS.length * Math.random())];
    await message.channel.send(chosen.replace(/\<user\>/, `<@${taggedUser.id}>`));
  },
};