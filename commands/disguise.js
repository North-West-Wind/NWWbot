const Discord = require('discord.js');

const client = new Discord.Client();

module.exports = {
	name: 'disguise',
	description: 'Disguise as the bot.',
  aliases: ['dis'],
	execute(message, args) {
    if (message.author.id !== '416227242264363008') return;
    message.delete(0);
    message.channel.send(args.slice(0).join(" "));
    
}
  }
