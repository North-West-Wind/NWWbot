module.exports = {
	name: 'thx',
	description: 'Thanks the bot.',
	usage: " ",
	category: 3,
	execute(message) {
		message.channel.send(`You're welcome, ${message.author}`);
	},
};