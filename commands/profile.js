  module.exports = {
	name: 'profile',
	description: 'Display profile of yourself.',
	execute(message) {
		message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
	},
};