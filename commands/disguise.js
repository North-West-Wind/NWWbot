module.exports = {
  name: "disguise",
  description: "disguise",
  aliases: ["say"],
  execute(message, args) {
    if(message.author.id == process.env.DC) {
      message.delete();
      message.channel.send(args.join(" "))
    }
  }
}