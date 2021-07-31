import { TextChannel } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg } from "../../function";

class AnnounceCommand implements SlashCommand {
  name = 'announce'
  description = 'Let the bot announce something for you in a specific channel.'
  aliases = ['ann']
  usage = "<channel | channel ID> <announcement>"
  args = 2
  category = 0
  permissions = 2048
  options = [
      {
          name: "channel",
          description: "The channel to announce in.",
          required: true,
          type: 7
      },
      {
          name: "announcement",
          description: "The message to be announced.",
          required: true,
          type: 3
      }
  ];
  
  async execute(obj: { interaction: Interaction, client: NorthClient, args: any[] }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command is only available in servers.");
    const member = obj.interaction.member;
    const channel = <TextChannel> await obj.client.channels.fetch(obj.args[0].value);
    if (!channel) return await obj.interaction.reply("The channel is not valid!");
    if (!channel.permissionsFor(obj.interaction.guild.me).has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));
    if (!channel.permissionsFor(member).has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    await channel.send(obj.args[1].value);
    await obj.interaction.reply("Announcement made.");
  }

  async run(message, args) {
    var channel = await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if (!channel || channel == undefined || channel == null) return await message.channel.send("The channel is not valid!");
    if (!channel.permissionsFor(message.guild.me).has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    if (!channel.permissionsFor(message.member).has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    await channel.send(args.slice(1).join(" "));
    await message.channel.send("Announcement made.");
  }
}

const cmd = new AnnounceCommand();
export default cmd;