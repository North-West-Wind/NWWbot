import { Interaction } from "slashcord/dist/Index";
import { SlashCommand } from "../../classes/NorthClient";
import { findMember, findMemberWithGuild, genPermMsg } from "../../function";

class AutoRoleCommand implements SlashCommand {
  name = "autorole"
  description = 'This has nothing to do with the auto-role when a user joins the server. The command is very similar to the “?role” command, but it can assign a single role to multiple users at once.'
  usage = "<role | role ID | role name> <user | user ID>"
  category = 0
  args = 2
  permissions = 268435456
  options = [
    {
      name: "role",
      description: "The name of the role.",
      required: true,
      type: 8
    },
    {
      name: "user",
      description: "The users that will get the role.",
      required: true,
      type: 3
    }
  ];
  async execute(obj: { interaction: Interaction, args: any[] }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
    if (!obj.interaction.member.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    if (!obj.interaction.guild.me.permissions.has(268435456)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
    const roleID = obj.args[0].value.replace(/<@&/g, "").replace(/>/g, "");
    var role = undefined;
    if (isNaN(parseInt(roleID))) role = await obj.interaction.guild.roles.cache.find(x => x.name.toLowerCase() === `${obj.args[0].value.toLowerCase()}`);
    else role = await obj.interaction.guild.roles.cache.get(roleID);
    await obj.interaction.reply("Adding members to role...");

    obj.args[1].value.split(/ +/).forEach(async mentioned => {
      const user = await findMemberWithGuild(obj.interaction.guild, mentioned);
      if (!user) return await obj.interaction.reply("Cannot find the user " + mentioned);
      try {
        await user.roles.add(role);
        await obj.interaction.channel.send("Successfully added **" + user.user.tag + "** to role **" + role.name + "**.")
      } catch (err) {
        await obj.interaction.channel.send("Failed adding **" + user.user.tag + "** to role **" + role.name + "**.")
      }
    });
  }

  async run(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(268435456)) return await message.channel.send(genPermMsg(this.permissions, 1));
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

const cmd = new AutoRoleCommand();
export default cmd;