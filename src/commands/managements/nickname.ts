import { Interaction } from "slashcord/dist/Index";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, findMember } from "../../function";
import args from "../dev/args";

class NicknameCommand implements SlashCommand {
  name = "nickname"
  description = "Set user's nickname on the server."
  usage = "<user | user ID> <nickname>"
  aliases = ["nick"]
  category = 0
  args = 2
  permissions = 134217728
  options = [
      {
          name: "user",
          description: "The user to change nickname.",
          required: true,
          type: 6
      },
      {
          name: "nickname",
          description: "The new nickname of the user.",
          required: true,
          type: 3
      }
  ];

  async execute(obj: { interaction: Interaction, args: any[] }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
    if (!obj.interaction.member.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    if(!obj.interaction.guild.me.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
    const member = await obj.interaction.guild.members.fetch(obj.args[0].value);
    try {
      await member.setNickname(obj.args[1].value);
    } catch(err) {
      NorthClient.storage.error(err);
      return await obj.interaction.reply("Failed to set nickname!");
    }
    return await obj.interaction.reply(`Set **${member.user.tag}**'s nickname to **${args[1].value}**`);
  }

  async run(message, args) {
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if(!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
		const member = await findMember(message, args[0]);
    if(!member) return;
    try {
      await member.setNickname(args.slice(1).join(" "));
    } catch(err) {
      NorthClient.storage.error(err);
      return message.channel.send("Failed to set nickname!");
    }
    await message.channel.send(`Set **${member.user.tag}**'s nickname to **${args.slice(1).join(" ")}**`);
  }
}

const cmd = new NicknameCommand();
export default cmd;