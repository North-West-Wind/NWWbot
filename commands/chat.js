const { Set } = require("discord-set");
const set = new Set();

module.exports = {
  name: "chat",
  description: "Chat with me when you are bored.",
  execute(message, args) {
    if(!args[0]) {
      return message.channel.send("What are we gonna talk about?")
    }
    set.chat(args.join(" ")).then(reply => {
            return message.channel.send(reply);
        });
  }
}