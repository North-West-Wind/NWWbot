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
			const command = console.commands.get(commandName)
				|| console.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));


			if (!command) {
				const item = console.items.get(commandName);

				if (!item)
					return message.channel.send(`There is no command/item with name or alias \`${commandName}\`, ${message.author}!`);

				commandName = item.name;
				delete require.cache[require.resolve(`../items/${commandName}.js`)];
				try {
					const newCommand = require(`../items/${commandName}.js`);
					console.items.set(newCommand.name.toLowerCase(), newCommand);
				} catch (error) {
					console.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
				return message.channel.send(`Item \`${commandName}\` was reloaded!`);
			}

			commandName = command.name;

			if (command.category === 8) {
				delete require.cache[require.resolve(`../musics/${commandName}.js`)];
				try {
					const newCommand = require(`../musics/${commandName}.js`);
					console.commands.set(newCommand.name, newCommand);
				} catch (error) {
					console.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
			} else {
				delete require.cache[require.resolve(`./${commandName}.js`)];
				try {
					const newCommand = require(`./${commandName}.js`);
					console.commands.set(newCommand.name, newCommand);
				} catch (error) {
					console.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
			}
			message.channel.send(`Command \`${commandName}\` was reloaded!`);
		})

	},
};