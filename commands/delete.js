const Discord = require("discord.js");

module.exports = {
  name: "delete",
  description: "Delete a specific amount of message in a channel. Sadly, this command does not work for DMs.",
  aliases: ["del"],
  args: true,
  usage: "[channel] <amount | subcommand | start> [end]",
  subcommands: ["all"],
  async execute(message, args) {
    if (message.channel instanceof Discord.DMChannel) {
      return message.channel.send(
        "This command doesn't work for direct messages."
      );
    }

    if (!message.member.permissions.has(8192)) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has(8192)) {
      message.channel.send(`I don\'t have the permission to delete messages.`);
      return;
    }
    if (!args[0]) {
      return message.channel.send("You didn't provide any amount!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
    }

    var amount = parseInt(args[0]);

    if (isNaN(amount)) {
      var channelID = parseInt(args[0].replace(/<#/g, "").replace(/>/g, ""));
      if(isNaN(channelID)) {
        if (args[0] == "all") {
          if (!message.member.permissions.has(16)) {
              message.channel.send(
                `You don\'t have the permission to use this command.`
            );
            return;
          }
          if (!message.guild.me.permissions.has(16)) {
            message.channel.send(`I don\'t have the permission to delete all messages.`);
            return;
          }
          message.author.send("Deleted all message in the channel **" + message.channel.name + "** of the server **" + message.guild.name + "**.");
          var name = message.channel.name;
          var type = message.channel.type;
          var topic = message.channel.topic;
          var nsfw = message.channel.nsfw;
          var parent = message.channel.parent;
          var permissionOverwrites = message.channel.permissionOverwrites;
          var position = message.channel.position;
          var rateLimit = message.channel.rateLimitPerUser;
          
          message.guild.channels.create(name, { type: type, topic: topic, nsfw: nsfw, parent: parent, permssionOverwrites: permissionOverwrites, position: position, rateLimit: rateLimit });
          message.channel.delete();
          return;
        } else return message.channel.send("The query provided is not a number!");
      } else {
        var channel = await message.guild.channels.fetch(channelID);
        if(!channel) return message.channel.send("The channel is not valid!");
        if (!args[1]) return message.channel.send("You didn't provide any amount!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
        amount = parseInt(args[1]);
        if(isNaN(amount)) {
          
            if (args[1] == "all") {
              if (!message.member.permissions.has(16)) {
                message.channel.send(
                  `You don\'t have the permission to use this command.`
              );
              return;
            }
            if (!message.guild.me.permissions.has(16)) {
              message.channel.send(`I don\'t have the permission to delete all messages.`);
              return;
            }
            message.author.send("Deleted all message in the channel **" + message.channel.name + "** of the server **" + message.guild.name + "**.");
            var name = channel.name;
            var type = channel.type;
            var topic = channel.topic;
            var nsfw = channel.nsfw;
            var parent = channel.parent;
            var permissionOverwrites = channel.permissionOverwrites;
            var position = channel.position;
            var rateLimit = channel.rateLimitPerUser;
          
            message.guild.channels.create(name, { type: type, topic: topic, nsfw: nsfw, parent: parent, permssionOverwrites: permissionOverwrites, position: position, rateLimit: rateLimit });
            channel.delete();
            return;
          } else return message.channel.send("The query provided is not a number!");
        }
      }
    } else {
      
    await message.delete();
      message.channel.bulkDelete(amount, true).catch(err => {
        console.error(err);
        message.channel.send("I can't delete them. Try a smaller amount.");
      });
    }
  }
};
