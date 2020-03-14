module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	args: true,
  aliases: ['f5'],
	execute(message, args, pool, musicCommandsArray) {
    if (message.author.id !== '416227242264363008') return;
    
    args.forEach(arg => {
      var commandName = arg.toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));


		if (!command) {
			return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
		}
    
    commandName = command.name;

    if(musicCommandsArray.includes(commandName) == true) {
      delete require.cache[require.resolve(`../musics/${commandName}.js`)];
      try {
			const newCommand = require(`../musics/${commandName}.js`);
			message.client.commands.set(newCommand.name, newCommand);
		} catch (error) {
			console.log(error);
			return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
		}
    } else {
      delete require.cache[require.resolve(`./${commandName}.js`)];
      try {
			const newCommand = require(`./${commandName}.js`);
			message.client.commands.set(newCommand.name, newCommand);
		} catch (error) {
			console.log(error);
			return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
		}
    }
		

		
		message.channel.send(`Command \`${commandName}\` was reloaded!`);
    })
		
	},
};