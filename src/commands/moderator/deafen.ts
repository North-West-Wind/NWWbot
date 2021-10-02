
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { commonModerationEmbed, findMember } from "../../function";

class DeafenCommand implements SlashCommand {
  name = "deafen"
  description = "Deafen a member while the member is in a voice channel."
  usage = "<user | user ID> [reason]"
  aliases = ["deaf"]
  category = 1
  args = 1
  permissions = { guild: { user: 8388608, me: 8388608 } }
  options = [
      {
          name: "user",
          description: "The user to deafen.",
          required: true,
          type: "USER"
      },
      {
          name: "reason",
          description: "The reason of deafening.",
          required: false,
          type: "STRING"
      }
  ]
  
  async execute(interaction: NorthInteraction) {
    const guild = interaction.guild;
    const member = <GuildMember> interaction.options.getMember("user");
    if (!member) return await interaction.reply("Cannot find the user.");
    const reason = interaction.options.getString("reason");
    const embeds = commonModerationEmbed(guild, interaction.user, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send({embeds: [embeds[0]]}).catch(() => { });
      return await interaction.reply({embeds: [embeds[1]]});
    } catch (error: any) {
      return await interaction.reply({embeds: [embeds[2]]});
    }
  }

  async run(message: NorthMessage, args: string[]) {
    const member = await findMember(message, args[0]);

    if (!member) return;
    await message.delete();
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const embeds = commonModerationEmbed(message.guild, message.author, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send({embeds: [embeds[0]]}).catch(() => { });
      await message.channel.send({embeds: [embeds[1]]});
    } catch (error: any) {
      await message.channel.send({embeds: [embeds[2]]});
    }
  }
}

const cmd = new DeafenCommand();
export default cmd;