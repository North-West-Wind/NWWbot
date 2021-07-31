import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, commonModerationEmbed, findMember } from "../../function";

class DeafenCommand implements SlashCommand {
  name = "deafen"
  description = "Deafen a member while the member is in a voice channel."
  usage = "<user | user ID> [reason]"
  aliases = ["deaf"]
  category = 1
  args = 1
  permissions = 8388608
  options = [
      {
          name: "user",
          description: "The user to deafen.",
          required: true,
          type: 6
      },
      {
          name: "reason",
          description: "The reason of deafening.",
          required: false,
          type: 3
      }
  ]
  
  async execute(obj: { interaction: Interaction, args: any[] }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
    const guild = obj.interaction.guild;
    const author = obj.interaction.member;
    if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
    const member = await guild.members.fetch(obj.args[0].value);
    if (!member) return await obj.interaction.reply("Cannot find the user.");
    var reason;
    if (obj.args[1]?.value) reason = obj.args[1].value;
    const embeds = commonModerationEmbed(guild, author, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send(embeds[0]).catch(() => { });
      return await obj.interaction.reply(embeds[1]);
    } catch (error) {
      return await obj.interaction.reply(embeds[2]);
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (!message.guild) return message.channel.send("This command only works on server.");
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    const member = await findMember(message, args[0]);

    if (!member) return;
    await message.delete();
    var reason;
    if (args[1]) reason = args.slice(1).join(" ");
    const embeds = commonModerationEmbed(message.guild, message.author, member, "deafen", "deafened", reason);
    try {
      if (reason) await member.voice.setDeaf(true, reason)
      else await member.voice.setDeaf(true);
      member.user.send(embeds[0]).catch(() => { });
      await message.channel.send(embeds[1]);
    } catch (error) {
      await message.channel.send(embeds[2]);
    }
  }
}

const cmd = new DeafenCommand();
export default cmd;