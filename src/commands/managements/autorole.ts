
import { Role } from "discord.js";
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { findMember, findMemberWithGuild } from "../../function.js";

class AutoRoleCommand implements FullCommand {
  name = "massrole"
  description = 'Assigns a single role to multiple users at once.'
  usage = "<role> <user>"
  category = 0
  args = 2
  permissions = { guild: { user: 268435456, me: 268435456 } };
  options = [
    {
      name: "role",
      description: "The name of the role.",
      required: true,
      type: "ROLE"
    },
    {
      name: "users",
      description: "The users that will get the role.",
      required: true,
      type: "STRING"
    }
  ];
  async execute(interaction: NorthInteraction) {
    const role = <Role> interaction.options.getRole("role");
    await interaction.reply("Adding members to role...");

    interaction.options.getString("users").split(/ +/).forEach(async mentioned => {
      try {
        const user = await findMemberWithGuild(interaction.guild, mentioned);
        if (!user) return await interaction.channel.send("Cannot find the user " + mentioned);
        await user.roles.add(role);
        await interaction.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch (err: any) {
        await interaction.channel.send("Failed adding **" + mentioned + "** to role **" + role.name + "**.")
      }
    });
  }

  async run(message: NorthMessage, args: string[]) {
    const roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    var role = undefined;
    if (isNaN(parseInt(roleID))) role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === `${args[0].toLowerCase()}`);
    else role = await message.guild.roles.cache.get(roleID);
    if (!role) return message.channel.send("No role was found!");

    args.slice(1).forEach(async mentioned => {
      try {
        const user = await findMemberWithGuild(message.guild, mentioned);
        if (!user) return await message.channel.send("Cannot find the user " + mentioned);
        await user.roles.add(role);
        await message.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch (err: any) {
        await message.channel.send("Failed adding **" + mentioned + "** to role **" + role.name + "**.")
      }
    });
  }
};

const cmd = new AutoRoleCommand();
export default cmd;