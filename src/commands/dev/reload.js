const { NorthClient } = require("../../classes/NorthClient.js");
const sCategories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "InDev", "Dev"];

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	args: 1,
	aliases: ['f5'],
	category: 10,
	execute(message, args) {
		args.forEach(arg => {
			var commandName = arg.toLowerCase();
			const command = NorthClient.storage.commands.get(commandName)
				|| NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));


			if (!command) {
				const item = NorthClient.storage.items.get(commandName);

				if (!item)
					return message.channel.send(`There is no command/item with name or alias \`${commandName}\`, ${message.author}!`);

				commandName = item.name;
				delete require.cache[require.resolve(`../../items/${commandName}.js`)];
				try {
					const newCommand = require(`../../items/${commandName}.js`);
					NorthClient.storage.items.set(newCommand.name.toLowerCase(), newCommand);
				} catch (error) {
					NorthClient.storage.log(error);
					return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
				}
				return message.channel.send(`Item \`${commandName}\` was reloaded!`);
			}

			commandName = command.name;
			const category = sCategories[command.category];
			delete require.cache[require.resolve(`../${category}/${commandName}.js`)];
			try {
				const newCommand = require(`../${category}/${commandName}.js`);
				NorthClient.storage.commands.set(newCommand.name, newCommand);
			} catch (error) {
				NorthClient.storage.log(error);
				return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
			}
			message.channel.send(`Command \`${commandName}\` was reloaded!`);
		})

	},
};