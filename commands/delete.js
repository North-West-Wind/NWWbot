const Discord = require("discord.js");
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash.js");
const { genPermMsg } = require("../function.js");

module.exports = {
  name: "delete",
  description: "Delete a specific amount of message in a channel. Sadly, this command does not work for DMs.",
  aliases: ["del"],
  usage: "[channel] <amount | subcommand | start> [end]",
  subcommands: ["all"],
  subdesc: ["Deletes everything in the channel."],
  subusage: ["[channel] <subcommand>"],
  category: 0,
  args: 1,
  permissions: 8192,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "amount", "The amount of messages to delete.").setRequired(true),
    new ApplicationCommandOption(ApplicationCommandOptionType.CHANNEL.valueOf(), "channel", "The channel of the messages."),
    new ApplicationCommandOption(ApplicationCommandOptionType.BOOLEAN.valueOf(), "all", "Whether or not to delete all messages in the channel.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    const cChannel = await client.channels.fetch(interaction.channel_id);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if (!guild.me.permissions.has(this.permissions) || !cChannel.permissionsFor(message.guild.me).has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));

    var amount = parseInt(args[0].value);
    var channel = cChannel;
    if (args[1]?.value) channel = await client.channels.fetch(args[1].value);
    if (!channel) return InteractionResponse.sendMessage("The channel is not valid!");
    if (args[2]?.value) {
      if (!author.permissions.has(16)) return InteractionResponse.sendMessage(genPermMsg(16, 0));
      if (!guild.me.permissions.has(16)) return InteractionResponse.sendMessage(genPermMsg(16, 1));
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
      
      await author.user.send("Deleted all message in the channel **" + message.channel.name + "** of the server **" + message.guild.name + "**.");
      return InteractionResponse.sendMessage(`Deleted all messages in ${channel.name}.`);
    } else {
      try {
        await channel.bulkDelete(amount, true);
        return InteractionResponse.sendMessage(`Deleted ${amount} messages in ${channel.name}.`);
      } catch (err) {
        return InteractionResponse.sendMessage("I can't delete them. Try a smaller amount.");
      }
    }
  },
  async execute(message, args) {
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
