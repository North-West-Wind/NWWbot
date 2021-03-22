const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const { findUser } = require("../../function.js")

module.exports = {
  name: "spam",
  description: "Spam a user with the message provided.",
  aliases: ["sp"],
  args: 3,
  usage: "<user | user ID> <amount> <message>",
  category: 4,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to spam.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "amount", "The number of time to spam the user.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "message", "The message to send.").setRequired(true)
  ]),
  async slash(client, interaction, args) {
    const { author, guild } = await InteractionResponse.createFakeMessage(client, interaction);
    const taggedUser = await client.users.fetch(args[0].value);
    if (taggedUser.id === author.id) return InteractionResponse.sendMessage("Don't try to spam youself.");
    const time = parseInt(args[1].value);
    if (time > 120) return InteractionResponse.sendMessage("Please don't spam more than 120 times. That would be annoying.")
    const msg = args[2].value;
    var i = 0;
    var spam = setInterval(function () {
      if (i == time) return clearInterval(spam);
      if (taggedUser.id === process.env.DC) await author.send("Admin power forbids this >:)").catch(() => i = time);
      else await taggedUser.send(`\`[${guild.name} : ${author.tag}]\` ${msg}`).catch(err => {
        if (author.id !== process.env.DC) author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
      });
      i++;
    }, 1000);
    return InteractionResponse.ackknowledge();
  },
  async execute(message, args) {
    const taggedUser = await findUser(message, args[0]);
    if (!taggedUser) return;
    if (taggedUser.id === message.author.id) return message.channel.send("Don't try to spam youself.");

    const time = parseInt(args[1]);
    if (isNaN(time)) {
      return message.channel.send("The time you want to spam this user is not a number.")
    }
    if (time > 120) return message.channel.send("Please don't spam more than 120 times. That would be annoying.")

    const msg = args.slice(2).join(" ");
    message.delete().catch(() => { });
    var i = 0;
    var spam = setInterval(function () {
      if (i == time) return clearInterval(spam);
      if (taggedUser.id === process.env.DC) await message.author.send("Admin power forbids this >:)").catch(() => i = time);
      else await taggedUser.send(`\`[${message.guild.name} : ${message.author.tag}]\` ${msg}`).catch(err => {
        if (message.author.id !== process.env.DC) message.author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
      });
      i++;
    }, 1000);
  }
}