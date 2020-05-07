const Discord = require("discord.js");
const { prefix } = require("../config.json")

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

    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if (!message.guild.me.permissions.has("MANAGE_MESSAGES")) {
      message.channel.send(`I don\'t have the permission to delete messages.`);
      return;
    }
    if (!args[0]) {
      return message.channel.send("You didn't provide any amount!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``);
    }

    var amount = parseInt(args[0]);
    /*
    if(!args[1]) {
      var msg = await message.channel.messages.fetch(amount).catch(console.error);
      if(!msg) return message.channel.send("That is not a valid message!");
      await message.channel.messages.fetch().catch(console.error);
      var deleting = await message.channel.messages.fetch({ before: msg.id, limit: 100 });
      if(deleting.size > 100) {
        for(const mesg of deleting.values()) {
          mesg.delete();
        }
      } else message.channel.bulkDelete(deleting).catch(console.error);
      message.delete();
    } else {
      var msg = await message.channel.messages.fetch(args[0]);
      var msg2 = await message.channel.messages.fetch(args[1]);
      if(!msg) return message.channel.send("That is not a valid message!");
      if(!msg2) return message.channel.send("That is not a valid message!");
      var deleting = await message.channel.messages.cache.filter(x => x.id >= msg.id && x.id <= msg2.id && !x.deleted && x);
      if(deleting.size > 100) {
        for(const mesg of deleting.values()) {
          mesg.delete();
        }
      } else message.channel.bulkDelete(deleting).catch(console.error);
      message.delete();
    }
    */

    if (isNaN(amount)) {
      var channelID = parseInt(args[0].replace(/<#/g, "").replace(/>/g, ""));
      if(isNaN(channelID)) {
        if (args[0] == "all") {
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
          
        } else return message.channel.send("The query provided is not a number!");
      } else {
        var channel = await message.guild.channels.fetch(channelID);
        if(!channel) return message.channel.send("The channel is not valid!");
        if (!args[1]) return message.channel.send("You didn't provide any amount!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``);
        amount = parseInt(args[1]);
        if(isNaN(amount)) {
          
          if (args[1] == "all") {
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
          
          } else return message.channel.send("The query provided is not a number!");
        }
        /*
        if(!args[2]) {
          var msg = await channel.messages.fetch(args[1]);
          if(!msg) return message.channel.send("That is not a valid message!");
          var deleting = await channel.messages.cache.filter(x => x.id >= msg.id && !x.deleted);
          if(deleting.size > 100) {
            for(const mesg of deleting.values()) {
              mesg.delete();
            }
          } else channel.bulkDelete(deleting).catch(console.error);
          message.delete();
        } else {
          var msg = await channel.messages.fetch(args[1]);
          var msg2 = await channel.messages.fetch(args[2]);
          if(!msg) return message.channel.send("That is not a valid message!");
          if(!msg2) return message.channel.send("That is not a valid message!");
          var deleting = await channel.messages.cache.filter(x => x.id >= msg.id && x.id <= msg2.id && !x.deleted);
          if(deleting.size > 100) {
            for(const mesg of deleting.values()) {
              mesg.delete();
            }
          } else channel.bulkDelete(deleting).catch(console.error);
          message.delete();
        }
        */
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
