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
        message.author.send("Deleting all message in the channel **" + message.channel.name + "** of the server **" + message.guild.name + "**...");
        let fetched;
        fetched = await message.channel.messages.fetch();
        async function deleteAll(fetched) {
          
          if(fetched.size == 0) {
            message.author.send("Finished deleting.");
            return;
          } else {
            await message.channel.bulkDelete(100).catch(console.error)
            fetched = await message.channel.messages.fetch()
            deleteAll(fetched);
          }
        }
        deleteAll(fetched);

        
        
      } else return message.channel.send("The query provided is not a number!");
    } else {
      message.delete();
      message.channel.bulkDelete(amount, true).catch(err => {
        console.error(err);
        message.channel.send("I can't delete them. Try a smaller amount.");
      });
    }
  }
};
