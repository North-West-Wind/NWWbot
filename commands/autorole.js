const { genPermMsg, findMember } = require("../function");

module.exports = {
  name: "autorole",
  description: 'This has nothing to do with the auto-role when a user joins the server. The command is very similar to the “?role” command, but it can assign a single role to multiple users at once.',
  args: true,
  usage: "<role | role ID | role name> <user | user ID>",
  category: 0,
  args: 2,
  permission: 268435456,
  async execute(message, args) {
    if (!message.member.permissions.has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    if (!message.guild.me.permissions.has(268435456)) return await message.channel.send(genPermMsg(this.permission, 1));
    const roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    var role = undefined;
    if (isNaN(parseInt(roleID))) role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === `${args[0].toLowerCase()}`);
    else role = await message.guild.roles.cache.get(roleID);
    if (!role) return message.channel.send("No role was found!");

    args.slice(1).forEach(async mentioned => {
      const user = await findMember(message, mentioned);
      if (!user) return;
      try {
        await user.roles.add(role);
        await message.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch (err) {
        await message.channel.send("Failed adding **" + user.user.tag + "** to role **" + role.name + "**.")
      }
    });
  }
};
