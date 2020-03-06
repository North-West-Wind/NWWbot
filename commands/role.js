const { findMember } = require("../function.js")

module.exports = {
	name: 'role',
    description: 'Give someone a role',
    args: true,
    usage: '<user> <role>',
	async execute(message, args) {
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
      var role = await message.guild.roles.cache.find(x => x.name === `${args[1]}`);
    } else {
      var role = await message.guild.roles.fetch(roleID);
    }
    
    if(!role) return message.channel.send("No role was found!")
    
		// Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):
		let member = await findMember(message, args[0]);
    if(!member) return;
const taggedUser = member.user;
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