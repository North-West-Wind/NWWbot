
import { Guild, GuildMember } from "discord.js";
import { Pool, RowDataPacket } from "mysql2/promise";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class WarnCommand implements SlashCommand {
  name = "warn"
  description = "Warn a member of the server. 3 warnings will lead to a ban."
  args = 1
  usage = "<user | user ID> [reason]"
  category = 1
  permissions = { guild: { user: 4, me: 4 } }
  options = [
      {
          name: "user",
          description: "The user to warn.",
          required: true,
          type: "USER"
      },
      {
          name: "reason",
          description: "The reason of warning.",
          required: false,
          type: "STRING"
      }
  ]
  
  async execute(interaction: NorthInteraction) {
    const author = interaction.member;
    const guild = interaction.guild;
    const member = <GuildMember> interaction.options.getMember("user");
    const reason = interaction.options.getString("reason");
    const warnEmbeds = commonModerationEmbed(guild, interaction.user, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(guild, member, interaction.client.pool, reason);
      member.user.send({embeds: [warnEmbeds[0]]}).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(guild, interaction.user, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.user.send({embeds: [banEmbeds[0]]}).catch(() => { });
        await interaction.client.pool.query(`DELETE FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
      }
      await interaction.reply({embeds: [warnEmbeds[1]]});
    } catch (err) {
      await interaction.reply({embeds: [warnEmbeds[2]]});
    }
  }

  async run(message: NorthMessage, args: string[]) {
    const member = await findMember(message, args[0]);
    if (!member) return;
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const warnEmbeds = commonModerationEmbed(message.guild, message.author, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(message.guild, member, message.pool, reason);
      member.user.send({embeds: [warnEmbeds[0]]}).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.user.send({embeds: [banEmbeds[0]]}).catch(() => { });
        await message.pool.query(`DELETE FROM warn WHERE guild = '${message.guild.id}' AND user = '${member.id}'`);
      }
      await message.channel.send({embeds: [warnEmbeds[1]]});
    } catch (err) {
      await message.channel.send({embeds: [warnEmbeds[2]]});
    }
  }

  async warn(guild: Guild, member: GuildMember, pool: Pool, reason: string) {
    const con = pool.getConnection();
    await pool.query(`INSERT INTO warn VALUES (NULL, '${guild.id}', '${member.id}', '${escape(reason)}')`);
    const [results] = <RowDataPacket[][]> await pool.query(`SELECT * FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
    return results.length;
  }
}

const cmd = new WarnCommand();
export default cmd;