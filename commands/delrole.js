module.exports = {
	name: 'delrole',
    description: 'Delete a role.',
    args: true,
    usage: '<role name>',
	execute(message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		message.guild.roles.find(role => role.name === `${args[0]}`).delete()
            .then(role => console.log(`Deleted role ${role.name}`))
            .catch(console.error);
            message.channel.send(`Deleted role ${args[0]}.`);
	},
};