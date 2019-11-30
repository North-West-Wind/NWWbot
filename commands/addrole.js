module.exports = {
	name: 'addrole',
    description: 'Create a new role.',
    args: true,
    usage: '<role name>',
	execute(message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) { 
      message.reply(`you don\'t have the permission to use this command.`)
      return;
    }
		message.guild.createRole({
            name: `${args[0]}`,
          })
            .then(role => console.log(`Created new role with name ${role.name}`))
            .catch(console.error);
            message.channel.send(`Created role ${args[0]}.`);
	},
};