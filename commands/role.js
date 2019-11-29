module.exports = {
	name: 'role',
    description: 'Give someone a role',
    args: true,
    usage: '<user> <role>',
	execute(message, args) {
		let role = message.guild.roles.find(`name`, `${args[1]}`);
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = message.mentions.members.first();

		// or the person who made the command: let member = message.member;

		// Add the role!
		member.addRole(role).catch(console.error);

		// Remove a role!
        member.removeRole(role).catch(console.error);
        const taggedUser = message.mentions.users.first();
    
        message.channel.send(`Gave ${taggedUser} the role ${role}`);
	},
};