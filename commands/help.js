var color = Math.floor(Math.random() * 16777214) + 1;

const { prefix } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
  name: "help",
  description: "Send you a DM with an embed of “help” and this PDF file.",
  aliases: ["commands"],
  usage: "[command]",
  cooldown: 5,
  execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      const attachment = new Discord.MessageAttachment(
        "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fmanual.pdf?v=1588603370636", "manual.pdf"
      );
      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle("Command list is here!")
        .setDescription(
          `You can send \`${prefix}help [command name]\` to get info on a specific command!\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`
        )
        .setThumbnail(message.client.user.displayAvatarURL())
        .addField(
          "**Managements**",
          "delete\nrole\nunrole\naddrole\ndelrole\nautorole\nannounce",
          true
        )
        .addField(
          "**Moderator**",
          "ban\nunban\nkick\nwarn\nunwarn\nmute\nunmute\ndeafen\nundeafen",
          true
        )
        .addField("**Economy**", "work\nbank\nshop", true)
        .addField("**Fun**", "chat\nreddit\nrng\ngreet\nthx\nrank", true)

        .addField(
          "**Miscellaneous**",
          "giveaway\npoll\ngoogle\nspam\ntrade",
          true
        )
        .addField("**NSFW**", "hentai\nrule34\nporn", true)
        .addField(
          "**Information**",
          "help\nserver\nping\navatar\nwelcome\nrole-info",
          true
        )
        .addField("**API**", "minecraft\nhypixel\nkrunker\naki\nurban\noxford\nspeedrun\nwiki", true)
        .addField(
          "**Music**",
          "play\nskip\nstop\nnowplaying\nqueue\nshuffle\npause\nresume\nremove\nmove\nloop\nrepeat\nmigrate\nvolume",
          true
        )

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
    if(command.regions)
      data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands)
      data.push(
        "\nIf you want to know how subcommands work, please refer to the manual."
      );

    message.channel.send(data, { split: true });
  }
};
