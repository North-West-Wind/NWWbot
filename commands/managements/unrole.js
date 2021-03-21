const { NorthClient } = require("../../classes/NorthClient.js");
const { InteractionResponse, ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType } = require("../../classes/Slash.js");
const { findMember, wait } = require("../../function.js");

module.exports = {
  name: 'unrole',
  description: 'Remove a role from the mentioned user or the user ID in the message.',
  args: 2,
  usage: '<user | userID> <role | role ID | role name>',
  category: 0,
  permissions: 268435456,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.USER.valueOf(), "user", "The user to be removed from the role.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.ROLE.valueOf(), "role", "The role to remove.").setRequired(true)
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(args[0].value);
    const role = await guild.roles.fetch(args[1].value);
    try {
      await member.roles.remove(role);
      return InteractionResponse.sendMessage(`Successfully removed **${member.user.tag}** from **${role.name}**.`);
    } catch (err) {
      return InteractionResponse.sendMessage(`Failed to remove **${member.user.tag}** from **${role.name}**. (Error: **${err.message}**)`);
    }
  },
  async execute(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));

    var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === args[1].toLowerCase());
      if (!role) return await message.channel.send("No role was found with the name " + args[1]);
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (!role) return await message.channel.send("No role was found!");
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
        await message.channel.send(`Successfully removed **${taggedUser.tag}** from **${role.name}**.`);
      } catch (err) {
        await message.channel.send(`Failed to remove **${taggedUser.tag}** from **${role.name}**. (Error: **${err.message}**)`);
      }
    }
  },
};