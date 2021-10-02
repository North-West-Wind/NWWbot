
import { GuildMember } from "discord.js";
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { findMember } from "../../function";

class NicknameCommand implements SlashCommand {
  name = "nickname"
  description = "Sets a user's nickname on the server."
  usage = "<user | user ID> <nickname>"
  aliases = ["nick"]
  category = 0
  args = 2
  permissions = { guild: { user: 134217728, me: 134217728 } }
  options = [
      {
          name: "user",
          description: "The user to change nickname.",
          required: true,
          type: "USER"
      },
      {
          name: "nickname",
          description: "The new nickname of the user.",
          required: true,
          type: "STRING"
      }
  ];

  async execute(interaction: NorthInteraction) {
    const member = <GuildMember> interaction.options.getMember("user");
    try {
      await member.setNickname(interaction.options.getString("nickname"));
    } catch(err) {
      console.error(err);
      return await interaction.reply("Failed to set nickname!");
    }
    await interaction.reply(`Set **${member.user.tag}**'s nickname to **${interaction.options.getString("nickname")}**`);
  }

  async run(message: NorthMessage, args: string[]) {
		const member = await findMember(message, args[0]);
    if(!member) return;
    try {
      await member.setNickname(args.slice(1).join(" "));
    } catch(err) {
      console.error(err);
      return message.channel.send("Failed to set nickname!");
    }
    await message.channel.send(`Set **${member.user.tag}**'s nickname to **${args.slice(1).join(" ")}**`);
  }
}

const cmd = new NicknameCommand();
export default cmd;