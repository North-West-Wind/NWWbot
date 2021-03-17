const Discord = require("discord.js");
const { color } = require("../function");
const categories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "Under Development", "Dev Command"];
const sCategories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "InDev", "Dev"];
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandOptionChoice, InteractionResponse } = require("../classes/Slash");
module.exports = {
  name: "help",
  description: "Send you a DM with an embed of “help” and this PDF file.",
  usage: "[command]",
  cooldown: 5,
  category: 6,
  slashInit: true,
  register: () => {
    const cmd = ApplicationCommand.createBasic(module.exports);
    cmd.setOptions([new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "all", "Display all the commands.")]);
    for (const category of sCategories) {
      const option = new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), category.toLowerCase(), `${category} - Command Category`);
      const filtered = Array.from(NorthClient.storage.commands.filter(x => x.category === sCategories.indexOf(category)).keys());
      const fetchOpt = new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "command", "The command to fetch.");
      fetchOpt.setChoices([]);
      for (const command of filtered) fetchOpt.choices.push(new ApplicationCommandOptionChoice(command, command));
      option.setOptions([fetchOpt]);
      cmd.options.push(option);
    }
    return cmd;
  },
  slash: async(client, interaction, args) => {
    if (args[0]?.value === "all" || !args[0]?.options[0]?.value) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Command list is here!")
        .setDescription(`[**Click this**](https://northwestwind.ml/manual.pdf) for the user manual.\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`)
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
      for (let i = 0; i < categories.length; i++) Embed.addField(`**${categories[i]}**`, Array.from(commands.filter(x => x.category === i).keys()).join("\n"), true);
      setTimeout(async() => {
        await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({
          data: {
            content: "This is the **[manual](https://northwestwind.ml/manual.pdf)**, my friend.",
            embed: null
          }
        })
      }, 60000);
      return InteractionResponse.sendEmbeds(Embed);
    }

    const name = args[0]?.options[0]?.value?.toLowerCase();
    const command = NorthClient.storage.commands.get(name) || NorthClient.storage.commands.find(c => c.aliases && c.aliases.includes(name));
    if (!command) return InteractionResponse.sendMessage("That's not a valid command!");
    const data = [`**Name:** ${command.name}`];

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** /${command.name} ${command.usage}`);
    else data.push(`**Usage:** /${command.name}`);
    if (command.subcommands) {
      const strs = [];
      for (let i = 0; i < command.subcommands.length; i++) {
        var str = "    • ";
        if (command.subaliases) str = `**${command.subcommands[i]} | ${command.subaliases[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        else str = `**${command.subcommands[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        str += "\n        • "
        if (command.subusage && (command.subusage[i] || command.subusage[i] == 0) && !isNaN(command.subusage[i])) str += `/${command.name} ${command.subusage[command.subusage[i]].replace("<subcommand>", command.subcommands[i])}`;
        else if (command.subusage && command.subusage[i]) str += `/${command.name} ${command.subusage[i].replace("<subcommand>", command.subcommands[i])}`;
        else str += `/${command.name} ${command.usage ? command.usage.replace(/(?!\s)[\<\[\w\s\|]*subcommand[\w\s\|\>\]]*/, command.subcommands[i]) : command.subcommands[i]}`;
        strs.push(str);
      }
      data.push(`**Subcommands:**\n${strs.join("\n")}`);
    }
    if (command.regions) data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands) data.push("\nIf you want to know how subcommands work, please refer to the manual.");
    return InteractionResponse.sendMessage(data.join("\n"));
  },
  async execute(message, args) {
    const data = [];
    const { commands } = NorthClient.storage;

    if (!args.length) {
      const Embed = new Discord.MessageEmbed()
        .setColor(color())
        .setTitle("Command list is here!")
        .setDescription(`[**Click this**](https://northwestwind.ml/manual.pdf) for the user manual.\nYou can send \`${message.prefix}${this.name} ${this.usage}\` to get info on a specific command!\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`)
        .setThumbnail(message.client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      for (let i = 0; i < categories.length; i++) Embed.addField(`**${categories[i]}**`, Array.from(commands.filter(x => x.category === i).keys()).join("\n"), true);
      const msg = await message.channel.send(Embed);
      setTimeout(async() => {
        await msg.edit({ content: "This is the **manual**, my friend:\nhttps://northwestwind.ml/manual.pdf", embed: null });
      }, 60000);
      return;
    }
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
    if (!command) return message.reply("that's not a valid command!");
    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${message.prefix}${command.name} ${command.usage}`);
    else data.push(`**Usage:** ${message.prefix}${command.name}`);
    if (command.subcommands) {
      const strs = [];
      for (let i = 0; i < command.subcommands.length; i++) {
        var str = "    • ";
        if (command.subaliases) str = `**${command.subcommands[i]} | ${command.subaliases[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        else str = `**${command.subcommands[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        str += "\n        • "
        if (command.subusage && (command.subusage[i] || command.subusage[i] == 0) && !isNaN(command.subusage[i])) str += `${message.prefix}${command.name} ${command.subusage[command.subusage[i]].replace("<subcommand>", command.subcommands[i])}`;
        else if (command.subusage && command.subusage[i]) str += `${message.prefix}${command.name} ${command.subusage[i].replace("<subcommand>", command.subcommands[i])}`;
        else str += `${message.prefix}${command.name} ${command.usage ? command.usage.replace(/(?!\s)[\<\[\w\s\|]*subcommand[\w\s\|\>\]]*/, command.subcommands[i]) : command.subcommands[i]}`;
        strs.push(str);
      }
      data.push(`**Subcommands:**\n${strs.join("\n")}`);
    }
    if (command.regions) data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands) data.push("\nIf you want to know how subcommands work, please refer to the manual.");
    await message.channel.send(data, { split: true });
  }
};
