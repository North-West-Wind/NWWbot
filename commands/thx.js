module.exports = {
	name: 'thx',
	description: 'Thanks the bot.',
	execute(message) {
		message.channel.send(`You're welcome, ${message.author}`);
	},
};