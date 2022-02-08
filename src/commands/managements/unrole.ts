
import { GuildMember, Role } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { findMember, wait } from "../../function.js";

class UnRoleCommand implements SlashCommand {
  name = 'unrole'
  description = 'Removes a role from a user.'
  args = 2
  usage = '<user> <role>'
  category = 0
  permissions = { guild: { user: 268435456, me: 268435456 } }
  options = [
      {
          name: "user",
          description: "The user to be removed from the role.",
          required: true,
          type: "USER"
      },
      {
          name: "role",
          description: "The role to remove.",
          required: true,
          type: "ROLE"
      }
  ];
  
  async execute(interaction: NorthInteraction) {
    const member = <GuildMember> interaction.options.getMember("user");
    const role = <Role> interaction.options.getRole("role");
    try {
      await member.roles.remove(role);
      return await interaction.reply(`Successfully removed **${member.user.tag}** from **${role.name}**.`);
    } catch (err: any) {
      return await interaction.reply(`Failed to remove **${member.user.tag}** from **${role.name}**. (Error: **${err.message}**)`);
    }
  }

  async run(message: NorthMessage, args: string[]) {
    var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === args[1].toLowerCase());
      if (!role) return await message.channel.send("No role was found with the name " + args[1]);
    } else {
      var role = await message.guild.roles.fetch(roleID);
      if (!role) return await message.channel.send("No role was found!");
    }
    if (!role) return await message.channel.send("The role is not valid!");
    if (args[0] === "@everyone") {
      await message.channel.send("Warning: Large servers might take a while!");
      const allMembers = await message.guild.members.fetch();
      for (const member of allMembers.values()) try {
        await member.roles.remove(role);
        console.log(`Removed role ${role.name} from member ${member.displayName}`);
        await wait(200);
      } catch (err: any) {
        await message.channel.send(`Failed to remove role **${role.name}** from **${member.user.tag}**. (Error: **${err.message}**)`);
      }
      await message.channel.send(`Finished removing everyone's role **${role.name}**.`);
    } else {
      const member = await findMember(message, args[0]);
      if (!member) return;
      const taggedUser = member.user;
      try {
        await member.roles.remove(role);
        await message.channel.send(`Successfully removed **${taggedUser.tag}** from **${role.name}**.`);
      } catch (err: any) {
        await message.channel.send(`Failed to remove **${taggedUser.tag}** from **${role.name}**. (Error: **${err.message}**)`);
      }
    }
  }
};

const cmd = new UnRoleCommand();
export default cmd;