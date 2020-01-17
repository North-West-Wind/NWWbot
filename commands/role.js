module.exports = {
	name: 'role',
    description: 'Give someone a role',
    args: true,
    usage: '<user> <role>',
	execute(message, args) {
    if (!message.member.hasPermission('MANAGE_GUILD')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		let role = message.guild.roles.find(x => x.name === `${args[1]}`);
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = message.mentions.members.first();
const taggedUser = message.mentions.users.first();
		// or the person who made the command: let member = message.member;

		// Add the role!
		member.addRole(role).then(role => console.log(`Gave ${taggedUser} the role ${role}`)).catch(console.error);

        
    
        message.channel.send(`Gave ${taggedUser} the role ${role}`);
	},
};