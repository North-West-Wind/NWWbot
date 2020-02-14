module.exports = {
  name: "autorole",
  description: "Automatically give all mentioned users a specific role.",
  args: true,
  usage: "<role | role ID | role name> <user | user ID>",
  execute(message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!message.guild.me.permissions.has('MANAGE_ROLES')) {
      message.channel.send(`I don\'t have the permission to add roles to them.`)
      return;
    }
    if(!args[0]) {
      return message.channel.send("Please enter the role you want the users to be.")
    }
    if(!args[1]) {
      return message.channel.send("Please mention at least 1 user.")
    }
    var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if(isNaN(parseInt(roleID))) {
      var role = message.guild.roles.find(x => x.name === `${args[0]}`);
      if(role === null) {
      return message.channel.send("No role was found with the name " + args[0])
    }
    } else {
      var role = message.guild.roles.get(roleID);
      if(role === null) {
      return message.channel.send("No role was found with the id " + roleID)
    }
    }
    
    
    args.slice(1).forEach(async mentioned => {
      var userID = mentioned.replace(/<@/g, "").replace(/>/g, "").replace(/!/g, "");
      var user = await message.guild.members.get(userID);
      try {
      await user.roles.add(role);
      message.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch(err) {
        message.channel.send("Failed adding **" + user.user.tag + "** to role **" + role.name + "**.")
      }
    })
    
  }
};
