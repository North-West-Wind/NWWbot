module.exports = {
	name: 'role',
    description: 'Give someone a role',
    args: true,
    usage: '<user> <role>',
	execute(message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!args[0]) {
      return message.channel.send("Please mention at least 1 user.")
    }
    if(!args[1]) {
      return message.channel.send("Please enter the role you want the users to be.")
    }
    
		var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if(isNaN(parseInt(roleID))) {
      var role = message.guild.roles.find(x => x.name === `${args[1]}`);
    } else {
      var role = message.guild.roles.get(roleID);
    }
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = message.mentions.members.first();
const taggedUser = message.mentions.users.first();
		// or the person who made the command: let member = message.member;

		// Add the role!
		member.roles.add(role).then(() => {
      console.log(`Gave ${taggedUser.username} the role ${role.name}`);
      message.channel.send(`Successfully added **${taggedUser.tag}** to role **${role.name}**.`);
      
    }).catch(err => {
      message.channel.send(`Failed adding **${taggedUser.tag}** to role **${role.name}**.`);
    });

        
    
        
	},
};