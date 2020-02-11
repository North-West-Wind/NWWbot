module.exports = {
	name: 'unrole',
    description: 'Remove role from someone',
    args: true,
    usage: '<user> <role to remove>',
	execute(message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
		var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if(isNaN(parseInt(roleID))) {
      var role = message.guild.roles.find(x => x.name === `${args[1]}`);
    } else {
      var role = message.guild.roles.get(roleID);
    }
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = message.mentions.members.first();

		// or the person who made the command: let member = message.member;


		// Remove a role!
    if(member.roles.get(role.id)) {
        member.roles.remove(role).then(role => console.log(`Removed role ${role.name} from ${taggedUser.username}.`)).catch(console.error);
        const taggedUser = message.mentions.users.first();
    
        message.channel.send(`Removed role **${role.name}** from **${taggedUser.tag}**.`);
    } else {
      return message.reply("that user doesn't have the role " + role + "!");
    }
	},
};