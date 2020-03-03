module.exports = {
  name: "disguise",
  description: "disguise",
  aliases: ["dis"],
  execute(message, args) {
    if(message.author.id === "416227242264363008") {
      message.delete();
      message.channel.send(args.join(" "))
    }
  }
}