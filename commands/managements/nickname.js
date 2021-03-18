const { findMember } = require("../../function.js");
const { NorthClient } = require("../../classes/NorthClient.js");

module.exports = {
  name: "nickname",
  description: "Set user's nickname on the server.",
  usage: "<user | user ID> <nickname>",
  aliases: ["nick"],
  category: 0,
  args: 2,
  async execute(message, args) {
    if (!message.member.permissions.has(134217728)) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!message.guild.me.permissions.has(134217728)) {
      message.channel.send(`I don\'t have the permission to change their nickname.`)
      return;
    }
		let member = await findMember(message, args[0]);
    
    if(!member) return;
    try {
      await member.setNickname(args.slice(1).join(" "));
    } catch(err) {
      NorthClient.storage.error(err);
      return message.channel.send("Failed to set nickname!");
    }
    message.channel.send(`Set **${member.user.tag}**'s nickname to **${args.slice(1).join(" ")}**`);
  }
}