const { findMember } = require("../function.js");

module.exports = {
  name: 'role',
  description: 'Give a role to the mentioned user or the user ID in the message.',
  args: true,
  usage: '<user | user ID> <role | role ID | role name>',
  category: 0,
  async execute(message, args) {
    if (!message.member.permissions.has(268435456)) {
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
    }
    if (!args[0]) {
      return message.channel.send("Please mention at least 1 user." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    if (!args[1]) {
      return message.channel.send("Please enter the role you want the users to be." + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }


    var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(
        x => x.name.toLowerCase() === `${args[1].toLowerCase()}`
      );
      if (role === null) {
        return message.channel.send(
          "No role was found with the name " + args[1]
        );
      }
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (role === null) {
        return message.channel.send("No role was found!");
      }
    }

    if (!role) return message.channel.send("No role was found!")
    let member = await findMember(message, args[0]);
    if (!member) return;
    const taggedUser = member.user;
    member.roles.add(role).then(() => {
      console.log(`Gave ${taggedUser.username} the role ${role.name}`);
      message.channel.send(`Successfully added **${taggedUser.tag}** to role **${role.name}**.`);

    }).catch(err => {
      message.channel.send(`Failed adding **${taggedUser.tag}** to role **${role.name}**.`);
    });




  },
};