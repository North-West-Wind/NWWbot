const Discord = require("discord.js");

module.exports = {
  name: "delete",
  description: "Delete specific amount of messages.",
  aliases: ["del"],
  args: true,
  usage: "<amount of messages>",
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
      return message.channel.send("You didn't provide any number!");
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount)) {
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
      
    await message.delete();
      message.channel.bulkDelete(amount, true).catch(err => {
        console.error(err);
        message.channel.send("I can't delete them. Try a smaller amount.");
      });
    }
  }
};
