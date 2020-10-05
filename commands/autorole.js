const { findMember } = require("../function.js");

module.exports = {
  name: "autorole",
  description: 'This has nothing to do with the auto-role when a user joins the server. The command is very similar to the “?role” command, but it can assign a single role to multiple users at once.',
  args: true,
  usage: "<role | role ID | role name> <user | user ID>",
  category: 0,
  async execute(message, args) {
    if (!message.member.permissions.has(268435456)) { 
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if(!message.guild.me.permissions.has(268435456)) {
      message.channel.send(`I don\'t have the permission to add roles to them.`)
      return;
    }
    if(!args[0]) {
      return message.channel.send("Please enter the role you want the users to be." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    if(!args[1]) {
      return message.channel.send("Please mention at least 1 user." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
     var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(
        x => x.name.toLowerCase() === `${args[0].toLowerCase()}`
      );
      if (role === null) {
        return message.channel.send(
          "No role was found with the name " + args[0]
        );
      }
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (role === null) {
        return message.channel.send("No role was found!");
      }
    }
    
    
    args.slice(1).forEach(async mentioned => {
      var user = await findMember(message, mentioned);
      if(!user) return;
      try {
      await user.roles.add(role);
      message.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch(err) {
        message.channel.send("Failed adding **" + user.user.tag + "** to role **" + role.name + "**.")
      }
    })
    
  }
};
