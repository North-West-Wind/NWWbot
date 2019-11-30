module.exports = {
	name: 'unrole',
    description: 'Remove role from someone',
    args: true,
    usage: '<user> <role to remove>',
	execute(message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		let role = message.guild.roles.find(`name`, `${args[1]}`);
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = message.mentions.members.first();

		// or the person who made the command: let member = message.member;


		// Remove a role!
        member.removeRole(role).then(role => console.log(`Removed role ${role} from ${taggedUser}.`)).catch(console.error);
        const taggedUser = message.mentions.users.first();
    
        message.channel.send(`Removed role ${role} from ${taggedUser}.`);
	},
};