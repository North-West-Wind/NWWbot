const Discord = require('discord.js');
const client = new Discord.Client();

module.exports = {
	name: 'announce',
	description: 'Let the bot announce something for you in a specific channel.',
  aliases: ['ann'],
  usage: "<channel | channel ID> <announcement>",
	async execute(message, args) {
   if(!args[0]) {
     return message.channel.send("Please tell me the channel to announce." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
   }
    if(!args[1]) {
      return message.channel.send("Please provide the message to announce." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    
    var channel = await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if(!channel || channel == undefined || channel == null) return message.channel.send("The channel is not valid!");
    
    var clientPermission = channel.permissionsFor(message.guild.me);
    var userPermission = channel.permissionsFor(message.member);
    if(!clientPermission.has("SEND_MESSAGES")) return message.channel.send("I don't have the permission to send message in this channel!")
    if(!userPermission.has("SEND_MESSAGES")) return message.channel.send("You don't have the permission to make me send message in this channel.")
    
    channel.send(args.slice(1).join(" "));
    message.channel.send("Announcement made.");
    
}
  }
