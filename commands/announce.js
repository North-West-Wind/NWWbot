const Discord = require('discord.js');

module.exports = {
	name: 'announce',
	description: 'Let the bot announce something for you in a specific channel.',
  aliases: ['ann'],
  usage: "<channel | channel ID> <announcement>",
  args: 2,
  category: 0,
	async execute(message, args) {
    var channel = await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if(!channel || channel == undefined || channel == null) return message.channel.send("The channel is not valid!");
    
    var clientPermission = channel.permissionsFor(message.guild.me);
    var userPermission = channel.permissionsFor(message.member);
    if(!clientPermission.has(2048)) return message.channel.send("I don't have the permission to send message in this channel!")
    if(!userPermission.has(2048)) return message.channel.send("You don't have the permission to make me send message in this channel.")
    
    channel.send(args.slice(1).join(" "));
    message.channel.send("Announcement made.");
    
}
  }
