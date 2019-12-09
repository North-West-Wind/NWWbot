var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
	name: 'greet',
	description: 'Tag a member and greet them (but not really).',
	execute(message) {
		if (!message.mentions.users.size) {
            return message.channel.send('Who am I greeting?');
        }

        // grab the "first" mentioned user from the message
        // this will return a `User` object, just like `message.author`
        const taggedUser = message.mentions.users.first();
    const Discord = require('discord.js');
    const Embed = new Discord.RichEmbed()
      .setColor(color)
      .setTitle("Hi there!")
    .setDescription(taggedUser.username)
      .setTimestamp()
      .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");
    message.channel.send(Embed);
	},
};