module.exports = {
	name: 'addrole',
    description: 'Create a new role.',
    args: true,
    usage: '<name>',
	execute(message, args) {
		message.guild.createRole({
            name: `${args[0]}`,
          })
            .then(role => console.log(`Created new role with name ${role.name}`))
            .catch(console.error);
            message.channel.send(`Created role ${args[0]}.`);
	},
};