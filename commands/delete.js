const Discord = require("discord.js")

module.exports = {
	name: 'delete',
	description: 'Delete specific amount of messages.',
  aliases: ['del'],
  args: true,
  usage: '<amount of messages>',
	execute(message, args) {
    
     if (message.channel instanceof Discord.DMChannel) {
       return message.channel.send("This command doesn't work for direct messages.")
     }
       
    if (!message.member.hasPermission('MANAGE_MESSAGES')) {
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		const amount = parseInt(args[0]) + 1;

		if (isNaN(amount)) {
			return message.channel.send('Sike, that\'s the wrong number!');
		}

		message.channel.bulkDelete(amount, true).catch(err => {
			console.error(err);
			message.channel.send('I can\'t delete them. Try a smaller amount.');
		});
	},
};