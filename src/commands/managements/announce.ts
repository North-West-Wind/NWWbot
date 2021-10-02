import { GuildMember, TextChannel } from "discord.js";

import { NorthInteraction, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg } from "../../function";

class AnnounceCommand implements SlashCommand {
  name = 'announce'
  description = 'Lets the bot announce something for you in a specific channel.'
  aliases = ['ann']
  usage = "<channel | channel ID> <announcement>"
  args = 2
  category = 0
  options = [
      {
          name: "channel",
          description: "The channel to announce in.",
          required: true,
          type: "CHANNEL"
      },
      {
          name: "announcement",
          description: "The message to be announced.",
          required: true,
          type: "STRING"
      }
  ];
  
  async execute(interaction: NorthInteraction) {
    const member = <GuildMember> interaction.member;
    const channel = <TextChannel> interaction.options.getChannel("channel");
    if (!channel) return await interaction.reply("The channel is not valid!");
    if (!channel.permissionsFor(interaction.guild.me).has(BigInt(2048))) return await interaction.reply(genPermMsg(2048, 1));
    if (!channel.permissionsFor(member).has(BigInt(2048))) return await interaction.reply(genPermMsg(2048, 0));
    await channel.send(interaction.options.getString("announcement"));
    await interaction.reply("Announcement made.");
  }

  async run(message, args) {
    var channel = await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if (!channel || channel == undefined || channel == null) return await message.channel.send("The channel is not valid!");
    if (!channel.permissionsFor(message.guild.me).has(BigInt(2048))) return await message.channel.send(genPermMsg(2048, 1));
    if (!channel.permissionsFor(message.member).has(BigInt(2048))) return await message.channel.send(genPermMsg(2048, 0));
    await channel.send(args.slice(1).join(" "));
    await message.channel.send("Announcement made.");
  }
}

const cmd = new AnnounceCommand();
export default cmd;