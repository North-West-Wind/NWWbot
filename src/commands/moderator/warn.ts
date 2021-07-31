import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class WarnCommand implements SlashCommand {
  name = "warn"
  description = "Warn a member of the server. 3 warnings will lead to a ban."
  args = 1
  usage = "<user | user ID> [reason]"
  category = 1
  permissions = 4
  options = [
      {
          name: "user",
          description: "The user to warn.",
          required: true,
          type: 6
      },
      {
          name: "reason",
          description: "The reason of warning.",
          required: false,
          type: 3
      }
  ]
  
  async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
    const author = obj.interaction.member;
    const guild = obj.interaction.guild;
    if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(obj.args[0].value);
    var reason;
    if (obj.args[1]?.value) reason = obj.args[1].value;
    const warnEmbeds = commonModerationEmbed(guild, author.user, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(guild, member, obj.client.pool, reason);
      member.user.send(warnEmbeds[0]).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(guild, author.user, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.user.send(banEmbeds[0]).catch(() => { });
        await obj.client.pool.query(`DELETE FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
      }
      await obj.interaction.reply(warnEmbeds[1]);
    } catch (err) {
      await obj.interaction.reply(warnEmbeds[2]);
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (!message.member.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(4)) return message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0]);
    if (!member) return;
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const warnEmbeds = commonModerationEmbed(message.guild, message.author, member, "warn", "warned", reason);
    try {
      const amount = await this.warn(message.guild, member, message.pool, reason);
      member.user.send(warnEmbeds[0]).catch(() => { });
      if (amount >= 3) {
        const banEmbeds = commonModerationEmbed(message.guild, message.author, member, "ban", "banned", "Received 3 warnings.");
        await member.ban({ reason: "Received 3 warnings." });
        member.user.send(banEmbeds[0]).catch(() => { });
        await message.pool.query(`DELETE FROM warn WHERE guild = '${message.guild.id}' AND user = '${member.id}'`);
      }
      await message.channel.send(warnEmbeds[1]);
    } catch (err) {
      await message.channel.send(warnEmbeds[2]);
    }
  }

  async warn(guild, member, pool, reason) {
    await pool.query(`INSERT INTO warn VALUES (NULL, '${guild.id}', '${member.id}', '${escape(reason)}')`);
    const [results] = await pool.query(`SELECT * FROM warn WHERE guild = '${guild.id}' AND user = '${member.id}'`);
    return results.length;
  }
}

const cmd = new WarnCommand();
export default cmd;