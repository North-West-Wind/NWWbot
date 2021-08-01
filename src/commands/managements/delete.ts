import { TextChannel } from "discord.js";
import { Interaction } from "slashcord/dist/Index";
import { NorthClient, SlashCommand } from "../../classes/NorthClient";
import { genPermMsg } from "../../function";

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
  permissions = 8192
  options = [
    {
        name: "amount",
        description: "The amount of messages to delete.",
        required: true,
        type: 4
    },
    {
        name: "channel",
        description: "The channel of the messages.",
        required: false,
        type: 7
    },
    {
        name: "all",
        description: "Whether or not to delete all messages in the channel.",
        required: false,
        type: 5
    }
];

  async execute(obj: { interaction: Interaction, args: any[], client: NorthClient }) {
    if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
    const author = obj.interaction.member;
    if (!author.permissions.has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 0));
    if (!obj.interaction.guild.me.permissions.has(this.permissions) || !obj.interaction.channel.permissionsFor(obj.interaction.guild.me).has(this.permissions)) return await obj.interaction.reply(genPermMsg(this.permissions, 1));

    var amount = parseInt(obj.args[0].value);
    var channel = obj.interaction.channel;
    if (obj.args[1]?.value) channel = <TextChannel> await obj.client.channels.fetch(obj.args[1].value);
    if (!channel || !(channel instanceof TextChannel)) return await obj.interaction.reply("The channel is not valid!");
    if (obj.args[2]?.value) {
      if (!author.permissions.has(16)) return await obj.interaction.reply(genPermMsg(16, 0));
      if (!obj.interaction.guild.me.permissions.has(16)) return await obj.interaction.reply(genPermMsg(16, 1));
      var name = channel.name;
      var type = channel.type;
      var topic = channel.topic;
      var nsfw = channel.nsfw;
      var parent = channel.parent;
      var permissionOverwrites = channel.permissionOverwrites;
      var position = channel.position;
      var rateLimitPerUser = channel.rateLimitPerUser;

      await channel.delete();
      channel = await obj.interaction.guild.channels.create(name, { type, topic, nsfw, parent, permissionOverwrites, position, rateLimitPerUser });
      
      await author.user.send("Deleted all message in the channel **" + obj.interaction.channel.name + "** of the server **" + obj.interaction.guild.name + "**.");
      return await obj.interaction.reply(`Deleted all messages in <#${channel.id}>.`);
    } else {
      try {
        await channel.bulkDelete(amount, true);
        await obj.interaction.reply(`Deleted ${amount} messages in <#${channel.id}>.`);
        await obj.interaction.delete({ timeout: 10000 });
      } catch (err) {
        await obj.interaction.reply("I can't delete them. Try a smaller amount.");
      }
    }
  }

  async run(message, args) {
    if (!message.guild) return await message.channel.send("This command only works on server.");

    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if (!message.guild.me.permissions.has(this.permissions) || !message.channel.permissionsFor(message.guild.me).has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    if (!args[0]) return await message.channel.send("You didn't provide any amount!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);

    var amount = parseInt(args[0]);
    if (isNaN(amount)) {
      var channelID = parseInt(args[0].replace(/<#/g, "").replace(/>/g, ""));
      if (isNaN(channelID)) {
        if (args[0] == "all") {
          if (!message.member.permissions.has(16)) return await message.channel.send(genPermMsg(16, 0));
          if (!message.guild.me.permissions.has(16)) return await message.channel.send(genPermMsg(16, 1));
          var name = message.channel.name;
          var type = message.channel.type;
          var topic = message.channel.topic;
          var nsfw = message.channel.nsfw;
          var parent = message.channel.parent;
          var permissionOverwrites = message.channel.permissionOverwrites;
          var position = message.channel.position;
          var rateLimit = message.channel.rateLimitPerUser;

          await message.channel.delete();
          await message.guild.channels.create(name, { type, topic, nsfw, parent, permissionOverwrites, position, rateLimit });
          await message.author.send(`Deleted all message in the channel **${message.channel.name}** of the server **${message.guild.name}**.`);
        } else await message.channel.send("The query provided is not a number!");
        return;
      } else {
        const channel = await message.guild.channels.fetch(channelID);
        if (!channel) return message.channel.send("The channel is not valid!");
        if (!args[1]) return message.channel.send("You didn't provide any amount!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
        amount = parseInt(args[1]);
        if (isNaN(amount)) {
          if (args[1] == "all") {
            if (!message.member.permissions.has(16)) return await message.channel.send(genPermMsg(16, 0));
            if (!message.guild.me.permissions.has(16)) return await message.channel.send(genPermMsg(16, 1));
            message.author.send("Deleted all message in the channel **" + message.channel.name + "** of the server **" + message.guild.name + "**.");
            var name = channel.name;
            var type = channel.type;
            var topic = channel.topic;
            var nsfw = channel.nsfw;
            var parent = channel.parent;
            var permissionOverwrites = channel.permissionOverwrites;
            var position = channel.position;
            var rateLimit = channel.rateLimitPerUser;

            await channel.delete();
            await message.guild.channels.create(name, { type, topic, nsfw, parent, permissionOverwrites, position, rateLimit });
          } else await message.channel.send("The query provided is not a number!");
          return;
        }
      }
    } else {
      await message.delete();
      message.channel.bulkDelete(amount, true).catch(err => {
        NorthClient.storage.error(err);
        message.channel.send("I can't delete them. Try a smaller amount.");
      });
    }
  }
};

const cmd = new DeleteCommand();
export default cmd;