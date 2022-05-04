
import { GuildMember, Role } from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { wait, findMember } from "../../function.js";

class RoleCommand implements SlashCommand {
  name = 'role'
  description = 'Gives a role to a user.'
  usage = '<user | user ID> <role | role ID | role name>'
  category = 0
  args = 2
  permissions = { guild: { user: 268435456, me: 268435456 } }
  options = [
      {
          name: "user",
          description: "The user to be added to the role.",
          required: true,
          type: "USER"
      },
      {
          name: "role",
          description: "The role to add.",
          required: true,
          type: "ROLE"
      }
  ];
  
  async execute(interaction: NorthInteraction) {
    const member = <GuildMember> interaction.options.getMember("user");
    const role = <Role> interaction.options.getRole("role");
    try {
      await member.roles.add(role);
      return await interaction.reply(`Successfully added **${member.user.tag}** to role **${role.name}**.`);
    } catch (err: any) {
      return await interaction.reply(`Failed to add **${member.user.tag}** to role **${role.name}**. (Error: **${err.message}**)`);
    }
  }

  async run(message: NorthMessage, args: string[]) {
    var roleID = args[1].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === args[1].toLowerCase());
      if (!role) return message.channel.send("No role was found with the name " + args[1]);
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (!role) return message.channel.send("No role was found!");
    }

    if (!role) return message.channel.send("No role was found!");
    if (args[0] === "@everyone") {
      await message.channel.send("Warning: Large servers might take a while!");
      const allMembers = await message.guild.members.fetch();
      for (const member of allMembers.values()) try {
        await member.roles.add(role);
        await wait(200);
      } catch (err: any) {
        await message.channel.send(`Failed to add **${member.user.tag}** to role **${role.name}**. (Error: **${err.message}**)`);
      }
      await message.channel.send(`Finished adding everyone to the role **${role.name}**.`);
    } else {
      const member = await findMember(message, args[0]);
      if (!member) return;
      const taggedUser = member.user;
      try {
        await member.roles.add(role);
        await message.channel.send(`Successfully added **${taggedUser.tag}** to role **${role.name}**.`);
      } catch (err: any) {
        await message.channel.send(`Failed to add **${taggedUser.tag}** to role **${role.name}**. (Error: **${err.message}**)`);
      }
    }
  }
};

const cmd = new RoleCommand();
export default cmd;