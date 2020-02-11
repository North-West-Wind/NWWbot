var color = Math.floor(Math.random() * 16777214) + 1;

const { prefix } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
  name: "help",
  description: "List all of my commands or info about a specific command.",
  aliases: ["commands"],
  usage: "[command name]",
  cooldown: 5,
  execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Command list is here!")
        .setDescription(
          `You can send ${prefix}help [command name] to get info on a specific command!`
        )
        .setThumbnail(message.client.user.displayAvatarURL())
        .addField(
          "**Managements**",
          "delete\nrole\nunrole\naddrole\ndelrole",
          true
        )
        .addField("**Moderator**", "ban\nkick\nwarn", true)

        .addField(
          "**Random stuff**",
          "greet\nthx\nspam\nmath\ntrade\nchat\nmeme",
          true
        )
        .addField("**Economy**", "work\nbank\nshop", true)

        .addField("**Misc**", "giveaway\npoll", true)
        .addField("**NSFW**", "hentai", true)
        .addField("**Information**", "help\nserver\nping\navatar", true)
        .addField("**API**", "minecraft\nhypixel\nkrunker\naki", true)
        .addField(
          "**Music**",
          "play\nskip\nstop\nnowplaying\nqueue\nshuffle\npause\nresume\nremove\nloop",
          true
        )

        .setTimestamp()
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );

      return message.author
        .send(Embed)
        .then(() => {
          if (message.channel.type === "dm") return;
          message.reply("Look at your DM!");
        })
        .catch(error => {
          console.error(
            `Could not send help DM to ${message.author.tag}.\n`,
            error
          );
          message.reply("why don't you let me DM you ;-;");
        });
    }
    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply("that's not a valid command!");
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases)
      data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    if (command.description)
      data.push(`**Description:** ${command.description}`);
    if (command.usage)
      data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
    if (command.subcommands)
      data.push(`**Subcommands:** ${command.subcommands.join(", ")}`);
    if (command.subaliases)
      data.push(`**Subcommands' Aliases:** ${command.subaliases.join(", ")}`);

    message.channel.send(data, { split: true });
  }
};
