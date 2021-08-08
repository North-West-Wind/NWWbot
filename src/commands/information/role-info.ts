import { PermissionResolvable, Role } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { color } from "../../function";

class RoleInfoCommand implements SlashCommand {
  name = "role-info"
  description = "Display information of a role."
  aliases = ["ri"]
  usage = "<role | role ID | role name>"
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
    const role = <Role> interaction.options.getRole("role");
    await interaction.reply({embeds: [this.createRoleEmbed(role, interaction.client)]});
  }

  async run(message: NorthMessage, args: string[]) {
    var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID)) || args.length > 1) {
      var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === args.join(" ").toLowerCase());
      if (!role) return message.channel.send("No role was found with the name " + args.join(" "));
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (!role) return message.channel.send("No role was found!");
    }
    const Embed = this.createRoleEmbed(role, message.client);
    message.channel.send({embeds: [Embed]});
  }

  createRoleEmbed(role: Role, client: NorthClient) {
      const guild = role.guild;
    const userMember = role.members;
    const userMemberCount = [];
    const botMemberCount = [];
    for(const user of userMember.values()) {
      if(user.user.bot === false) userMemberCount.push(user.id);
      if(user.user.bot) botMemberCount.push(user.id);
    }
    const memberCount = role.members.size;
    var permissions = [];
    var flags = ["VIEW_AUDIT_LOG", "MANAGE_GUILD", "MANAGE_ROLES", "MANAGE_CHANNELS", "KICK_MEMBERS", "BAN_MEMBERS", "CREATE_INSTANT_INVITE", "CHANGE_NICKNAME", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS", "VIEW_CHANNEL", "SEND_TTS_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "SEND_MESSAGES", "MANAGE_MESSAGES", "ATTACH_FILES", "MENTION_EVERYONE", "ADD_REACTIONS", "CONNECT", "MUTE_MEMBERS", "MOVE_MEMBERS", "SPEAK", "DEAFEN_MEMBERS", "USE_VAD", "PRIORITY_SPEAKER", "STREAM"]
    
    for(const flag of flags) if(role.permissions.has(<PermissionResolvable> flag)) permissions.push(flag);
    if(role.permissions.has("ADMINISTRATOR")) permissions = ["ADMINISTRATOR"];
    
    const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("Information of " + role.name)
    .setDescription("In server **" + guild.name + "**")
    .addField("ID", role.id, true)
    .addField("Name", role.name, true)
    .addField("Member Count", `Members: \`${memberCount}\`\nUsers: \`${userMemberCount.length}\`\nBots: \`${botMemberCount.length}\``, true)
    .addField("Hoist? (Separated)", role.hoist ? "Yes" : "No", true)
    .addField("Position", role.position.toString(), true)
    .addField("Color", (!role.hexColor.startsWith("#") ? "#" : "") + role.hexColor.toUpperCase(), true)
    .addField("Permissions", "`" + (permissions.length > 0 ? permissions.join("`, `").replace(/_/g, " ") : "N/A") + "`")
    .setTimestamp()
    .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    return Embed;
  }
}

const cmd = new RoleInfoCommand();
export default cmd;