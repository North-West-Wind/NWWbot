const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	args: 1,
	aliases: ['f5'],
	category: 10,
	execute(message, args) {
		if (message.author.id != process.env.DC) return;

		args.forEach(arg => {
			var commandName = arg.toLowerCase();
			const command = NorthClient.storage.commands.get(commandName)
				|| NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));


			if (!command) {
				const item = NorthClient.storage.items.get(commandName);

				if (!item)
					return message.channel.send(`There is no command/item with name or alias \`${commandName}\`, ${message.author}!`);

				commandName = item.name;
				delete require.cache[require.resolve(`../items/${commandName}.js`)];
				try {
					const newCommand = require(`../items/${commandName}.js`);
					NorthClient.storage.items.set(newCommand.name.toLowerCase(), newCommand);
				} catch (error) {
					NorthClient.storage.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
				return message.channel.send(`Item \`${commandName}\` was reloaded!`);
			}

			commandName = command.name;

			if (command.category === 8) {
				delete require.cache[require.resolve(`../musics/${commandName}.js`)];
				try {
					const newCommand = require(`../musics/${commandName}.js`);
					NorthClient.storage.commands.set(newCommand.name, newCommand);
				} catch (error) {
					NorthClient.storage.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
			} else {
				delete require.cache[require.resolve(`./${commandName}.js`)];
				try {
					const newCommand = require(`./${commandName}.js`);
					NorthClient.storage.commands.set(newCommand.name, newCommand);
				} catch (error) {
					NorthClient.storage.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
			}
			message.channel.send(`Command \`${commandName}\` was reloaded!`);
		})

	},
};