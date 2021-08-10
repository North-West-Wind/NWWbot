import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, deepReaddir, wait } from "../../function";
import * as Discord from "discord.js";

import { AkiCommand } from "../api/aki";
import { globalClient as client } from "../../common";

const categories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "Under Development", "Dev Command"];
export const sCategories = ["Managements", "Moderator", "Economy", "Fun", "Miscellaneous", "NSFW", "Information", "API", "Music", "InDev", "Dev"];

class HelpCommand implements SlashCommand {
  name = "help"
  description = "Send you a DM with an embed of “help” and this PDF file."
  usage = "[command]"
  cooldown = 5
  category = 6
  options: any[];

  constructor() {
    this.options = [
      {
        name: "all",
        description: "Display all the commands.",
        type: "SUB_COMMAND"
      }
    ];
    const commandFiles = deepReaddir("../commands").filter(file => file.endsWith(".js"));
    for (const category of sCategories) {
      const fetchOpt = {
        name: "command",
        description: "The command to fetch.",
        required: true,
        type: "STRING",
        choices: commandFiles.map(file => require(file)).filter(command => command.category === sCategories.indexOf(category)).map(x => ({ name: x.name, value: x.name }))
      };
      const option = {
        name: category.toLowerCase(),
        description: `${category} - Command Category`,
        type: "SUB_COMMAND",
        options: [fetchOpt]
      };
      this.options.push(option);
    }
  }

  async execute(interaction: NorthInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "all") {
      await interaction.reply({embeds: [this.getAllCommands()]});
      await wait(60000);
      await interaction.editReply({
        content: "This is the **[manual](https://northwestwind.ml/manual.pdf)**, my friend.",
        embeds: null
      });
      return;
    }

    const name = interaction.options.getString("command").toLowerCase();
    await interaction.reply(this.getCommand(name, "/").join("\n"));
  }

  async run(message: NorthMessage, args: string[]) {
    if (!args.length) {
      const msg = await message.channel.send({embeds: [this.getAllCommands()]});
      setTimeout(async () => await msg.edit({ content: "This is the **manual**, my friend:\nhttps://northwestwind.ml/manual.pdf", embeds: null }), 60000);
      return;
    }
    const name = args[0].toLowerCase();
    await message.channel.send(this.getCommand(name, message.prefix).join("\n"));
  }

  getAllCommands() {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Command list is here!")
      .setDescription(`[**Click this**](https://northwestwind.ml/manual.pdf) for the user manual.\nIf you need any support, you can join the [**Support Server**](https://discord.gg/S44PNSh)\n\nI don't know if you need but [**here's me**](https://top.gg/bot/649611982428962819) in [**Discord bot List**](https://top.gg)!`)
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
    for (let i = 0; i < categories.length; i++) Embed.addField(`**${categories[i]}**`, Array.from(NorthClient.storage.commands.filter(x => x.category === i).keys()).join("\n"), true);
    return Embed;
  }

  getCommand(name, prefix) {
    const data = [];
    const { commands } = NorthClient.storage;
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
    if (!command) return ["That's not a valid command!"];
    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
    else data.push(`**Usage:** ${prefix}${command.name}`);
    if (command.subcommands) {
      const strs = [];
      for (let i = 0; i < command.subcommands.length; i++) {
        var str = "    • ";
        if (command.subaliases) str = `**${command.subcommands[i]} | ${command.subaliases[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        else str = `**${command.subcommands[i]}**${command.subdesc ? ` - ${command.subdesc[i]}` : ""}`;
        str += "\n        • "
        if (command.subusage && (command.subusage[i] || command.subusage[i] == 0) && !isNaN(<number>command.subusage[i])) str += `${prefix}${command.name} ${command.subusage[command.subusage[i]].replace("<subcommand>", command.subcommands[i])}`;
        else if (command.subusage && command.subusage[i]) str += `${prefix}${command.name} ${command.subusage[i].toString().replace("<subcommand>", command.subcommands[i])}`;
        else str += `${prefix}${command.name} ${command.usage ? command.usage.replace(/(?!\s)[\<\[\w\s\|]*subcommand[\w\s\|\>\]]*/, command.subcommands[i]) : command.subcommands[i]}`;
        strs.push(str);
      }
      data.push(`**Subcommands:**\n${strs.join("\n")}`);
    }
    if (command instanceof AkiCommand) data.push(`**Regions:** ${command.regions.join(", ")}`)
    if (command.subcommands) data.push("\nIf you want to know how subcommands work, please refer to the manual.");
    return data;
  }
};

const cmd = new HelpCommand();
export default cmd;