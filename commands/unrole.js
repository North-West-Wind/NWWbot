const { NorthClient } = require("../classes/NorthClient.js");
const { findMember, wait } = require("../function.js");

module.exports = {
  name: 'unrole',
  description: 'Remove a role from the mentioned user or the user ID in the message.',
  args: 2,
  usage: '<user | userID> <role | role ID | role name>',
  category: 0,
  async execute(message, args) {
    if (!message.member.permissions.has(268435456)) {
      message.channel.send(`You don\'t have the permission to use this command.`)
      return;
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
    if (!role) return await message.channel.send("The role is not valid!");
    if (args[0] === "@everyone") {
      await message.channel.send("Warning: Large servers might take a while!");
      const allMembers = await message.guild.members.fetch();
      for (const member of allMembers.values()) try {
        await member.roles.remove(role);
        NorthClient.storage.log(`Removed role ${role.name} from member ${member.displayName}`);
        await wait(200);
      } catch (err) {
        await message.channel.send(`Failed to remove role **${role.name}** from **${taggedUser.tag}**. (Error: **${err.message}**)`);
      }
      await message.channel.send(`Finished removing everyone's role **${role.name}**.`);
    } else {
      const member = await findMember(message, args[0]);
      if (!member) return;
      const taggedUser = member.user;
      try {
        await member.roles.remove(role);
        await message.channel.send(`Successfully removed **${role.name}** from **${taggedUser.tag}**.`);
      } catch (err) {
        await message.channel.send(`Failed to remove role **${role.name}** from **${taggedUser.tag}**. (Error: **${err.message}**)`);
      }
    }
  },
};