const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash");

module.exports = {
	name: 'thx',
	description: 'Thanks the bot.',
	category: 3,
	slashInit: true,
	register: () => ApplicationCommand.createBasic(module.exports),
	async slash(client, interaction) {
		const { author } = await InteractionResponse.createFakeMessage(client, interaction);
		return InteractionResponse.sendMessage(`You're welcome, ${message.author}`);
	},
	execute(message) {
		message.channel.send(`You're welcome, ${message.author}`);
	},
};