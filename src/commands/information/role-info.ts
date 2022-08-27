import { PermissionResolvable, Role } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color } from "../../function.js";

class RoleInfoCommand implements FullCommand {
  name = "role-info"
  description = "Displays information of a role."
  aliases = ["ri"]
  usage = "<role>"
  category = 6
  args = 1
  options = [{
    name: "role",
    description: "The role's information to display.",
    required: true,
    type: "ROLE"
  }];

  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command only works on server.");
    const role = <Role>interaction.options.getRole("role");
    await interaction.reply({ embeds: [this.createRoleEmbed(role, interaction.client)] });
  }

  async run(message: NorthMessage, args: string[]) {
    const roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID)) || args.length > 1) {
      var role = message.guild.roles.cache.find(x => x.name.toLowerCase() === args.join(" ").toLowerCase());
      if (!role) return message.channel.send("No role was found with the name " + args.join(" "));
    } else {
      var role = await message.guild.roles.fetch(roleID);
      if (!role) return message.channel.send("No role was found!");
    }
    const Embed = this.createRoleEmbed(role, message.client);
    message.channel.send({ embeds: [Embed] });
  }

  createRoleEmbed(role: Role, client: NorthClient) {
    const guild = role.guild;
    const userMember = role.members;
    const userMemberCount = [];
    const botMemberCount = [];
    for (const user of userMember.values()) {
      if (user.user.bot === false) userMemberCount.push(user.id);
      if (user.user.bot) botMemberCount.push(user.id);
    }
    const memberCount = role.members.size;
    let permissions = [];
    for (const flag of Object.keys(Discord.PermissionsBitField.Flags)) if (role.permissions.has(<PermissionResolvable>flag)) permissions.push(flag);
    if (role.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) permissions = ["ADMINISTRATOR"];

    const Embed = new Discord.EmbedBuilder()
      .setColor(color())
      .setTitle("Information of " + role.name)
      .setDescription("In server **" + guild.name + "**")
      .addFields([
        { name: "ID", value: role.id, inline: true },
        { name: "Name", value: role.name, inline: true },
        { name: "Member Count", value: `Members: \`${memberCount}\`\nUsers: \`${userMemberCount.length}\`\nBots: \`${botMemberCount.length}\``, inline: true },
        { name: "Hoist? (Separated)", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Position", value: role.position.toString(), inline: true },
        { name: "Color", value: (!role.hexColor.startsWith("#") ? "#" : "") + role.hexColor.toUpperCase(), inline: true },
        { name: "PermissionsBitField", value: "`" + (permissions.length > 0 ? permissions.join("`, `").replace(/_/g, " ") : "N/A") + "`" }
      ])
      .setTimestamp()
      .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
    return Embed;
  }
}

const cmd = new RoleInfoCommand();
export default cmd;