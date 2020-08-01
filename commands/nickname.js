const Discord = require("discord.js");
const { findMember } = require("../function.js");

module.exports = {
  name: "nickname",
  description: "Set user's nickname in server.",
  usage: "<user | user ID> <nickname>",
  aliases: ["nick"],
  async execute(message, args) {
    if (!message.member.permissions.has('MANAGE_NICKNAMES')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!message.guild.me.permissions.has('MANAGE_NICKNAMES')) {
      message.channel.send(`I don\'t have the permission to change their nickname.`)
      return;
    }
    if(!args[0]) return message.channel.send("Please mention an user." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    if(!args[1]) return message.channel.send("Please enter the nickname." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    
		let member = await findMember(message, args[0]);
    
    if(!member) return;
    try {
      await member.setNickname(args.slice(1).join(" "));
    } catch(err) {
      console.error(err);
      return message.channel.send("Failed to set nickname!");
    }
    message.channel.send(`Set **${member.user.tag}**'s nickname to **${args.slice(1).join(" ")}**`);
  }
}