const { Set } = require("discord-set");
const set = new Set();

module.exports = {
  name: "chat",
  description: "Chat with the bot. Note that the bot has no memory about what had been said before so don’t try to do Q&A with it.",
  usage: "<message>",
  execute(message, args) {
    if(!args[0]) {
      return message.channel.send("What are we gonna talk about?")
    }
    set.chat(args.join(" ")).then(reply => {
            return message.channel.send(reply);
        });
  }
}