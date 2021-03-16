const cleverbot = require("cleverbot-free");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash");
const log = new Map();

module.exports = {
  name: "chat",
  description: "Chat with the bot. Note that the bot has no memory about what had been said before so don’t try to do Q&A with it.",
  usage: "<message>",
  category: 3,
  args: 1,
  slashInit: true,
  register: () => new ApplicationCommand(module.exports.name, module.exports.description).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "message", "The message to tell the bot.")
  ]),
  slash: async () => {
    var past = log.get(message.author.id);
    if (!past || Date.now() - past.lastChat > 1800000) {
      log.set(message.author.id, {
        lastChat: Date.now(),
        messages: []
      });
      past = log.get(message.author.id);
    }
    const response = await cleverbot(args.join(" "), past.messages);
    past.messages.push(args.join(" "));
    past.messages.push(response);
    log.set(message.author.id, past);
    return InteractionResponse.sendMessage(response);
  },
  async execute(message, args) {
    var past = log.get(message.author.id);
    if (!past || Date.now() - past.lastChat > 1800000) {
      log.set(message.author.id, {
        lastChat: Date.now(),
        messages: []
      });
      past = log.get(message.author.id);
    }
    const response = await cleverbot(args.join(" "), past.messages);
    past.messages.push(args.join(" "));
    past.messages.push(response);
    log.set(message.author.id, past);
    await message.channel.send(response);
  }
}