var color = Math.floor(Math.random() * 16777214) + 1;
const Discord = require("discord.js");
const client = new Discord.Client();
module.exports = {
  name: "profile",
  description: "Display profile of yourself.",
  execute(message, args) {
    if (!args[0]) {
      const id = message.author.id;
      const username = message.author.username;
      const tag = "#" + message.author.discriminator;
      const Embed = new Discord.RichEmbed()
        .setTitle("Profile of " + username)
        .addField("ID", id, true)
        .addField("Username", username, true)
        .addField("Tag/Discriminator", tag, true)
        .setColor(color)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL);
      message.channel.send(Embed);
    } else {
      if (message.channel instanceof Discord.DMChannel) {
       return message.channel.send("Mentions in this command only works in servers.")
     }
      const tagged = message.mentions.users.first();
      if (tagged) {
        const id = tagged.id;
        const username = tagged.username;
        const tag = tagged.discriminator;
        const Embed = new Discord.RichEmbed()
          .setTitle("Profile of " + username)
          .addField("ID", id, true)
          .addField("Username", username, true)
          .addField("Tag/Discriminator", tag, true)
          .setColor(color)
          .setTimestamp()
          .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL);
        message.channel.send(Embed);
      } else {
        const user = client.users.find(x => x.username === args.join(" "));
        if (user === null) {
          message.channel.send(
            "No users named " + args.join(" ") + " were found!"
          );
        } else {
          
          const id = user.id;
          const username = user.username;
          const tag = user.discriminator;
          const Embed = new Discord.RichEmbed()
            .setTitle("Profile of " + username)
            .addField("ID", id, true)
            .addField("Username", username, true)
            .addField("Tag/Discriminator", tag, true)
            .setColor(color)
            .setTimestamp()
            .setFooter(
              "Have a nice day! :)",
              message.client.user.displayAvatarURL
            );
          message.channel.send(Embed);
        }
      }
    }
  }
};
