import { GuildMember, TextChannel } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg, wait } from "../../function";

class DeleteCommand implements SlashCommand {
  name = "delete"
  description = "Delete a specific amount of message in a channel. Sadly, this command does not work for DMs."
  aliases = ["del"]
  usage = "[channel] <amount | subcommand | start> [end]"
  subcommands = ["all"]
  subdesc = ["Deletes everything in the channel."]
  subusage = ["[channel] <subcommand>"]
  category = 0
  args = 1
  permissions = { guild: { user: 8192, me: 8192 }, channel: { me: 8192 } }
  options = [
    {
        name: "amount",
        description: "The amount of messages to delete.",
        required: true,
        type: "INTEGER"
    },
    {
        name: "channel",
        description: "The channel of the messages.",
        required: false,
        type: "CHANNEL"
    },
    {
        name: "all",
        description: "Whether or not to delete all messages in the channel.",
        required: false,
        type: "BOOLEAN"
    }
];

  async execute(interaction: NorthInteraction) {
    if (!interaction.guild) return await interaction.reply("This command only works on server.");
    await interaction.deferReply();
    const author = <GuildMember> interaction.member;
    var amount = interaction.options.getInteger("amount");
    const channel = <TextChannel> (interaction.options.getChannel("channel") || interaction.channel);
    if (interaction.options.getBoolean("all")) {
      if (!author.permissions.has(BigInt(16))) return await interaction.reply(genPermMsg(16, 0));
      if (!interaction.guild.me.permissions.has(BigInt(16))) return await interaction.reply(genPermMsg(16, 1));
      const name = channel.name;
      const type = channel.type;
      const topic = channel.topic;
      const nsfw = channel.nsfw;
      const parent = channel.parent;
      const permissionOverwrites = channel.permissionOverwrites.cache;
      const position = channel.position;
      const rateLimitPerUser = channel.rateLimitPerUser;

      await channel.delete();
      await interaction.guild.channels.create(name, { type, topic, nsfw, parent, permissionOverwrites, position, rateLimitPerUser });
      
      await author.user.send("Deleted all message in the channel **" + channel.name + "** of the server **" + interaction.guild.name + "**.");
      return await interaction.editReply(`Deleted all messages in <#${channel.id}>.`);
    } else {
      try {
        await interaction.deleteReply();
        await channel.bulkDelete(amount, true);
      } catch (err: any) {
        await interaction.followUp("I can't delete them. Try a smaller amount.");
      }
    }
  }

  async run(message: NorthMessage, args: string[]) {
    if (!message.guild) return await message.channel.send("This command only works on server.");
    if (!args[0]) return await message.channel.send("You didn't provide any amount!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);

    var amount = parseInt(args[0]);
    const channel = <TextChannel> (args[1] ? await message.guild.channels.fetch(args[1].replace(/<#/g, "").replace(/>/g, "")) : message.channel);
    if (isNaN(amount)) {
        if (args[2] == "all") {
          if (!message.member.permissions.has(BigInt(16))) return await message.channel.send(genPermMsg(16, 0));
          if (!message.guild.me.permissions.has(BigInt(16))) return await message.channel.send(genPermMsg(16, 1));
          const name = channel.name;
          const type = channel.type;
          const topic = channel.topic;
          const nsfw = channel.nsfw;
          const parent = channel.parent;
          const permissionOverwrites = channel.permissionOverwrites.cache;
          const position = channel.position;
          const rateLimitPerUser = channel.rateLimitPerUser;

          await message.channel.delete();
          await message.guild.channels.create(name, { type, topic, nsfw, parent, permissionOverwrites, position, rateLimitPerUser });
          await message.author.send(`Deleted all message in the channel **${channel.name}** of the server **${message.guild.name}**.`);
        } else await message.channel.send("The query provided is not a number!");
        return;
    } else {
      try {
        await message.delete();
        await channel.bulkDelete(amount, true);
      } catch (err: any) {
        await message.channel.send("I can't delete them. Try a smaller amount.");
      }
    }
  }
};

const cmd = new DeleteCommand();
export default cmd;