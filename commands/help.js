var color = Math.floor(Math.random() * 16777214) + 1;
const Discord = require("discord.js");
module.exports = {
  name: "help",
  description: "Send you a DM with an embed of “help” and this PDF file.",
  aliases: ["commands"],
  usage: "[command]",
  cooldown: 5,
  category: 6,
  execute(message, args) {
    const data = [];
    const { commands } = console;

    if (!args.length) {
      const attachment = new Discord.MessageAttachment(
        "https://drive.google.com/uc?export=download&id=114RCw-5oiYTgHGSpNIotMNd7rlgknfiy", "manual.pdf"
      );
      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Command list is here!")
        .setDescription(
          `You can send \`${message.client.prefix}help [command name]\` to get info on a specific command!\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`
        )
        .setThumbnail(message.client.user.displayAvatarURL())
        .addField(
          "**Managements**", Array.from(commands.filter(x => x.category === 0).keys()).join("\n"),
          true
        )
        .addField(
          "**Moderator**", Array.from(commands.filter(x => x.category === 1).keys()).join("\n"),
          true
        )
        .addField("**Economy**", Array.from(commands.filter(x => x.category === 2).keys()).join("\n"), true)
        .addField("**Fun**", Array.from(commands.filter(x => x.category === 3).keys()).join("\n"), true)

        .addField(
          "**Miscellaneous**", Array.from(commands.filter(x => x.category === 4).keys()).join("\n"),
          true
        )
        .addField("**NSFW**", Array.from(commands.filter(x => x.category === 5).keys()).join("\n"), true)
        .addField(
          "**Information**", Array.from(commands.filter(x => x.category === 6).keys()).join("\n"),
          true
        )
        .addField("**API**", Array.from(commands.filter(x => x.category === 7).keys()).join("\n"), true)
        .addField(
          "**Music**", Array.from(commands.filter(x => x.category === 8).keys()).join("\n"),
          true
        )
        .addField("**Under Development**", Array.from(commands.filter(x => x.category === 9).keys()).join("\n"), true)
        .addField("**Dev Command**", Array.from(commands.filter(x => x.category === 10).keys()).join("\n"), true)
        .setTimestamp()
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );

      return message.author
        .send([Embed, attachment])
        .then(() => {
          if (message.channel.type === "dm") return;
          message.reply("look at your DM!");
        })
        .catch(error => {
          console.error(
            `Could not send help DM to ${message.author.tag}.\n`,
            error
          );
          message.reply("there was an error trying to send you a DM!");
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
      data.push(`**Usage:** ${message.client.prefix}${command.name} ${command.usage}`);
    if (command.subcommands)
      data.push(`**Subcommands:** ${command.subcommands.join(", ")}`);
    if (command.subaliases)
      data.push(`**Subcommands' Aliases:** ${command.subaliases.join(", ")}`);
    if (command.regions)
      data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands)
      data.push(
        "\nIf you want to know how subcommands work, please refer to the manual."
      );

    message.channel.send(data, { split: true });
  }
};
